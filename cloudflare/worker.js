import { FirestoreRest, SERVER_TIMESTAMP, verifyFirebaseToken, fromFields } from './firebase-rest.js'

const response = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } })
const FREE_CREDIT_CAMPAIGN_ID = 'audinoo-free-credit-v1'
const SUNO_GENERATE_URL = 'https://api.sunoapi.org/api/v1/generate'
const SUNO_STATUS_URL = 'https://api.sunoapi.org/api/v1/generate/record-info'
const FAILED = new Set(['CREATE_TASK_FAILED','GENERATE_AUDIO_FAILED','CALLBACK_EXCEPTION','SENSITIVE_WORD_ERROR'])

async function userFrom(request, env) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  return token ? verifyFirebaseToken(token, env) : null
}
function tracksIn(value, output = [], depth = 0) {
  if (depth > 8 || value == null) return output
  if (Array.isArray(value)) { for (const x of value) tracksIn(x, output, depth + 1); return output }
  if (typeof value !== 'object') return output
  if (typeof value.audio_url === 'string' && /^https:\/\//i.test(value.audio_url)) {
    output.push({ id: typeof value.id === 'string' ? value.id : '', title: typeof value.title === 'string' ? value.title : 'Ta création Audinoo', audioUrl: value.audio_url, imageUrl: typeof value.image_url === 'string' && /^https:\/\//i.test(value.image_url) ? value.image_url : '', duration: Number.isFinite(Number(value.duration)) ? Number(value.duration) : null })
    return output
  }
  Object.values(value).forEach(x => tracksIn(x, output, depth + 1))
  return output
}
async function generate(request, env, db, user) {
  if (request.method !== 'POST') return response(405, { error: 'method-not-allowed' })
  if (!env.SUNOAPI_KEY) return response(503, { error: 'music-provider-not-configured' })
  let body
  try { body = await request.json() } catch { return response(400, { error: 'invalid-json' }) }
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  const customMode = body.customMode === true
  const style = typeof body.style === 'string' ? body.style.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (prompt.length < 10) return response(400, { error: 'prompt-too-short' })
  if (customMode && (prompt.length > 5000 || style.length > 1000 || title.length > 80)) return response(400, { error: 'prompt-too-long' })
  if (customMode && (!style || !title)) return response(400, { error: 'advanced-fields-required' })
  if (!customMode && prompt.length > 400) return response(400, { error: 'prompt-too-long' })
  const profile = 'users/' + user.uid, lock = 'generationLocks/' + user.uid, requestId = crypto.randomUUID()
  let campaign = null
  await db.runTransaction(async tx => {
    const [p, policy, l] = await Promise.all([tx.get(db.doc(profile)), tx.get(db.doc('settings/credits')), tx.get(db.doc(lock))])
    if (!p.exists) throw new Error('profile-not-found')
    if (l.exists) throw new Error('generation-already-running')
    const data = p.data(), rules = policy.exists ? policy.data() : { enabled: true, activeCampaignId: FREE_CREDIT_CAMPAIGN_ID }
    campaign = data.freeCreditCampaignId || (!data.freeCreditPolicyAssigned ? FREE_CREDIT_CAMPAIGN_ID : null)
    if (!rules.enabled || !campaign || campaign !== rules.activeCampaignId || data.freeCreditUsed === true) throw new Error('no-free-credit')
    tx.create(db.doc(lock), { requestId, uid: user.uid, campaignId: campaign, createdAt: SERVER_TIMESTAMP })
  })
  const provider = await fetch(SUNO_GENERATE_URL, { method: 'POST', headers: { authorization: 'Bearer ' + env.SUNOAPI_KEY, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ prompt, ...(customMode ? { style, title } : {}), customMode, instrumental: false, model: 'V6', callBackUrl: (env.PUBLIC_BASE_URL || new URL(request.url).origin) + '/api/suno-callback' }), signal: AbortSignal.timeout(25000) })
  const result = await provider.json().catch(() => ({}))
  if (!provider.ok || result.code !== 200 || !result.data?.taskId) {
    await db.runTransaction(async tx => { const [p,l] = await Promise.all([tx.get(db.doc(profile)),tx.get(db.doc(lock))]); if (l.exists && l.data().requestId === requestId) tx.delete(db.doc(lock)); if (p.exists && p.data().freeCreditCampaignId === campaign) { /* welcome credit remains unused */ } })
    return response(502, { error: 'music-provider-rejected-request', providerCode: Number(result.code), providerMessage: typeof result.msg === 'string' ? result.msg : '' })
  }
  const taskId = String(result.data.taskId)
  await db.runTransaction(async tx => {
    const [p,l] = await Promise.all([tx.get(db.doc(profile)),tx.get(db.doc(lock))])
    if (!p.exists || !l.exists || l.data().requestId !== requestId) throw new Error('generation-reservation-lost')
    tx.update(db.doc(profile), { freeCreditUsed: true, freeCreditUsedAt: SERVER_TIMESTAMP })
    tx.delete(db.doc(lock))
    tx.create(db.doc(profile + '/generations/' + taskId), { taskId, uid: user.uid, title: title.slice(0,80), prompt: prompt.slice(0,5000), state: 'PENDING', createdAt: SERVER_TIMESTAMP })
  })
  return response(202, { taskId, status: 'PENDING', freeCreditUsed: true })
}
async function generationStatus(request, env, db, user) {
  if (request.method !== 'GET') return response(405, { error: 'method-not-allowed' })
  if (!env.SUNOAPI_KEY) return response(503, { error: 'music-provider-not-configured' })
  const taskId = new URL(request.url).searchParams.get('taskId') || ''
  if (!/^[a-zA-Z0-9_-]{6,120}$/.test(taskId)) return response(400, { error: 'invalid-task-id' })
  const path = 'users/' + user.uid + '/generations/' + taskId
  if (!(await db.get(path)).exists) return response(404, { error: 'generation-not-found' })
  const r = await fetch(SUNO_STATUS_URL + '?taskId=' + encodeURIComponent(taskId), { headers: { authorization: 'Bearer ' + env.SUNOAPI_KEY, accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
  const body = await r.json().catch(() => ({}))
  if (!r.ok || body.code !== 200) return response(502, { error: 'music-status-unavailable' })
  const data = body.data || {}, state = String(data.status || data.taskStatus || body.status || 'PENDING').toUpperCase(), tracks = tracksIn(data)
  await db.set(path, { state, ...(tracks.length ? { tracks } : {}) }, true)
  return response(200, { taskId, status: state, completed: ['SUCCESS','COMPLETE','COMPLETED'].includes(state), failed: FAILED.has(state), tracks })
}
async function library(request, db, user) {
  if (request.method !== 'GET') return response(405, { error: 'method-not-allowed' })
  const result = await db.request('projects/audinoo/databases/(default)/documents/users/' + user.uid + '/generations?pageSize=30&orderBy=createdAt%20desc')
  const generations = (result.documents || []).map(d => { const x = fromFields(d.fields || {}); return { taskId:x.taskId, title:x.title || 'Ta création Audinoo', prompt:x.prompt || '', status:x.state || 'PENDING', tracks:Array.isArray(x.tracks) ? x.tracks : [], createdAt:x.createdAt instanceof Date ? x.createdAt.toISOString() : null } })
  return response(200, { generations })
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not Found',{status:404})
    if (url.pathname === '/api/suno-callback') return request.method === 'POST' ? response(200,{received:true}) : response(405,{error:'method-not-allowed'})
    if (url.pathname === '/api/session-check') {
      if (request.method !== 'GET') return response(405,{error:'method-not-allowed'})
      try { const u = await userFrom(request,env); return u ? response(200,{authenticated:true,uid:u.uid}) : response(401,{error:'authentication-required'}) } catch { return response(401,{error:'invalid-session'}) }
    }
    let user
    try {
      user = await userFrom(request,env)
      if (!user) return response(401,{error:'authentication-required'})
      const db = new FirestoreRest(env)
      if (url.pathname === '/api/generate') return await generate(request,env,db,user)
      if (url.pathname === '/api/generation-status') return await generationStatus(request,env,db,user)
      if (url.pathname === '/api/my-library') return await library(request,db,user)
      return response(404,{error:'not-found'})
    } catch (e) {
      const status = e.message === 'firebase-admin-not-configured' ? 503 : e.message === 'invalid-token' ? 401 : 500
      if (status >= 500) console.error('[Audinoo Cloudflare]',e)
      const err = status === 503 ? 'backend-not-configured' : status === 401 ? 'invalid-session' : url.pathname === '/api/my-library' ? 'library-load-failed' : 'generation-failed'
      return response(status,{error:err})
    }
  }
}
