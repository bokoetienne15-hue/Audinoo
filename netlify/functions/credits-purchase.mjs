import { createCreditCheckout } from './lib/fedapay.mjs'
export const handler = async (event) => createCreditCheckout(event)
