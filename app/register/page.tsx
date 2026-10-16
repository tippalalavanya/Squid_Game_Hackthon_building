'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, Copy, LogIn, ShieldCheck, Users, WalletCards } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [supabase] = useState(() => typeof window === 'undefined' ? null : createClient())
  const [user, setUser] = useState<any>(null)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [value, setValue] = useState('')
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function refreshTeam(currentUser = user) {
    if (!supabase || !currentUser) return
    const { data: member } = await supabase.from('team_members').select('team_id').eq('user_id', currentUser.id).maybeSingle()
    if (!member) return
    const [{ data: currentTeam }, { data: teamMembers }] = await Promise.all([
      supabase.from('teams').select('id, name, code, max_members, leader_id').eq('id', member.team_id).single(),
      supabase.from('team_members').select('id, user_id, role, registration_status, full_name, college, joined_at, registration_payments(status)').eq('team_id', member.team_id).order('joined_at'),
    ])
    setTeam(currentTeam)
    setMembers(teamMembers ?? [])
  }

  useEffect(() => { if (!supabase) return; supabase.auth.getUser().then(({ data }) => { setUser(data.user); refreshTeam(data.user) }) }, [supabase])

  async function authenticate(event: FormEvent) {
    event.preventDefault(); if (!supabase) return; setLoading(true); setMessage('')
    if (authMode === 'signup') {
      const signup = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      setMessage(signup.error ? 'Unable to create your account. Check your details and try again.' : 'Account created. Check your email to confirm, then sign in.')
    } else {
      const result = await supabase.auth.signInWithPassword({ email, password })
      if (result.error) setMessage('Unable to sign in. Check your email and password.')
      else { setUser(result.data.user); setMessage('Signed in. Choose your team path below.') }
    }
    setLoading(false)
  }

  async function submitTeam(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage('')
    const response = await fetch('/api/registration/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: mode, value }) })
    const result = await response.json(); setMessage(result.error ?? 'Team saved.');
    if (response.ok) { setValue(''); await refreshTeam() }
    setLoading(false)
  }

  async function pay(memberId: string) {
    setLoading(true); const response = await fetch('/api/registration/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId }) }); const result = await response.json(); if (result.url) window.location.href = result.url; else setMessage(result.error ?? 'Unable to start payment.'); setLoading(false)
  }

  if (!user) return <main className="registration-shell"><div className="registration-card auth-card"><a className="back-link" href="/">← Back to arena</a><div className="section-kicker">[ REGISTRATION / ACCESS ]</div><h1>{authMode === 'signup' ? <>Create your<br /><span>account.</span></> : <>Enter the<br /><span>arena.</span></>}</h1><p>{authMode === 'signup' ? 'Create your participant account before choosing a team.' : 'Sign in before choosing a team or joining an invitation.'}</p><div className="mode-switch auth-switch"><button type="button" className={authMode === 'signin' ? 'active' : ''} onClick={() => { setAuthMode('signin'); setMessage('') }}>Sign in</button><button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setMessage('') }}>Sign up</button></div><form onSubmit={authenticate} className="registration-form"><input required type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} /><input required type="password" minLength={6} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><button className="button button-primary button-large" disabled={loading}>{loading ? 'Working…' : authMode === 'signup' ? 'Create account' : 'Sign in'} <LogIn size={18} /></button></form>{message && <p className="form-message">{message}</p>}</div></main>

  return <main className="registration-shell"><div className="registration-card"><a className="back-link" href="/">← Back to arena</a><div className="section-kicker">[ FINAL CHECKPOINT / TEAM REGISTRATION ]</div><h1>Build your<br /><span>squad.</span></h1><p className="registration-lede">Every participant registers and pays individually. Your team is complete only when every member is verified.</p>{!team ? <><div className="mode-switch"><button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}><Users size={16} /> Create a team</button><button className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>Join a team</button></div><form onSubmit={submitTeam} className="registration-form"><label>{mode === 'create' ? 'Unique team name' : 'Team invitation code'}<input required minLength={mode === 'create' ? 3 : 4} value={value} onChange={e => setValue(e.target.value)} placeholder={mode === 'create' ? 'e.g. Neon Builders' : 'e.g. A1B2C3D4'} /></label><button className="button button-primary button-large" disabled={loading}>{loading ? 'Saving…' : mode === 'create' ? 'Create squad' : 'Join squad'}</button></form></> : <section className="team-dashboard"><div className="team-header"><div><span className="status-pill"><ShieldCheck size={14} /> Team active</span><h2>{team.name}</h2><p>Share this code with your teammates.</p></div><button className="code-chip" onClick={() => navigator.clipboard.writeText(team.code)}>{team.code} <Copy size={14} /></button></div><div className="member-list">{members.map(member => { const paid = member.registration_payments?.[0]?.status === 'paid'; const isYou = member.user_id === user.id; return <article className="member-row" key={member.id}><div><strong>{member.full_name || (isYou ? 'You' : 'Participant')}</strong><span>{member.role === 'leader' ? 'Team leader' : 'Team member'}</span></div><div className="member-status">{member.registration_status === 'complete' ? <><Check size={15} /> Form complete</> : 'Form pending'}<br />{paid ? <><Check size={15} /> Payment verified</> : isYou ? <button className="pay-button" onClick={() => pay(member.id)}><WalletCards size={14} /> Pay ₹199</button> : 'Payment pending'}</div></article> })}</div><div className="team-note"><ShieldCheck size={18} /><span>Team completion is automatic after every member completes their form and payment is verified.</span></div></section>}{message && <p className="form-message">{message}</p>}</div></main>
}
