import { handleFedaPayWebhook } from './lib/fedapay.mjs'
export const handler = async (event) => handleFedaPayWebhook(event)
