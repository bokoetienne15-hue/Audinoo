import { FirestoreRest, SERVER_TIMESTAMP, verifyFirebaseToken, fromFields } from './firebase-rest.js'

const response = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } })
const FREE_CREDIT_CAMPAIGN_ID = 'audinoo-free-credit-v1'
const SUNO_GENERATE_URL = 'https://api.sunoapi.org/api/v1/generate'
const SUNO_STATUS_URL = 'https://api.sunoapi.org/api/v1/generate/record-info'
const FAILED = new Set(['CREATE_TASK_FAILED','GENERATE_AUDIO_FAILED','CALLBACK_EXCEPTION','SENSITIVE_WORD_ERROR'])
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000
async function archiveTracks(env, db, path, tracks, uid, taskId) {
  if (!env.AUDIO_BUCKET || !Array.isArray(tracks)) return tracks || []
  const saved = []
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i] || {}
    if (track.r2Key || !/^https:\/\//i.test(track.audioUrl || '')) { saved.push(track); continue }
    try {
      const source = await fetch(track.audioUrl, { signal: AbortSignal.timeout(60000) })
      if (!source.ok || !source.body) { saved.push(track); continue }
      const key = 'private/' + uid + '/' + taskId + '/' + i + '.audio'
      await env.AUDIO_BUCKET.put(key, source.body, { httpMetadata: { contentType: source.headers.get('content-type') || 'audio/mpeg', cacheControl: 'private, no-store' }, customMetadata: { uid, taskId } })
      saved.push({ ...track, r2Key: key, archivedAt: new Date().toISOString() })
    } catch (error) {
      console.error('[Audinoo R2 archive]', error)
      saved.push(track)
    }
  }
  if (saved.some((track, i) => track.r2Key !== tracks[i]?.r2Key)) await db.set(path, { tracks: saved }, true)
  return saved
}


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
const CREDIT_PRICE_XOF = 300
const CREDIT_QUANTITY = 1
function fedapayBase(env) {
  return env.FEDAPAY_ENVIRONMENT === 'sandbox' ? 'https://sandbox-api.fedapay.com/v1' : 'https://api.fedapay.com/v1'
}
function fedapayObject(body, key) {
  return body?.[key] || body?.data?.[key] || body?.[key.replace(/^v1\//, '')] || body?.data || body
}
async function fedapayRequest(env, path, options = {}) {
  if (!env.FEDAPAY_SECRET_KEY) throw new Error('fedapay-not-configured')
  const result = await fetch(fedapayBase(env) + path, {
    ...options,
    headers: { authorization: 'Bearer ' + env.FEDAPAY_SECRET_KEY, accept: 'application/json', ...(options.body ? { 'content-type': 'application/json' } : {}), ...options.headers },
    signal: AbortSignal.timeout(20000)
  })
  const body = await result.json().catch(() => ({}))
  if (!result.ok) {
    console.error('[Audinoo FedaPay]', result.status, body)
    throw new Error('fedapay-request-failed')
  }
  return body
}
async function createCreditPayment(request, env, db, user) {
  if (request.method !== 'POST') return response(405, { error: 'method-not-allowed' })
  if (!env.FEDAPAY_SECRET_KEY) return response(503, { error: 'fedapay-not-configured' })
  const profile = await db.get('users/' + user.uid)
  if (!profile.exists) return response(404, { error: 'profile-not-found' })
  const email = typeof user.email === 'string' ? user.email : ''
  if (!email) return response(400, { error: 'customer-email-required' })
  const origin = new URL(request.url).origin
  const transactionBody = {
    description: 'Audinoo — 1 crédit de génération musicale',
    amount: CREDIT_PRICE_XOF,
    currency: { iso: 'XOF' },
    callback_url: origin + '/?payment_return=1',
    customer: { email }
  }
  const created = await fedapayRequest(env, '/transactions', { method: 'POST', body: JSON.stringify(transactionBody) })
  const transaction = fedapayObject(created, 'v1/transaction')
  const transactionId = String(transaction?.id || '')
  if (!/^\d+$/.test(transactionId)) throw new Error('fedapay-invalid-transaction')
  await db.set('fedapayOrders/' + transactionId, {
    uid: user.uid, transactionId, amount: CREDIT_PRICE_XOF, currency: 'XOF',
    credits: CREDIT_QUANTITY, status: 'pending', credited: false, createdAt: SERVER_TIMESTAMP
  })
  const tokenResponse = await fedapayRequest(env, '/transactions/' + encodeURIComponent(transactionId) + '/token', { method: 'POST', body: '{}' })
  const token = fedapayObject(tokenResponse, 'v1/token')
  const checkoutUrl = token?.url || token?.token?.url
  if (typeof checkoutUrl !== 'string' || !/^https:\/\//i.test(checkoutUrl)) throw new Error('fedapay-checkout-unavailable')
  return response(200, { checkoutUrl, transactionId })
}
async function confirmCreditPayment(env, db, transactionId) {
  if (!env.FEDAPAY_SECRET_KEY) throw new Error('fedapay-not-configured')
  if (!/^\d+$/.test(String(transactionId || ''))) throw new Error('invalid-transaction-id')
  const orderRef = db.doc('fedapayOrders/' + transactionId)
  const order = await db.get(orderRef.path)
  if (!order.exists) throw new Error('payment-order-not-found')
  if (order.data.credited === true) {
    const profile = await db.get('users/' + order.data.uid)
    return { status: 'approved', credited: true, paidCredits: Number(profile.data?.paidCredits || 0) }
  }
  const responseBody = await fedapayRequest(env, '/transactions/' + encodeURIComponent(transactionId), { method: 'GET' })
  const transaction = fedapayObject(responseBody, 'v1/transaction')
  const status = String(transaction?.status || '').toLowerCase()
  if (status !== 'approved') return { status: status || 'pending', credited: false }
  const amount = Number(transaction.amount)
  const currency = String(transaction.currency?.iso || transaction.currency?.name || transaction.currency || '').toUpperCase()
  if (amount !== Number(order.data.amount) || currency !== 'XOF') throw new Error('payment-amount-mismatch')
  await db.runTransaction(async tx => {
    const [currentOrder, profile] = await Promise.all([tx.get(orderRef), tx.get(db.doc('users/' + order.data.uid))])
    if (!currentOrder.exists || !profile.exists) throw new Error('payment-account-not-found')
    if (currentOrder.data().credited === true) return
    tx.update(db.doc('users/' + order.data.uid), { paidCredits: Math.max(0, Number(profile.data().paidCredits || 0)) + Number(currentOrder.data().credits || CREDIT_QUANTITY), updatedAt: SERVER_TIMESTAMP })
    tx.update(orderRef, { status: 'approved', credited: true, creditedAt: SERVER_TIMESTAMP })
  })
  const refreshed = await db.get('users/' + order.data.uid)
  return { status: 'approved', credited: true, paidCredits: Number(refreshed.data?.paidCredits || 0) }
}
async function fedapayWebhook(request, env, db) {
  if (request.method !== 'POST') return response(405, { error: 'method-not-allowed' })
  const payload = await request.json().catch(() => ({}))
  const event = payload?.name || payload?.event || ''
  const transactionId = String(payload?.entity?.id || payload?.data?.entity?.id || payload?.data?.id || payload?.entity?.id || '')
  if (event !== 'transaction.approved' || !/^\d+$/.test(transactionId)) return response(200, { received: true, ignored: true })
  try {
    await confirmCreditPayment(env, db, transactionId)
    return response(200, { received: true })
  } catch (error) {
    console.error('[Audinoo FedaPay webhook]', error)
    return response(400, { error: 'payment-confirmation-failed' })
  }
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
  try {
    await db.runTransaction(async tx => {
      const [p, policy, l] = await Promise.all([tx.get(db.doc(profile)), tx.get(db.doc('settings/credits')), tx.get(db.doc(lock))])
      if (!p.exists) throw new Error('profile-not-found')
      if (l.exists) throw new Error('generation-already-running')
      const data = p.data(), rules = policy.exists ? policy.data() : { enabled: true, activeCampaignId: FREE_CREDIT_CAMPAIGN_ID }
      campaign = data.freeCreditCampaignId || (!data.freeCreditPolicyAssigned ? FREE_CREDIT_CAMPAIGN_ID : null)
      const hasFreeCredit = Boolean(rules.enabled && campaign && campaign === rules.activeCampaignId && data.freeCreditUsed !== true)
      const hasPaidCredit = Number(data.paidCredits || 0) > 0
      if (!hasFreeCredit && !hasPaidCredit) throw new Error('no-free-credit')
      tx.create(db.doc(lock), { requestId, uid: user.uid, creditType: hasFreeCredit ? 'free' : 'paid', campaignId: hasFreeCredit ? campaign : null, createdAt: SERVER_TIMESTAMP })
    })
  } catch (error) {
    const mapped = { 'profile-not-found': [404, 'profile-not-found'], 'generation-already-running': [409, 'generation-already-running'], 'no-free-credit': [402, 'no-free-credit'] }[error.message]
    if (mapped) return response(mapped[0], { error: mapped[1] })
    throw error
  }
  const provider = await fetch(SUNO_GENERATE_URL, { method: 'POST', headers: { authorization: 'Bearer ' + env.SUNOAPI_KEY, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ prompt, ...(customMode ? { style, title } : {}), customMode, instrumental: false, model: 'V6', callBackUrl: (env.PUBLIC_BASE_URL || new URL(request.url).origin) + '/api/suno-callback' }), signal: AbortSignal.timeout(25000) })
  const result = await provider.json().catch(() => ({}))
  if (!provider.ok || result.code !== 200 || !result.data?.taskId) {
    await db.runTransaction(async tx => { const [p,l] = await Promise.all([tx.get(db.doc(profile)),tx.get(db.doc(lock))]); if (l.exists && l.data().requestId === requestId) tx.delete(db.doc(lock)); if (p.exists && p.data().freeCreditCampaignId === campaign) { /* welcome credit remains unused */ } })
    return response(502, { error: 'music-provider-rejected-request', providerCode: Number(result.code), providerMessage: typeof result.msg === 'string' ? result.msg : '' })
  }
  const taskId = String(result.data.taskId)
  const expiresAt = new Date(Date.now() + RETENTION_MS)
  await db.runTransaction(async tx => {
    const [p,l] = await Promise.all([tx.get(db.doc(profile)),tx.get(db.doc(lock))])
    if (!p.exists || !l.exists || l.data().requestId !== requestId) throw new Error('generation-reservation-lost')
    if (l.data().creditType === 'paid') {
      const remaining = Number(p.data().paidCredits || 0)
      if (remaining < 1) throw new Error('no-free-credit')
      tx.update(db.doc(profile), { paidCredits: remaining - 1, updatedAt: SERVER_TIMESTAMP })
    } else {
      tx.update(db.doc(profile), { freeCreditUsed: true, freeCreditUsedAt: SERVER_TIMESTAMP })
    }
    tx.delete(db.doc(lock))
    tx.create(db.doc(profile + '/generations/' + taskId), { taskId, uid: user.uid, title: title.slice(0,80), prompt: prompt.slice(0,5000), state: 'PENDING', createdAt: SERVER_TIMESTAMP, expiresAt })
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
  const data = body.data || {}, state = String(data.status || data.taskStatus || body.status || 'PENDING').toUpperCase()
  let tracks = tracksIn(data)
  if (!tracks.length) tracks = (await db.get(path)).data?.tracks || []
  if (tracks.length) tracks = await archiveTracks(env, db, path, tracks, user.uid, taskId)
  await db.set(path, { state, ...(tracks.length ? { tracks } : {}) }, true)
  const clientTracks = tracks.map((track, index) => ({ ...track, audioUrl: track.r2Key ? '/api/my-audio?taskId=' + encodeURIComponent(taskId) + '&track=' + index : track.audioUrl }))
  return response(200, { taskId, status: state, completed: ['SUCCESS','COMPLETE','COMPLETED'].includes(state), failed: FAILED.has(state), tracks: clientTracks })
}

async function adminAllowed(db, uid) {
  const admin = await db.get('admins/' + uid)
  return admin.exists && admin.data?.enabled === true
}
async function privateAudio(request, env, db, user, admin = false) {
  const url = new URL(request.url), uid = admin ? url.searchParams.get('uid') : user.uid, taskId = url.searchParams.get('taskId'), index = Number(url.searchParams.get('track') || 0)
  if (admin && !(await adminAllowed(db, user.uid))) return response(403, { error: 'admin-required' })
  if (!/^[a-zA-Z0-9_-]{6,120}$/.test(taskId || '') || !Number.isInteger(index) || index < 0) return response(400, { error: 'invalid-audio-request' })
  const snap = await db.get('users/' + uid + '/generations/' + taskId)
  const track = snap.data?.tracks?.[index]
  if (!snap.exists || (!admin && snap.data.uid !== user.uid) || !track?.r2Key) return response(404, { error: 'audio-not-found' })
  const object = await env.AUDIO_BUCKET?.get(track.r2Key)
  if (!object) return response(404, { error: 'audio-not-found' })
  return new Response(object.body, { headers: { 'content-type': object.httpMetadata?.contentType || 'audio/mpeg', 'cache-control': 'private, no-store', 'accept-ranges': 'bytes' } })
}
async function adminGenerations(request, db, user) {
  if (request.method !== 'GET') return response(405, { error: 'method-not-allowed' })
  if (!(await adminAllowed(db, user.uid))) return response(403, { error: 'admin-required' })
  const rows = await db.runQuery({ from: [{ collectionId: 'generations', allDescendants: true }], orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }], limit: 200 })
  const generations = (rows || []).filter(row => row.document).map(row => {
    const d = fromFields(row.document.fields || {})
    const parts = row.document.name.split('/documents/')[1].split('/')
    const uid = parts[1]
    return { uid, taskId: d.taskId, title: d.title || 'Création Audinoo', status: d.state || 'PENDING', createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : null, tracks: (d.tracks || []).map((t, i) => ({ title: t.title || d.title || 'Création Audinoo', imageUrl: t.imageUrl || '', archived: !!t.r2Key, trackIndex: i, audioUrl: t.r2Key ? '/api/admin-audio?uid=' + encodeURIComponent(uid) + '&taskId=' + encodeURIComponent(d.taskId) + '&track=' + i : '' })) }
  })
  return response(200, { generations })
}
async function publishTrack(request, env, db, user) {
  if (request.method !== 'POST') return response(405, { error: 'method-not-allowed' })
  if (!(await adminAllowed(db, user.uid))) return response(403, { error: 'admin-required' })
  const body = await request.json().catch(() => ({}))
  const uid = String(body.uid || ''), taskId = String(body.taskId || ''), index = Number(body.trackIndex)
  if (!uid || uid.length > 128 || !/^[a-zA-Z0-9_-]{6,120}$/.test(taskId) || !Number.isInteger(index) || index < 0) return response(400, { error: 'invalid-publish-request' })
  const path = 'users/' + uid + '/generations/' + taskId, snap = await db.get(path), track = snap.data?.tracks?.[index]
  if (!snap.exists || !track?.r2Key) return response(409, { error: 'audio-not-archived-yet' })
  const id = taskId + '-' + index
  const source = await env.AUDIO_BUCKET.get(track.r2Key)
  if (!source) return response(404, { error: 'audio-not-found' })
  const publicKey = 'public/' + id + '.audio'
  await env.AUDIO_BUCKET.put(publicKey, source.body, { httpMetadata: { contentType: source.httpMetadata?.contentType || 'audio/mpeg', cacheControl: 'public, max-age=3600' }, customMetadata: { publishedTrackId: id } })
  await db.set('publishedTracks/' + id, { id, uid, taskId, trackIndex: index, title: track.title || snap.data.title || 'Création Audinoo', imageUrl: track.imageUrl || '', r2Key: publicKey, published: true, publishedAt: new Date() })
  return response(200, { published: true, id })
}
async function publicTracks(request, db) {
  const rows = await db.runQuery({ from: [{ collectionId: 'publishedTracks' }], where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } }, orderBy: [{ field: { fieldPath: 'publishedAt' }, direction: 'DESCENDING' }], limit: 40 })
  return response(200, { tracks: (rows || []).filter(x => x.document).map(x => { const d = fromFields(x.document.fields || {}); return { id: d.id, title: d.title, imageUrl: d.imageUrl || '', audioUrl: '/api/public-audio?id=' + encodeURIComponent(d.id) } }) })
}
async function publicAudio(request, env, db) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id || id.length > 200) return response(400, { error: 'invalid-track' })
  const snap = await db.get('publishedTracks/' + id)
  if (!snap.exists || snap.data.published !== true || !snap.data.r2Key) return response(404, { error: 'track-not-found' })
  const object = await env.AUDIO_BUCKET?.get(snap.data.r2Key)
  if (!object) return response(404, { error: 'track-not-found' })
  return new Response(object.body, { headers: { 'content-type': object.httpMetadata?.contentType || 'audio/mpeg', 'cache-control': 'public, max-age=3600', 'accept-ranges': 'bytes' } })
}
async function library(request, db, user) {
  if (request.method !== 'GET') return response(405, { error: 'method-not-allowed' })
  const rows = await db.runQuery({ from: [{ collectionId: 'generations', allDescendants: true }], orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }], limit: 1000 })
  const cutoff = Date.now() - RETENTION_MS
  const generations = (rows || []).filter(row => row.document?.name?.includes('/users/' + user.uid + '/generations/')).map(row => {
    const x = fromFields(row.document.fields || {})
    const createdAt = x.createdAt instanceof Date ? x.createdAt : null
    return { taskId:x.taskId, title:x.title || 'Ta création Audinoo', prompt:x.prompt || '', status:x.state || 'PENDING', tracks:Array.isArray(x.tracks) ? x.tracks.map((track,index) => ({ ...track, audioUrl:track.r2Key ? '/api/my-audio?taskId=' + encodeURIComponent(x.taskId) + '&track=' + index : track.audioUrl })) : [], createdAt:createdAt?.toISOString() || null, expiresAt:x.expiresAt instanceof Date ? x.expiresAt.toISOString() : null }
  }).filter(item => item.createdAt && Date.parse(item.createdAt) > cutoff)
  return response(200, { generations })
}
export default {
  async scheduled(controller, env) {
    if (!env.AUDIO_BUCKET) return
    const db = new FirestoreRest(env)
    const rows = await db.runQuery({ from: [{ collectionId: 'generations', allDescendants: true }], limit: 1000 })
    const cutoff = Date.now() - RETENTION_MS
    for (const row of rows || []) {
      if (!row.document) continue
      const data = fromFields(row.document.fields || {})
      if (!(data.createdAt instanceof Date) || data.createdAt.getTime() > cutoff) continue
      for (const track of data.tracks || []) if (track.r2Key) { try { await env.AUDIO_BUCKET.delete(track.r2Key) } catch (error) { console.error('[Audinoo cleanup R2]', error) } }
      try { await db.commit([{ delete: { name: row.document.name } }]) } catch (error) { console.error('[Audinoo cleanup Firestore]', error) }
    }
  },
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not Found',{status:404})
    if (url.pathname === '/api/public-tracks') { const db = new FirestoreRest(env); return await publicTracks(request, db) }
    if (url.pathname === '/api/public-audio') { const db = new FirestoreRest(env); return await publicAudio(request, env, db) }
    if (url.pathname === '/api/suno-callback') return request.method === 'POST' ? response(200,{received:true}) : response(405,{error:'method-not-allowed'})
    if (url.pathname === '/api/fedapay-webhook') return await fedapayWebhook(request,env,new FirestoreRest(env))
    if (url.pathname === '/api/session-check') {
      if (request.method !== 'GET') return response(405,{error:'method-not-allowed'})
      try { const u = await userFrom(request,env); return u ? response(200,{authenticated:true,uid:u.uid}) : response(401,{error:'authentication-required'}) } catch { return response(401,{error:'invalid-session'}) }
    }
    let user
    try {
      user = await userFrom(request,env)
      if (!user) return response(401,{error:'authentication-required'})
      const db = new FirestoreRest(env)
      if (url.pathname === '/api/credits/purchase') return await createCreditPayment(request,env,db,user)
      if (url.pathname === '/api/credits/confirm') {
        if (request.method !== 'GET') return response(405,{error:'method-not-allowed'})
        const transactionId = url.searchParams.get('transaction_id') || ''
        const order = await db.get('fedapayOrders/' + transactionId)
        if (!order.exists || order.data.uid !== user.uid) return response(404,{error:'payment-order-not-found'})
        return response(200, await confirmCreditPayment(env,db,transactionId))
      }
      if (url.pathname === '/api/generate') return await generate(request,env,db,user)
      if (url.pathname === '/api/generation-status') return await generationStatus(request,env,db,user)
      if (url.pathname === '/api/my-library') return await library(request,db,user)
      if (url.pathname === '/api/my-audio') return await privateAudio(request,env,db,user)
      if (url.pathname === '/api/admin-audio') return await privateAudio(request,env,db,user,true)
      if (url.pathname === '/api/admin/generations') return await adminGenerations(request,db,user)
      if (url.pathname === '/api/admin/publish') return await publishTrack(request,env,db,user)
      return response(404,{error:'not-found'})
    } catch (e) {
      const status = e.message === 'firebase-admin-not-configured' ? 503 : e.message === 'invalid-token' ? 401 : 500
      if (status >= 500) console.error('[Audinoo Cloudflare]',e)
      const err = status === 503 ? 'backend-not-configured' : status === 401 ? 'invalid-session' : url.pathname === '/api/my-library' ? 'library-load-failed' : 'generation-failed'
      return response(status,{error:err})
    }
  }
}
