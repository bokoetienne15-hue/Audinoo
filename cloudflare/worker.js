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
    if (!track.r2Key && !/^https?:\/\//i.test(track.audioUrl || '')) { saved.push(track); continue }
    try {
      let audioKey = track.r2Key || ''
      if (!audioKey) {
        const source = await fetch(track.audioUrl, { signal: AbortSignal.timeout(60000) })
        if (!source.ok || !source.body) { saved.push(track); continue }
        audioKey = 'private/' + uid + '/' + taskId + '/' + i + '.audio'
        await env.AUDIO_BUCKET.put(audioKey, source.body, { httpMetadata: { contentType: source.headers.get('content-type') || 'audio/mpeg', cacheControl: 'private, no-store' }, customMetadata: { uid, taskId } })
      }
      let coverKey = track.coverKey || ''
      if (!coverKey && /^https?:\/\//i.test(track.imageUrl || '')) {
        try {
          const coverResponse = await fetch(track.imageUrl, { signal: AbortSignal.timeout(20000), headers: { accept: 'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8' } })
          const contentType = coverResponse.headers.get('content-type') || ''
          if (coverResponse.ok && coverResponse.body && contentType.startsWith('image/')) {
            coverKey = 'private/' + uid + '/' + taskId + '/' + i + '.cover'
            await env.AUDIO_BUCKET.put(coverKey, coverResponse.body, { httpMetadata: { contentType, cacheControl: 'private, max-age=86400' }, customMetadata: { uid, taskId } })
          } else console.warn('[Audinoo cover archive] provider returned', coverResponse.status, contentType)
        } catch (coverError) { console.warn('[Audinoo cover archive]', coverError) }
      }
      saved.push({ ...track, ...(coverKey ? { coverKey } : {}), r2Key: audioKey, archivedAt: track.archivedAt || new Date().toISOString() })
    } catch (error) {
      console.error('[Audinoo R2 archive]', error)
      saved.push(track)
    }
  }
  if (saved.some((track, i) => track.r2Key !== tracks[i]?.r2Key || track.coverKey !== tracks[i]?.coverKey || track.imageUrl !== tracks[i]?.imageUrl)) await db.set(path, { tracks: saved }, true)
  return saved
}


