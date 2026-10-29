import { getErrorStatus, getFirebaseServices, jsonResponse, verifyRequestUser } from './lib/firebase-admin.mjs'

const SUNO_STATUS_URL = 'https://api.sunoapi.org/api/v1/generate/record-info'
const terminalFailureStates = new Set(['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'])

function collectTracks(value, tracks = [], depth = 0) {
  if (depth > 8 || value == null) return tracks
  if (Array.isArray(value)) {
    for (const entry of value) collectTracks(entry, tracks, depth + 1)
    return tracks
  }
  if (typeof value !== 'object') return tracks
  if (typeof value.audio_url === 'string' && /^https:\/\//i.test(value.audio_url)) {
    tracks.push({
      id: typeof value.id === 'string' ? value.id : '',
      title: typeof value.title === 'string' ? value.title : 'Ta création Audinoo',
      audioUrl: value.audio_url,
      imageUrl: typeof value.image_url === 'string' && /^https:\/\//i.test(value.image_url) ? value.image_url : '',
      duration: Number.isFinite(Number(value.duration)) ? Number(value.duration) : null
    })
    return tracks
  }
  for (const entry of Object.values(value)) collectTracks(entry, tracks, depth + 1)
  return tracks
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'method-not-allowed' })
  if (!process.env.SUNOAPI_KEY) return jsonResponse(503, { error: 'music-provider-not-configured' })

  try {
    const user = await verifyRequestUser(event)
    if (!user) return jsonResponse(401, { error: 'authentication-required' })
    const taskId = event.queryStringParameters?.taskId || ''
    if (!/^[a-zA-Z0-9_-]{6,120}$/.test(taskId)) return jsonResponse(400, { error: 'invalid-task-id' })

    const { db } = getFirebaseServices()
    const generationRef = db.collection('users').doc(user.uid).collection('generations').doc(taskId)
    const generationSnapshot = await generationRef.get()
    if (!generationSnapshot.exists) return jsonResponse(404, { error: 'generation-not-found' })

    const providerResponse = await fetch(`${SUNO_STATUS_URL}?taskId=${encodeURIComponent(taskId)}`, {
      headers: { authorization: `Bearer ${process.env.SUNOAPI_KEY}`, accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    })
    const providerBody = await providerResponse.json().catch(() => ({}))
    if (!providerResponse.ok || providerBody.code !== 200) {
      console.error('[Audinoo generation] Status lookup failed', { status: providerResponse.status, code: providerBody.code })
      return jsonResponse(502, { error: 'music-status-unavailable' })
    }

    const providerData = providerBody.data || {}
    const state = String(providerData.status || providerData.taskStatus || providerBody.status || 'PENDING').toUpperCase()
    const tracks = collectTracks(providerData)
    const completed = state === 'SUCCESS' || state === 'COMPLETE' || state === 'COMPLETED'
    const failed = terminalFailureStates.has(state)
    await generationRef.set({ state, ...(tracks.length ? { tracks } : {}) }, { merge: true })
    return jsonResponse(200, { taskId, status: state, completed, failed, tracks })
  } catch (error) {
    const statusCode = getErrorStatus(error)
    if (statusCode >= 500) console.error('[Audinoo generation] Status request failed', error)
    return jsonResponse(statusCode, { error: statusCode === 503 ? 'backend-not-configured' : statusCode === 401 ? 'invalid-session' : 'generation-failed' })
  }
}
