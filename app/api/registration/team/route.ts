import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in before registering.' }, { status: 401 })
  const body = await request.json()
  const action = body.action === 'join' ? 'join_team' : 'create_team'
  const value = String(body.value ?? '').trim()
  if (!value) return NextResponse.json({ error: 'Enter a team name or team code.' }, { status: 400 })
  const { data, error } = await supabase.rpc(action, action === 'create_team' ? { team_name: value } : { team_code: value })
  if (error) return NextResponse.json({ error: error.message.replace('Error: ', '') }, { status: 400 })
  return NextResponse.json({ data })
}
