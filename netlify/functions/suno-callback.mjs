import { jsonResponse } from './lib/firebase-admin.mjs'

// The application polls task status through the authenticated endpoint. This URL
// is supplied because the provider requires a callback URL when creating a task.
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'method-not-allowed' })
  return jsonResponse(200, { received: true })
}
