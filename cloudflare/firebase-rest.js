const FIREBASE_PROJECT_ID = 'audinoo'
const FIREBASE_API_KEY = 'AIzaSyCGMhGs0sXgnd4Frv7TZL8dJnn2hAPskYk'
const TOKEN_ISSUER = 'https://securetoken.google.com/audinoo'
const CERT_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
let certCache

const b64url = (value) => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
const decodePart = (part) => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - part.length % 4) % 4)))
const encode = (value) => b64url(new TextEncoder().encode(JSON.stringify(value)))

async function googleKeys() {
  if (certCache && certCache.until > Date.now()) return certCache.keys
  const response = await fetch(CERT_URL)
  if (!response.ok) throw new Error('firebase-auth-unavailable')
  const body = await response.json()
  const keys = new Map()
  for (const jwk of body.keys || []) keys.set(jwk.kid, await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']))
  const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 3600)
  certCache = { keys, until: Date.now() + maxAge * 1000 }
  return keys
}

export async function verifyFirebaseToken(token, env) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('invalid-token')
  const header = decodePart(parts[0])
  const claims = decodePart(parts[1])
  if (header.alg !== 'RS256' || !header.kid || claims.aud !== FIREBASE_PROJECT_ID || claims.iss !== TOKEN_ISSUER || typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128) throw new Error('invalid-token')
  const now = Math.floor(Date.now() / 1000)
  if (!Number.isFinite(claims.exp) || claims.exp <= now || !Number.isFinite(claims.iat) || claims.iat > now + 60 || !Number.isFinite(claims.auth_time) || claims.auth_time > now + 60) throw new Error('invalid-token')
  const key = (await googleKeys()).get(header.kid)
  if (!key) throw new Error('invalid-token')
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - parts[2].length % 4) % 4)), c => c.charCodeAt(0)), new TextEncoder().encode(parts[0] + '.' + parts[1]))
  if (!valid) throw new Error('invalid-token')
  const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_WEB_API_KEY || FIREBASE_API_KEY}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken: token }) })
  if (!lookup.ok) throw new Error('invalid-token')
  const account = (await lookup.json()).users?.[0]
  if (!account || account.localId !== claims.sub || account.disabled === true) throw new Error('invalid-token')
  if (account.validSince && Number(account.validSince) > Number(claims.auth_time)) throw new Error('invalid-token')
  return { uid: claims.sub, ...claims }
}

function toFirestore(value) {
  if (value === null) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestore) } }
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  if (value && value.__serverTimestamp) return { timestampValue: new Date().toISOString() }
  return { mapValue: { fields: Object.fromEntries(Object.entries(value || {}).map(([k, v]) => [k, toFirestore(v)])) } }
}
function fromFirestore(value = {}) {
  if ('nullValue' in value) return null
  if ('stringValue' in value) return value.stringValue
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('timestampValue' in value) return new Date(value.timestampValue)
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestore)
  if ('mapValue' in value) return fromFields(value.mapValue.fields || {})
  return null
}
function fromFields(fields = {}) { return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromFirestore(v)])) }
function docPath(path) { return `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}` }
function resourceName(path) { return docPath(path) }

