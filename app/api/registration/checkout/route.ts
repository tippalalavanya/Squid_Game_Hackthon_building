import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, REGISTRATION_FEE_PAISE } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const stripe = getStripe()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in before paying.' }, { status: 401 })
  const { memberId } = await request.json()
  if (!memberId || typeof memberId !== 'string') return NextResponse.json({ error: 'Invalid registration.' }, { status: 400 })
  const { data: member } = await supabase.from('team_members').select('id, team_id, user_id').eq('id', memberId).eq('user_id', user.id).single()
  if (!member) return NextResponse.json({ error: 'Registration not found.' }, { status: 404 })
  const { data: existing } = await supabase.from('registration_payments').select('status').eq('team_member_id', member.id).single()
  if (existing?.status === 'paid') return NextResponse.json({ error: 'This registration is already paid.' }, { status: 409 })
  const origin = request.headers.get('origin') ?? 'http://localhost:3000'
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price_data: { currency: 'inr', product_data: { name: 'Squid Games Hackathon registration' }, unit_amount: REGISTRATION_FEE_PAISE }, quantity: 1 }],
    customer_email: user.email,
    metadata: { memberId: member.id, userId: user.id, teamId: member.team_id },
    success_url: `${origin}/register?payment=success`,
    cancel_url: `${origin}/register?payment=cancelled`,
    integration_identifier: `squid_registration_${Math.random().toString(36).slice(2, 10)}`,
  })
  await supabase.from('registration_payments').update({ stripe_checkout_session_id: session.id, status: 'processing' }).eq('team_member_id', member.id)
  return NextResponse.json({ url: session.url })
}
