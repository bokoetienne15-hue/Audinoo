import { confirmCredit } from './lib/fedapay.mjs'
export const handler = async (event) => confirmCredit(event)
