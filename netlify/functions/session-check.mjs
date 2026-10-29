import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  body: JSON.stringify(body)
})

function getFirebaseAuth() {
  if (getApps().length) return getAuth()

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) throw new Error('firebase-admin-not-configured')

  const serviceAccount = JSON.parse(serviceAccountJson)
  initializeApp({ credential: cert(serviceAccount) })
  return getAuth()
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'method-not-allowed' })
  }

  const authorization = event.headers.authorization || event.headers.Authorization || ''
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return jsonResponse(401, { error: 'authentication-required' })

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token, true)
    return jsonResponse(200, { authenticated: true, uid: decodedToken.uid })
  } catch (error) {
    if (error.message === 'firebase-admin-not-configured') {
      return jsonResponse(503, { error: 'backend-not-configured' })
    }
    if (error instanceof SyntaxError) {
      console.error('[Audinoo backend] Invalid Firebase service account JSON')
      return jsonResponse(503, { error: 'backend-not-configured' })
    }
    console.error('[Audinoo backend] Firebase token verification failed', error)
    return jsonResponse(401, { error: 'invalid-session' })
  }
}
