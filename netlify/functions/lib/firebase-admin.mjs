import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export function getFirebaseServices() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!getApps().length) {
    if (!serviceAccountJson) throw new Error('firebase-admin-not-configured')
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) })
  }
  return { auth: getAuth(), db: getFirestore() }
}

export async function verifyRequestUser(event) {
  const authorization = event.headers.authorization || event.headers.Authorization || ''
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null
  const { auth } = getFirebaseServices()
  return auth.verifyIdToken(token, true)
}

export const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  },
  body: JSON.stringify(body)
})

export function getErrorStatus(error) {
  if (error.message === 'firebase-admin-not-configured' || error instanceof SyntaxError) return 503
  if (typeof error.code === 'string' && error.code.startsWith('auth/')) return 401
  return 500
}
