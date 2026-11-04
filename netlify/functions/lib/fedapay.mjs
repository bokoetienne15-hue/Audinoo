import { FieldValue } from 'firebase-admin/firestore'
import { getErrorStatus, getFirebaseServices, jsonResponse, verifyRequestUser } from './lib/firebase-admin.mjs'

const CREDIT_PRICE_XOF = 300
const CREDIT_QUANTITY = 1

function fedapayBase() {
  return process.env.FEDAPAY_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox-api.fedapay.com/v1'
    : 'https://api.fedapay.com/v1'
}

async function fedapayRequest(path, options = {}) {
  const secret = process.env.FEDAPAY_SECRET_KEY
  if (!secret) throw new Error('fedapay-not-configured')
  const response = await fetch(fedapayBase() + path, {
    ...options,
    headers: {
      authorization: 'Bearer ' + secret,
      accept: 'application/json',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers
    },
    signal: AbortSignal.timeout(20000)
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('[Audinoo FedaPay]', response.status, body)
    throw new Error('fedapay-request-failed')
  }
  return body
}

function unwrap(body, key) {
  return body?.[key] || body?.data?.[key] || body?.transaction || body?.token || body?.data || body
}

export function apiError(error) {
  const status = getErrorStatus(error)
  const known = {
    'fedapay-not-configured': [503, 'fedapay-not-configured'],
    'fedapay-request-failed': [502, 'fedapay-request-failed'],
    'fedapay-invalid-transaction': [502, 'fedapay-invalid-transaction'],
    'fedapay-checkout-unavailable': [502, 'fedapay-checkout-unavailable'],
    'customer-email-required': [400, 'customer-email-required'],
    'payment-order-not-found': [404, 'payment-order-not-found'],
    'payment-amount-mismatch': [409, 'payment-amount-mismatch'],
    'invalid-transaction-id': [400, 'invalid-transaction-id']
  }
  const mapped = known[error.message]
  return jsonResponse(mapped?.[0] || status, { error: mapped?.[1] || (status === 503 ? 'backend-not-configured' : status === 401 ? 'invalid-session' : 'payment-processing-failed') })
}

export async function createCreditCheckout(event) {
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'method-not-allowed' })
  try {
    const user = await verifyRequestUser(event)
    if (!user) return jsonResponse(401, { error: 'invalid-session' })
    if (!process.env.FEDAPAY_SECRET_KEY) return jsonResponse(503, { error: 'fedapay-not-configured' })
    const { db } = getFirebaseServices()
    const profile = await db.collection('users').doc(user.uid).get()
    if (!profile.exists) return jsonResponse(404, { error: 'profile-not-found' })
    const email = user.email || profile.data().email
    if (!email) return jsonResponse(400, { error: 'customer-email-required' })
    const origin = process.env.URL || 'https://audinoo.com'
    const created = await fedapayRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Audinoo — 1 crédit de génération musicale',
        amount: CREDIT_PRICE_XOF,
        currency: { iso: 'XOF' },
        callback_url: origin + '/?payment_return=credits',
        customer: { email }
      })
    })
    const transaction = unwrap(created, 'v1/transaction')
    const transactionId = String(transaction?.id || '')
    if (!/^\\d+$/.test(transactionId)) throw new Error('fedapay-invalid-transaction')
    await db.collection('fedapayOrders').doc(transactionId).set({
      uid: user.uid,
      transactionId,
      amount: CREDIT_PRICE_XOF,
      currency: 'XOF',
      credits: CREDIT_QUANTITY,
      status: 'pending',
      credited: false,
      createdAt: FieldValue.serverTimestamp()
    })
    const tokenResponse = await fedapayRequest('/transactions/' + encodeURIComponent(transactionId) + '/token', {
      method: 'POST',
      body: '{}'
    })
    const token = unwrap(tokenResponse, 'v1/token')
    const checkoutUrl = token?.url || token?.token?.url
    if (typeof checkoutUrl !== 'string' || !/^https:\\/\\//i.test(checkoutUrl)) throw new Error('fedapay-checkout-unavailable')
    return jsonResponse(200, { checkoutUrl, transactionId })
  } catch (error) {
    console.error('[Audinoo credit checkout]', error)
    return apiError(error)
  }
}