export class FirestoreRest {
  constructor(env) { this.env = env; this.token = null; this.tokenExpiry = 0 }
  async accessToken() {
    if (this.token && this.tokenExpiry > Date.now() + 60000) return this.token
    const account = JSON.parse(this.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}')
    if (!account.client_email || !account.private_key) throw new Error('firebase-admin-not-configured')
    const now = Math.floor(Date.now() / 1000)
    const head = encode({ alg: 'RS256', typ: 'JWT' })
    const body = encode({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: account.token_uri || 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })
    const keyData = account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\\s/g, '')
    const binary = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
    const key = await crypto.subtle.importKey('pkcs8', binary, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
    const unsigned = head + '.' + body
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
    const assertion = unsigned + '.' + b64url(signature)
    const response = await fetch(account.token_uri || 'https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) })
    const result = await response.json()
    if (!response.ok || !result.access_token) throw new Error('firebase-admin-not-configured')
    this.token = result.access_token
    this.tokenExpiry = Date.now() + Number(result.expires_in || 3600) * 1000
    return this.token
  }
  async request(path, init = {}) {
    const response = await fetch('https://firestore.googleapis.com/v1/' + path, { ...init, headers: { authorization: 'Bearer ' + await this.accessToken(), 'content-type': 'application/json', ...(init.headers || {}) } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(body.error?.message || 'firestore-request-failed')
      error.status = response.status
      throw error
    }
    return body
  }
  async get(path, transaction) {
    const suffix = transaction ? '?transaction=' + encodeURIComponent(transaction) : ''
    try { const d = await this.request(docPath(path) + suffix); return { exists: true, data: fromFields(d.fields), name: d.name } }
    catch (e) { if (e.status === 404) return { exists: false, data: null }; throw e }
  }
  async begin() { return (await this.request(docPath('') .replace(/documents\/$/, 'documents:beginTransaction'), { method: 'POST', body: JSON.stringify({ options: { readWrite: {} } }) })).transaction }
  async commit(writes, transaction) {
    return this.request(docPath('').replace(/documents\/$/, 'documents:commit'), { method: 'POST', body: JSON.stringify({ writes, ...(transaction ? { transaction } : {}) }) })
  }
  async rollback(transaction) {
    try { await this.request(docPath('').replace(/documents\/$/, 'documents:rollback'), { method: 'POST', body: JSON.stringify({ transaction }) }) } catch {}
  }
  async runQuery(structuredQuery) {
    return this.request(docPath('').replace(/documents\/$/, 'documents:runQuery'), { method: 'POST', body: JSON.stringify({ structuredQuery }) })
  }
  writeSet(path, data, update = false) {
    const fields = Object.fromEntries(Object.entries(data).filter(([,v]) => !(v && v.__serverTimestamp)).map(([k,v]) => [k, toFirestore(v)]))
    const transforms = Object.entries(data).filter(([,v]) => v && v.__serverTimestamp).map(([fieldPath]) => ({ fieldPath, setToServerValue: 'REQUEST_TIME' }))
    const write = update
      ? { update: { name: resourceName(path), fields }, updateMask: { fieldPaths: Object.keys(fields) } }
      : { update: { name: resourceName(path), fields }, currentDocument: { exists: false } }
    if (transforms.length) write.updateTransforms = transforms
    return write
  }
}

export const SERVER_TIMESTAMP = Object.freeze({ __serverTimestamp: true })
export { fromFields, toFirestore, docPath }

FirestoreRest.prototype.runTransaction = async function(callback) {
  const tx = await this.begin()
  const writes = []
  const transaction = {
    get: async (ref) => {
      const snap = await this.get(ref.path, tx)
      return { exists: snap.exists, data: () => snap.data, id: ref.path.split('/').pop() }
    },
    create: (ref, data) => writes.push(this.writeSet(ref.path, data, false)),
    update: (ref, data) => writes.push(this.writeSet(ref.path, data, true)),
    delete: (ref) => writes.push({ delete: resourceName(ref.path) })
  }
  try {
    const result = await callback(transaction)
    if (writes.length) await this.commit(writes, tx)
    else await this.rollback(tx)
    return result
  } catch (error) {
    await this.rollback(tx)
    throw error
  }
}
FirestoreRest.prototype.doc = function(path) { return { path } }
FirestoreRest.prototype.collection = function(path) {
  const db = this
  return {
    doc(id) { return db.doc(path + '/' + id) },
    async orderBy(field, direction = 'asc') {
      return {
        limit(n) {
          return {
            async get() {
              const result = await db.runQuery({ from: [{ collectionId: path.split('/').pop() }], orderBy: [{ field: { fieldPath: field }, direction: direction === 'desc' ? 'DESCENDING' : 'ASCENDING' }], limit: n })
              const docs = (result || []).filter(x => x.document).map(x => ({ id: x.document.name.split('/').pop(), data: () => fromFields(x.document.fields || {}) }))
              return { docs }
            }
          }
        }
      }
    }
  }
}
FirestoreRest.prototype.set = async function(path, data, merge = false) {
  const fields = Object.fromEntries(Object.entries(data).filter(([,v]) => !(v && v.__serverTimestamp)).map(([k,v]) => [k, toFirestore(v)]))
  const transforms = Object.entries(data).filter(([,v]) => v && v.__serverTimestamp).map(([fieldPath]) => ({ fieldPath, setToServerValue: 'REQUEST_TIME' }))
  const write = { update: { name: resourceName(path), fields }, ...(merge ? { updateMask: { fieldPaths: Object.keys(fields) } } : {}) }
  if (transforms.length) write.updateTransforms = transforms
  await this.commit([write])
}
FirestoreRest.prototype.getDocument = async function(path) { return this.get(path) }
