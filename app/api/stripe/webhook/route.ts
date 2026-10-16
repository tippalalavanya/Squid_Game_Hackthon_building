import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const stripe = getStripe()
  const signature = request.headers.get('stripe-signature')
  if (!signature) return new NextResponse('Missing signature', { status: 400 })
  let event
  try { event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!) }
  catch { return new NextResponse('Invalid signature', { status: 400 }) }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object
    if (session.payment_status === 'paid' && session.metadata?.memberId) {
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
      await admin.from('registration_payments').update({ status: 'paid', stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('team_member_id', session.metadata.memberId).eq('stripe_checkout_session_id', session.id)
    }
  }
  return NextResponse.json({ received: true })
}