export async function confirmCredit(event) {
  if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'method-not-allowed' })
  try {
    const user = await verifyRequestUser(event)
    if (!user) return jsonResponse(401, { error: 'invalid-session' })
    if (!process.env.FEDAPAY_SECRET_KEY) return jsonResponse(503, { error: 'fedapay-not-configured' })
    const params = new URLSearchParams(event.rawQuery || event.queryStringParameters || {})
    const transactionId = String(params.get ? params.get('transaction_id') : event.queryStringParameters?.transaction_id || '')
    if (!/^\\d+$/.test(transactionId)) return jsonResponse(400, { error: 'invalid-transaction-id' })
    const { db } = getFirebaseServices()
    const orderRef = db.collection('fedapayOrders').doc(transactionId)
    const order = await orderRef.get()
    if (!order.exists || order.data().uid !== user.uid) return jsonResponse(404, { error: 'payment-order-not-found' })
    if (order.data().credited === true) {
      const profile = await db.collection('users').doc(user.uid).get()
      return jsonResponse(200, { status: 'approved', credited: true, paidCredits: Number(profile.data()?.paidCredits || 0) })
    }
    const remote = await fedapayRequest('/transactions/' + encodeURIComponent(transactionId) + '?include=currency', { method: 'GET' })
    const transaction = unwrap(remote, 'v1/transaction')
    const status = String(transaction?.status || '').toLowerCase()
    if (status !== 'approved') return jsonResponse(200, { status: status || 'pending', credited: false })
    const amount = Number(transaction.amount)
    const currency = String(transaction.currency?.iso || transaction.currency?.name || transaction.currency || '').toUpperCase()
    if (amount !== Number(order.data().amount) || currency !== 'XOF') throw new Error('payment-amount-mismatch')
    const profileRef = db.collection('users').doc(user.uid)
    await db.runTransaction(async (tx) => {
      const [freshOrder, profile] = await Promise.all([tx.get(orderRef), tx.get(profileRef)])
      if (!freshOrder.exists || !profile.exists) throw new Error('payment-order-not-found')
      if (freshOrder.data().credited === true) return
      tx.update(profileRef, {
        paidCredits: Math.max(0, Number(profile.data().paidCredits || 0)) + Number(freshOrder.data().credits || CREDIT_QUANTITY),
        updatedAt: FieldValue.serverTimestamp()
      })
      tx.update(orderRef, { status: 'approved', credited: true, creditedAt: FieldValue.serverTimestamp() })
    })
    const refreshed = await profileRef.get()
    return jsonResponse(200, { status: 'approved', credited: true, paidCredits: Number(refreshed.data()?.paidCredits || 0) })
  } catch (error) {
    console.error('[Audinoo credit confirmation]', error)
    return apiError(error)
  }
}

export async function handleFedaPayWebhook(event) {
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'method-not-allowed' })
  try {
    const payload = JSON.parse(event.body || '{}')
    const eventName = payload?.name || payload?.event || ''
    const transactionId = String(payload?.entity?.id || payload?.data?.entity?.id || payload?.data?.id || '')
    if (eventName !== 'transaction.approved' || !/^\\d+$/.test(transactionId)) return jsonResponse(200, { received: true, ignored: true })
    if (!process.env.FEDAPAY_SECRET_KEY) throw new Error('fedapay-not-configured')
    const { db } = getFirebaseServices()
    const orderRef = db.collection('fedapayOrders').doc(transactionId)
    const order = await orderRef.get()
    if (!order.exists) return jsonResponse(200, { received: true, ignored: true })
    if (order.data().credited) return jsonResponse(200, { received: true, alreadyProcessed: true })
    const remote = await fedapayRequest('/transactions/' + encodeURIComponent(transactionId) + '?include=currency', { method: 'GET' })
    const transaction = unwrap(remote, 'v1/transaction')
    const status = String(transaction?.status || '').toLowerCase()
    const amount = Number(transaction?.amount)
    const currency = String(transaction?.currency?.iso || transaction?.currency?.name || transaction?.currency || '').toUpperCase()
    if (status !== 'approved' || amount !== Number(order.data().amount) || currency !== 'XOF') {
      return jsonResponse(400, { error: 'payment-confirmation-failed' })
    }
    const profileRef = db.collection('users').doc(order.data().uid)
    await db.runTransaction(async (tx) => {
      const [freshOrder, profile] = await Promise.all([tx.get(orderRef), tx.get(profileRef)])
      if (!freshOrder.exists || !profile.exists) throw new Error('payment-order-not-found')
      if (freshOrder.data().credited) return
      tx.update(profileRef, {
        paidCredits: Math.max(0, Number(profile.data().paidCredits || 0)) + Number(freshOrder.data().credits || CREDIT_QUANTITY),
        updatedAt: FieldValue.serverTimestamp()
      })
      tx.update(orderRef, { status: 'approved', credited: true, creditedAt: FieldValue.serverTimestamp() })
    })
    return jsonResponse(200, { received: true, credited: true })
  } catch (error) {
    console.error('[Audinoo FedaPay webhook]', error)
    return apiError(error)
  }
}
