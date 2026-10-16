import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: 'Enter a valid email and a password with at least 6 characters.' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (error) {
      const knownDuplicate = error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('exists')
      return NextResponse.json({ error: knownDuplicate ? 'This email is already registered. Switch to Sign in.' : 'Unable to create the account. Check your email and password.' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unable to create the account right now. Try again.' }, { status: 500 })
  }
}
