import { FieldValue } from 'firebase-admin/firestore'
import { randomUUID } from 'node:crypto'
import { getErrorStatus, getFirebaseServices, jsonResponse, verifyRequestUser } from './lib/firebase-admin.mjs'

const FREE_CREDIT_CAMPAIGN_ID = 'audinoo-free-credit-v1'
const SUNO_GENERATE_URL = 'https://api.sunoapi.org/api/v1/generate'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'method-not-allowed' })
  if (!process.env.SUNOAPI_KEY) return jsonResponse(503, { error: 'music-provider-not-configured' })

  try {
    const user = await verifyRequestUser(event)
    if (!user) return jsonResponse(401, { error: 'authentication-required' })
    const { db } = getFirebaseServices()
    let body
    try {
      body = JSON.parse(event.body || '{}')
    } catch {
      return jsonResponse(400, { error: 'invalid-json' })
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const customMode = body.customMode === true
    const style = typeof body.style === 'string' ? body.style.trim() : ''
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (prompt.length < 10) return jsonResponse(400, { error: 'prompt-too-short' })
    if (customMode && (prompt.length > 5000 || style.length > 1000 || title.length > 80)) return jsonResponse(400, { error: 'prompt-too-long' })
    if (customMode && (!style || !title)) return jsonResponse(400, { error: 'advanced-fields-required' })
    if (!customMode && prompt.length > 3000) return jsonResponse(400, { error: 'prompt-too-long' })

    const profileRef = db.collection('users').doc(user.uid)
    const lockRef = db.collection('generationLocks').doc(user.uid)
    const requestId = randomUUID()
    let reservedCampaignId = null

    try {
      await db.runTransaction(async (transaction) => {
        const [profileSnapshot, policySnapshot, lockSnapshot] = await Promise.all([
          transaction.get(profileRef),
          transaction.get(db.collection('settings').doc('credits')),
          transaction.get(lockRef)
        ])
        if (!profileSnapshot.exists) throw new Error('profile-not-found')
        if (lockSnapshot.exists) throw new Error('generation-already-running')

        const profile = profileSnapshot.data()
        const policy = policySnapshot.exists
          ? policySnapshot.data()
          : { enabled: true, activeCampaignId: FREE_CREDIT_CAMPAIGN_ID }
        const campaignId = profile.freeCreditCampaignId || null
        if (!policy.enabled || !campaignId || campaignId !== policy.activeCampaignId || profile.freeCreditUsed === true) {
          throw new Error('no-free-credit')
        }

        reservedCampaignId = campaignId
        transaction.create(lockRef, {
          requestId,
          uid: user.uid,
          campaignId,
          createdAt: FieldValue.serverTimestamp()
        })
      })
    } catch (error) {
      const errors = {
        'profile-not-found': [404, 'profile-not-found'],
        'generation-already-running': [409, 'generation-already-running'],
        'no-free-credit': [402, 'no-free-credit']
      }
      const mapped = errors[error.message]
      if (mapped) return jsonResponse(mapped[0], { error: mapped[1] })
      throw error
    }

    let providerResponse
    try {
      providerResponse = await fetch(SUNO_GENERATE_URL, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.SUNOAPI_KEY}`,
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: JSON.stringify({
          prompt,
          ...(customMode ? { style, title } : {}),
          customMode,
          instrumental: false,
          model: 'V6',
          callBackUrl: `${process.env.URL || 'https://audinoo.netlify.app'}/api/suno-callback`
        }),
        signal: AbortSignal.timeout(25000)
      })
      const providerBody = await providerResponse.json().catch(() => ({}))
      if (!providerResponse.ok || providerBody.code !== 200 || !providerBody.data?.taskId) {
        await db.runTransaction(async (transaction) => {
          const [profileSnapshot, lockSnapshot] = await Promise.all([transaction.get(profileRef), transaction.get(lockRef)])
          if (lockSnapshot.exists && lockSnapshot.data().requestId === requestId) {
            transaction.delete(lockRef)
            if (profileSnapshot.exists && profileSnapshot.data().freeCreditCampaignId === reservedCampaignId) {
              // The provider explicitly rejected the request, so the welcome credit is not consumed.
            }
          }
        })
        const providerCode = Number(providerBody.code)
        const providerMessage = typeof providerBody.msg === 'string' ? providerBody.msg : ''
        console.error('[Audinoo generation] Provider rejected task', { status: providerResponse.status, code: providerCode })
        return jsonResponse(502, { error: 'music-provider-rejected-request', providerCode, providerMessage })
      }

      const taskId = String(providerBody.data.taskId)
      await db.runTransaction(async (transaction) => {
        const [profileSnapshot, lockSnapshot] = await Promise.all([transaction.get(profileRef), transaction.get(lockRef)])
        if (!profileSnapshot.exists || !lockSnapshot.exists || lockSnapshot.data().requestId !== requestId) {
          throw new Error('generation-reservation-lost')
        }
        transaction.update(profileRef, { freeCreditUsed: true, freeCreditUsedAt: FieldValue.serverTimestamp() })
        transaction.delete(lockRef)
        transaction.create(profileRef.collection('generations').doc(taskId), {
          taskId,
          uid: user.uid,
          title: title.slice(0, 80),
          prompt: prompt.slice(0, 5000),
          state: 'PENDING',
          createdAt: FieldValue.serverTimestamp()
        })
      })
      return jsonResponse(202, { taskId, status: 'PENDING', freeCreditUsed: true })
    } catch (error) {
      // Once sent, a transport error may hide an accepted provider task. Keep the lock
      // rather than risk starting a duplicate generation that consumes provider balance.
      throw error
    }
  } catch (error) {
    const statusCode = getErrorStatus(error)
    if (statusCode >= 500) console.error('[Audinoo generation] Request failed', error)
    return jsonResponse(statusCode, { error: statusCode === 503 ? 'backend-not-configured' : statusCode === 401 ? 'invalid-session' : 'generation-failed' })
  }
}
