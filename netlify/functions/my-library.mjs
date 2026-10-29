import { getErrorStatus, getFirebaseServices, jsonResponse, verifyRequestUser } from './lib/firebase-admin.mjs'

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'method-not-allowed' })
  try {
    const user = await verifyRequestUser(event)
    if (!user) return jsonResponse(401, { error: 'authentication-required' })
    const { db } = getFirebaseServices()
    const snapshot = await db.collection('users').doc(user.uid).collection('generations')
      .orderBy('createdAt', 'desc').limit(30).get()
    const generations = snapshot.docs.map((document) => {
      const data = document.data()
      return {
        taskId: data.taskId,
        title: data.title || 'Ta création Audinoo',
        prompt: data.prompt || '',
        status: data.state || 'PENDING',
        tracks: Array.isArray(data.tracks) ? data.tracks : [],
        createdAt: data.createdAt?.toDate?.().toISOString() || null
      }
    })
    return jsonResponse(200, { generations })
  } catch (error) {
    const statusCode = getErrorStatus(error)
    if (statusCode >= 500) console.error('[Audinoo library] Request failed', error)
    return jsonResponse(statusCode, { error: statusCode === 503 ? 'backend-not-configured' : statusCode === 401 ? 'invalid-session' : 'library-load-failed' })
  }
}