async function userFrom(request, env) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  return token ? verifyFirebaseToken(token, env) : null
}
function tracksIn(value, output = [], depth = 0) {
  if (depth > 12 || value == null) return output
  if (Array.isArray(value)) { for (const x of value) tracksIn(x, output, depth + 1); return output }
  if (typeof value !== 'object') return output
  const firstUrl = (...candidates) => candidates.find(candidate => typeof candidate === 'string' && /^https?:\/\//i.test(candidate.trim()))?.trim() || ''
  const audioCandidate = firstUrl(value.audio_url, value.audioUrl, value.source_audio_url, value.sourceAudioUrl, value.stream_audio_url, value.streamAudioUrl)
  const imageCandidate = firstUrl(value.image_url, value.imageUrl, value.source_image_url, value.sourceImageUrl, value.cover_url, value.coverUrl, value.thumbnail_url, value.thumbnailUrl, value.image, value.cover)
  if (audioCandidate || imageCandidate) {
    const id = String(value.id || value.song_id || value.songId || '')
    const existing = output.findIndex(track => (id && track.id === id) || (audioCandidate && track.audioUrl === audioCandidate))
    const track = {
      ...(existing >= 0 ? output[existing] : {}),
      ...(id ? { id } : {}),
      title: String(value.title || value.song_title || value.songTitle || (existing >= 0 ? output[existing].title : '')),
      ...(audioCandidate ? { audioUrl: audioCandidate } : {}),
      ...(imageCandidate ? { imageUrl: imageCandidate, sourceImageUrl: imageCandidate } : {}),
      duration: Number.isFinite(Number(value.duration)) ? Number(value.duration) : (existing >= 0 ? output[existing].duration : null)
    }
    if (existing >= 0) output[existing] = track
    else output.push(track)
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
  return body?.[key] || body?.data?.[key] || body?.transaction || body?.token || body?.data || body
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
  const email = typeof user.email === 'string' && user.email ? user.email : (typeof profile.data.email === 'string' ? profile.data.email : '')
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
  const responseBody = await fedapayRequest(env, '/transactions/' + encodeURIComponent(transactionId) + '?include=currency', { method: 'GET' })
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
  if (customMode && !style) return response(400, { error: 'advanced-fields-required' })
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
  const provider = await fetch(SUNO_GENERATE_URL, { method: 'POST', headers: { authorization: 'Bearer ' + env.SUNOAPI_KEY, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ prompt, ...(customMode ? { style, ...(title ? { title } : {}) } : {}), customMode, instrumental: false, model: 'V6', callBackUrl: (env.PUBLIC_BASE_URL || new URL(request.url).origin) + '/api/suno-callback' }), signal: AbortSignal.timeout(25000) })
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
    tx.create(db.doc(profile + '/generations/' + taskId), { taskId, uid: user.uid, title: customMode ? title.slice(0,80) : (title || 'Sans titre').slice(0,80), prompt: prompt.slice(0,5000), state: 'PENDING', createdAt: SERVER_TIMESTAMP, expiresAt })
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
  // SunoAPI record-info returns tracks under data.response.sunoData.
  // Keep a fallback for callback/legacy payload shapes.
  let tracks = tracksIn(data.response?.sunoData || data.response || data)
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
async function privateMedia(request, env, db, user, kind = 'audio', admin = false) {
  const url = new URL(request.url), uid = admin ? url.searchParams.get('uid') : user.uid, taskId = url.searchParams.get('taskId'), index = Number(url.searchParams.get('track') || 0)
  if (admin && !(await adminAllowed(db, user.uid))) return response(403, { error: 'admin-required' })
  if (!/^[a-zA-Z0-9_-]{6,120}$/.test(taskId || '') || !Number.isInteger(index) || index < 0) return response(400, { error: 'invalid-media-request' })
  const snap = await db.get('users/' + uid + '/generations/' + taskId)
  const track = snap.data?.tracks?.[index]
  if (!snap.exists || (!admin && snap.data.uid !== user.uid)) return response(404, { error: 'media-not-found' })
  const key = kind === 'cover' ? track?.coverKey : track?.r2Key
  if (key) {
    const object = await env.AUDIO_BUCKET?.get(key)
    if (object) return new Response(object.body, { headers: { 'content-type': object.httpMetadata?.contentType || (kind === 'cover' ? 'image/jpeg' : 'audio/mpeg'), 'cache-control': 'private, max-age=86400', ...(kind === 'audio' ? { 'accept-ranges': 'bytes' } : {}) } })
  }
  // Legacy/unarchived tracks can still be listened to by an authenticated administrator.
  // Publishing will archive this provider URL into R2 before making it public.
  if (admin && kind === 'audio' && /^https?:\/\//i.test(track?.audioUrl || '')) {
    const remote = await fetch(track.audioUrl, { signal: AbortSignal.timeout(60000) })
    if (remote.ok && remote.body) return new Response(remote.body, { headers: { 'content-type': remote.headers.get('content-type') || 'audio/mpeg', 'cache-control': 'private, no-store', 'accept-ranges': 'bytes' } })
  }
  if (kind === 'cover' && /^https?:\/\//i.test(track?.imageUrl || '')) {
    try {
      const remote = await fetch(track.imageUrl, { signal: AbortSignal.timeout(20000), headers: { accept: 'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8' } })
      const type = remote.headers.get('content-type') || ''
      if (remote.ok && remote.body && type.startsWith('image/')) {
        if (env.AUDIO_BUCKET && !track.coverKey) {
          const coverKey = 'private/' + uid + '/' + taskId + '/' + index + '.cover'
          await env.AUDIO_BUCKET.put(coverKey, remote.body, { httpMetadata: { contentType: type, cacheControl: 'private, max-age=86400' }, customMetadata: { uid, taskId } })
          await db.set('users/' + uid + '/generations/' + taskId, { tracks: snap.data.tracks.map((item, i) => i === index ? { ...item, coverKey } : item) }, true)
          const stored = await env.AUDIO_BUCKET.get(coverKey)
          if (stored) return new Response(stored.body, { headers: { 'content-type': type, 'cache-control': 'private, max-age=86400', 'x-content-type-options': 'nosniff' } })
        }
        return new Response(remote.body, { headers: { 'content-type': type, 'cache-control': 'private, max-age=3600', 'x-content-type-options': 'nosniff' } })
      }
      console.warn('[Audinoo cover fetch]', remote.status, type)
    } catch (error) { console.warn('[Audinoo cover fetch]', error) }
  }
  return response(404, { error: 'media-not-found' })
}

async function grantAdminCredits(request, db, user) {
  if (request.method !== 'POST') return response(405, { error: 'method-not-allowed' })
  if (!(await adminAllowed(db, user.uid))) return response(403, { error: 'admin-required' })
  const body = await request.json().catch(() => ({}))
  const uid = typeof body.uid === 'string' ? body.uid.trim() : ''
  const credits = Number(body.credits)
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || !Number.isInteger(credits) || credits < 1 || credits > 1000) {
    return response(400, { error: 'invalid-credit-grant' })
  }
  const profileRef = db.doc('users/' + uid)
  let paidCredits = 0
  try {
    await db.runTransaction(async tx => {
      const profile = await tx.get(profileRef)
      if (!profile.exists) throw new Error('credit-recipient-not-found')
      const current = Math.max(0, Math.floor(Number(profile.data().paidCredits || 0)))
      paidCredits = current + credits
      tx.update(profileRef, { paidCredits, updatedAt: SERVER_TIMESTAMP })
      tx.create(db.doc('adminCreditGrants/' + crypto.randomUUID()), {
        uid, credits, balanceAfter: paidCredits, grantedBy: user.uid, createdAt: SERVER_TIMESTAMP
      })
    })
  } catch (error) {
    if (error.message === 'credit-recipient-not-found') return response(404, { error: 'credit-recipient-not-found' })
    throw error
  }
  return response(200, { granted: credits, paidCredits })
}
async function adminGenerations(request, db, user) {
  if (request.method !== 'GET') return response(405, { error: 'method-not-allowed' })
  if (!(await adminAllowed(db, user.uid))) return response(403, { error: 'admin-required' })
  // Avoid an orderBy index dependency: retrieve the collection group, then sort in memory.
  // This also includes older generation documents that may not have a createdAt field.
  const rows = await db.runQuery({ from: [{ collectionId: 'generations', allDescendants: true }], limit: 1000 })
  const generations = (rows || []).filter(row => row.document?.name?.includes('/documents/users/'))
    .map(row => {
      const d = fromFields(row.document.fields || {})
      const parts = row.document.name.split('/documents/')[1].split('/')
      if (parts.length !== 4 || parts[0] !== 'users' || parts[2] !== 'generations') return null
      const uid = parts[1], taskId = d.taskId || parts[3]
      const createdAt = d.createdAt instanceof Date ? d.createdAt.toISOString() : typeof d.createdAt === 'string' ? d.createdAt : null
      return {
        uid, taskId, title: d.title || 'Création Audinoo', status: d.state || 'PENDING', createdAt,
        tracks: (Array.isArray(d.tracks) ? d.tracks : []).map((t, i) => ({
          title: t.title || d.title || 'Création Audinoo', imageUrl: t.imageUrl || '',
          archived: !!t.r2Key, trackIndex: i,
          audioUrl: (t.r2Key || /^https?:\/\//i.test(t.audioUrl || ''))
            ? '/api/admin-audio?uid=' + encodeURIComponent(uid) + '&taskId=' + encodeURIComponent(taskId) + '&track=' + i : ''
        }))
      }
    }).filter(Boolean)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 1000)
  return response(200, { generations })
}

function feedbackIsoDate(value) {
  return value instanceof Date ? value.toISOString() : typeof value === 'string' ? value : null
}
async function feedbackEligibleUserIds(db) {
  const rows = await db.runQuery({ from: [{ collectionId: 'generations', allDescendants: true }], limit: 1000 })
  const eligible = new Set()
  for (const row of rows || []) {
    if (!row.document?.name?.includes('/documents/users/')) continue
    const parts = row.document.name.split('/documents/')[1].split('/')
    if (parts.length !== 4 || parts[0] !== 'users' || parts[2] !== 'generations') continue
    const data = fromFields(row.document.fields || {})
    const state = String(data.state || '').toUpperCase()
    if (['SUCCESS', 'COMPLETE', 'COMPLETED'].includes(state) && Array.isArray(data.tracks) && data.tracks.length > 0) eligible.add(parts[1])
  }
  return eligible
}
async function createFeedbackCampaign(request, db, user) {
  if (request.method !== 'POST') return response(405, { error: 'method-not-allowed' })
  if (!(await adminAllowed(db, user.uid))) return response(403, { error: 'admin-required' })
  const body = await request.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const userIds = Array.isArray(body.userIds) ? [...new Set(body.userIds.filter(uid => typeof uid === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(uid)))] : []
  if (title.length < 2 || title.length > 80 || message.length < 2 || message.length > 600 || !userIds.length || userIds.length > 2000) return response(400, { error: 'invalid-feedback-campaign' })
  const eligible = await feedbackEligibleUserIds(db)
  if (userIds.some(uid => !eligible.has(uid))) return response(400, { error: 'feedback-recipient-not-eligible' })
  const campaignId = crypto.randomUUID()
  await db.set('feedbackCampaigns/' + campaignId, { title, message, createdBy: user.uid, recipientCount: userIds.length, createdAt: SERVER_TIMESTAMP })
  for (let offset = 0; offset < userIds.length; offset += 450) {
    const writes = userIds.slice(offset, offset + 450).map(uid => db.writeSet('feedbackInvitations/' + campaignId + '_' + uid, { campaignId, userId: uid, title, message, status: 'pending', createdAt: SERVER_TIMESTAMP }, false))
    await db.commit(writes)
  }
  return response(200, { campaignId, recipientCount: userIds.length })
}
async function getPendingFeedback(request, db, user) {
  if (request.method !== 'GET') return response(405, { error: 'method-not-allowed' })
  const rows = await db.runQuery({ from: [{ collectionId: 'feedbackInvitations' }], where: { fieldFilter: { field: { fieldPath: 'userId' }, op: 'EQUAL', value: { stringValue: user.uid } } }, limit: 100 })
  const invitations = (rows || []).filter(row => row.document).map(row => {
    const data = fromFields(row.document.fields || {})
    return { id: row.document.name.split('/').pop(), title: data.title || '', message: data.message || '', status: data.status || '' }
  }).filter(item => item.status === 'pending').slice(0, 1)
  return response(200, { invitations })
}
async function dismissFeedbackInvitation(request, db, user) {
  if (request.method !== 'POST') return response(405, { error: 'method-not-allowed' })
  const body = await request.json().catch(() => ({}))
  const invitationId = typeof body.invitationId === 'string' ? body.invitationId : ''
  if (!/^[A-Za-z0-9_-]{10,180}$/.test(invitationId)) return response(400, { error: 'invalid-feedback-invitation' })
  const invitation = await db.get('feedbackInvitations/' + invitationId)
  if (!invitation.exists || invitation.data.userId !== user.uid) return response(404, { error: 'feedback-invitation-not-found' })
  if (invitation.data.status === 'pending') await db.set('feedbackInvitations/' + invitationId, { status: 'dismissed', dismissedAt: SERVER_TIMESTAMP }, true)
  return response(200, { dismissed: true })
}
async function submitFeedback(request, db, user) {
  if (request.method !== 'POST') return response(405, { error: 'method-not-allowed' })
  const body = await request.json().catch(() => ({}))
  const invitationId = typeof body.invitationId === 'string' ? body.invitationId : ''
  const stars = body.stars === null || body.stars === undefined ? null : Number(body.stars)
  const comment = typeof body.comment === 'string' ? body.comment.trim() : ''
  if (!/^[A-Za-z0-9_-]{10,180}$/.test(invitationId) || (stars !== null && (!Number.isInteger(stars) || stars < 1 || stars > 5)) || comment.length > 1200) return response(400, { error: 'invalid-feedback-response' })
  try {
    await db.runTransaction(async tx => {
      const invitationRef = db.doc('feedbackInvitations/' + invitationId)
      const responseRef = db.doc('feedbackResponses/' + invitationId)
      const invitation = await tx.get(invitationRef)
      if (!invitation.exists || invitation.data().userId !== user.uid) throw new Error('feedback-invitation-not-found')
      if (invitation.data().status !== 'pending') throw new Error('feedback-invitation-not-pending')
      const previous = await tx.get(responseRef)
      if (previous.exists) throw new Error('feedback-already-submitted')
      tx.create(responseRef, { userId: user.uid, campaignId: invitation.data().campaignId || '', title: invitation.data().title || 'Retour sur Audinoo', stars, comment, createdAt: SERVER_TIMESTAMP })
      tx.update(invitationRef, { status: 'submitted', submittedAt: SERVER_TIMESTAMP })
    })
  } catch (error) {
    if (error.message === 'feedback-invitation-not-found') return response(404, { error: 'feedback-invitation-not-found' })
    if (error.message === 'feedback-invitation-not-pending' || error.message === 'feedback-already-submitted') return response(409, { error: error.message })
    throw error
  }
  return response(200, { submitted: true })
}
async function listAdminFeedbackResponses(request, db, user) {
  if (request.method !== 'GET') return response(405, { error: 'method-not-allowed' })
  if (!(await adminAllowed(db, user.uid))) return response(403, { error: 'admin-required' })
  const rows = await db.runQuery({ from: [{ collectionId: 'feedbackResponses' }], limit: 500 })
  const responses = (rows || []).filter(row => row.document).map(row => {
    const data = fromFields(row.document.fields || {})
    return { userId: data.userId || '', title: data.title || 'Retour sur Audinoo', stars: Number.isInteger(data.stars) ? data.stars : null, comment: typeof data.comment === 'string' ? data.comment : '', createdAt: feedbackIsoDate(data.createdAt) }
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  return response(200, { responses })
}

async function publishTrack(request, env, db, user) {
  if (request.method !== 'POST') return response(405, { error: 'method-not-allowed' })
  if (!(await adminAllowed(db, user.uid))) return response(403, { error: 'admin-required' })
  const body = await request.json().catch(() => ({}))
  const uid = String(body.uid || ''), taskId = String(body.taskId || ''), index = Number(body.trackIndex)
  if (!uid || uid.length > 128 || !/^[a-zA-Z0-9_-]{6,120}$/.test(taskId) || !Number.isInteger(index) || index < 0) return response(400, { error: 'invalid-publish-request' })
  const path = 'users/' + uid + '/generations/' + taskId, snap = await db.get(path), track = snap.data?.tracks?.[index]
  if (!snap.exists || !track) return response(409, { error: 'audio-not-available' })
  const id = taskId + '-' + index
  let source = track.r2Key ? await env.AUDIO_BUCKET?.get(track.r2Key) : null
  if (!source && /^https?:\/\//i.test(track.audioUrl || '')) {
    const remote = await fetch(track.audioUrl, { signal: AbortSignal.timeout(60000) })
    if (remote.ok && remote.body && env.AUDIO_BUCKET) {
      const privateKey = 'private/' + uid + '/' + taskId + '/' + index + '.audio'
      await env.AUDIO_BUCKET.put(privateKey, remote.body, { httpMetadata: { contentType: remote.headers.get('content-type') || 'audio/mpeg', cacheControl: 'private, no-store' }, customMetadata: { uid, taskId } })
      await db.set(path, { tracks: snap.data.tracks.map((item, i) => i === index ? { ...item, r2Key: privateKey } : item) }, true)
      source = await env.AUDIO_BUCKET.get(privateKey)
    }
  }
  if (!source) return response(404, { error: 'audio-not-found-or-not-archived' })
  const publicKey = 'public/' + id + '.audio'
  await env.AUDIO_BUCKET.put(publicKey, source.body, { httpMetadata: { contentType: source.httpMetadata?.contentType || 'audio/mpeg', cacheControl: 'public, max-age=3600' }, customMetadata: { publishedTrackId: id } })
  await db.set('publishedTracks/' + id, { id, uid, taskId, trackIndex: index, title: track.title || snap.data.title || 'Création Audinoo', imageUrl: track.imageUrl || '', r2Key: publicKey, published: true, publishedAt: new Date() })
  return response(200, { published: true, id })
}
async function publicTracks(request, db) {
  // Sort on the single indexed timestamp field, then filter published tracks in code.
  // This avoids requiring a composite Firestore index for published + publishedAt.
  const rows = await db.runQuery({ from: [{ collectionId: 'publishedTracks' }], orderBy: [{ field: { fieldPath: 'publishedAt' }, direction: 'DESCENDING' }], limit: 100 })
  const tracks = (rows || []).filter(x => x.document).map(x => fromFields(x.document.fields || {})).filter(track => track.published === true).slice(0, 40)
  return response(200, { tracks: tracks.map(d => ({ id: d.id, title: d.title, imageUrl: d.imageUrl || '', audioUrl: '/api/public-audio?id=' + encodeURIComponent(d.id) })) })
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
async function library(request, env, db, user) {
  if (request.method !== 'GET') return response(405, { error: 'method-not-allowed' })
  const rows = await db.runQuery({ from: [{ collectionId: 'generations', allDescendants: true }], orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }], limit: 1000 })
  const cutoff = Date.now() - RETENTION_MS
  const owned = (rows || []).filter(row => row.document?.name?.includes('/users/' + user.uid + '/generations/'))
  // Older library entries may have been saved before cover extraction was fixed.
  // Refresh a small batch from the official Suno record-info endpoint when cover URLs are missing.
  if (env.SUNOAPI_KEY) {
    let refreshed = 0
    for (const row of owned) {
      if (refreshed >= 8) break
      const current = fromFields(row.document.fields || {})
      if (!current.taskId || !Array.isArray(current.tracks) || !current.tracks.length || current.tracks.every(track => /^https?:\/\//i.test(track.imageUrl || '') || track.coverKey)) continue
      refreshed++
      try {
        const remote = await fetch(SUNO_STATUS_URL + '?taskId=' + encodeURIComponent(current.taskId), { headers: { authorization: 'Bearer ' + env.SUNOAPI_KEY, accept: 'application/json' }, signal: AbortSignal.timeout(12000) })
        const payload = await remote.json().catch(() => ({}))
        const fresh = tracksIn(payload?.data?.response?.sunoData || payload?.data?.response || payload?.data || {})
        if (!remote.ok || payload.code !== 200 || !fresh.length) continue
        const merged = current.tracks.map((track, index) => {
          const latest = fresh[index] || {}
          return { ...track, ...latest, r2Key: track.r2Key || latest.r2Key || '', coverKey: track.coverKey || latest.coverKey || '', imageUrl: latest.imageUrl || track.imageUrl || '' }
        })
        await db.set('users/' + user.uid + '/generations/' + current.taskId, { tracks: merged }, true)
        current.tracks = merged
      } catch (error) { console.warn('[Audinoo library cover refresh]', current.taskId, error) }
    }
  }
  const generations = owned.map(row => {
    const x = fromFields(row.document.fields || {})
    const createdAt = x.createdAt instanceof Date ? x.createdAt : null
    return { taskId:x.taskId, title:x.title || '', prompt:x.prompt || '', status:x.state || 'PENDING', tracks:Array.isArray(x.tracks) ? x.tracks.map((track,index) => ({ ...track, coverImageUrl:track.imageUrl || '', audioUrl:track.r2Key ? '/api/my-audio?taskId=' + encodeURIComponent(x.taskId) + '&track=' + index : track.audioUrl })) : [], createdAt:createdAt?.toISOString() || null, expiresAt:x.expiresAt instanceof Date ? x.expiresAt.toISOString() : null }
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
    if (url.pathname === '/api/suno-callback') {
      if (request.method !== 'POST') return response(405,{error:'method-not-allowed'})
      let payload
      try { payload = await request.json() } catch { return response(400,{error:'invalid-json'}) }
      const callbackData = payload?.data || {}
      const taskId = String(callbackData.task_id || callbackData.taskId || '')
      if (!/^[a-zA-Z0-9_-]{6,120}$/.test(taskId)) return response(200,{received:true,ignored:true})
      const callbackDb = new FirestoreRest(env)
      const rows = await callbackDb.runQuery({ from: [{ collectionId: 'generations', allDescendants: true }], where: { fieldFilter: { field: { fieldPath: 'taskId' }, op: 'EQUAL', value: { stringValue: taskId } } }, limit: 1 })
      const doc = rows?.[0]?.document
      const match = doc?.name?.match(/\/documents\/users\/([^/]+)\/generations\/([^/]+)$/)
      if (!match || match[2] !== taskId) return response(200,{received:true,ignored:true})
      const uid = match[1], path = 'users/' + uid + '/generations/' + taskId
      const callbackType = String(callbackData.callbackType || '').toLowerCase()
      const tracks = tracksIn(callbackData.data || [])
      const state = payload.code === 200 ? (callbackType === 'complete' ? 'SUCCESS' : callbackType === 'first' ? 'FIRST_SUCCESS' : callbackType === 'text' ? 'TEXT_SUCCESS' : 'SUCCESS') : 'GENERATE_AUDIO_FAILED'
      const existing = (await callbackDb.get(path)).data || {}
      const merged = tracks.length ? tracks.map((track,index) => ({ ...(existing.tracks?.[index] || {}), ...track, imageUrl: track.imageUrl || track.sourceImageUrl || existing.tracks?.[index]?.imageUrl || '' })) : (existing.tracks || [])
      await callbackDb.set(path,{ state, ...(merged.length ? { tracks: merged } : {}), callbackType, callbackMessage: String(payload.msg || '') },true)
      return response(200,{received:true,savedTracks:merged.length})
    }
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
      if (url.pathname === '/api/my-library') return await library(request,env,db,user)
      if (url.pathname === '/api/my-audio') return await privateMedia(request,env,db,user,'audio')
      if (url.pathname === '/api/my-cover') return await privateMedia(request,env,db,user,'cover')
      if (url.pathname === '/api/admin-audio') return await privateMedia(request,env,db,user,'audio',true)
      if (url.pathname === '/api/admin/credits/grant') return await grantAdminCredits(request,db,user)
      if (url.pathname === '/api/admin/generations') return await adminGenerations(request,db,user)
      if (url.pathname === '/api/admin/feedback/campaign') return await createFeedbackCampaign(request,db,user)
      if (url.pathname === '/api/admin/feedback/responses') return await listAdminFeedbackResponses(request,db,user)
      if (url.pathname === '/api/feedback/pending') return await getPendingFeedback(request,db,user)
      if (url.pathname === '/api/feedback/dismiss') return await dismissFeedbackInvitation(request,db,user)
      if (url.pathname === '/api/feedback/submit') return await submitFeedback(request,db,user)
      if (url.pathname === '/api/admin/publish') return await publishTrack(request,env,db,user)
      return response(404,{error:'not-found'})
    } catch (e) {
      const status = e.message === 'firebase-admin-not-configured' || e.message === 'fedapay-not-configured' ? 503 : e.message === 'invalid-token' ? 401 : 500
      if (status >= 500) console.error('[Audinoo Cloudflare]',e)
      if (url.pathname.startsWith('/api/credits/')) {
        const allowedPaymentErrors = new Set(['fedapay-not-configured','fedapay-request-failed','fedapay-invalid-transaction','fedapay-checkout-unavailable','payment-order-not-found','payment-amount-mismatch','payment-account-not-found','invalid-transaction-id'])
        return response(status, { error: allowedPaymentErrors.has(e.message) ? e.message : 'payment-processing-failed' })
      }
      const err = status === 503 ? 'backend-not-configured' : status === 401 ? 'invalid-session' : url.pathname.startsWith('/api/feedback') || url.pathname.startsWith('/api/admin/feedback') ? 'feedback-processing-failed' : url.pathname === '/api/my-library' ? 'library-load-failed' : 'generation-failed'
      return response(status,{error:err})
    }
  }
}
