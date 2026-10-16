import 'server-only'
import Stripe from 'stripe'

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' })
}

export const REGISTRATION_FEE_PAISE = 19900
