'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, Copy, LogIn, Mail, ShieldCheck, Users, WalletCards } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [supabase] = useState(() => typeof window === 'undefined' ? null : createClient())
  const [user, setUser] = useState<any>(null)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [signupComplete, setSignupComplete] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [value, setValue] = useState('')
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
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

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      refreshTeam(data.user)
    })
  }, [supabase])

  function switchAuth(nextMode: 'signin' | 'signup') {
    setAuthMode(nextMode)
    setSignupComplete(false)
    setMessage('')
  }

  async function authenticate(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setLoading(true)
    setMessage('')

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setMessage(error.message.toLowerCase().includes('already') ? 'This email is already registered. Switch to Sign in.' : 'Unable to create the account. Check the email and password, then try again.')
      } else if (data.session && data.user) {
        setUser(data.user)
        setMessage('Account created. Choose your team path below.')
      } else {
        setSignupComplete(true)
        setMessage('Confirmation email requested. Check your inbox and spam folder.')
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setMessage(error.message.toLowerCase().includes('confirm') ? 'Confirm your email before signing in.' : 'Unable to sign in. Check your email and password.')
      else {
        setUser(data.user)
        setMessage('Signed in. Choose your team path below.')
        await refreshTeam(data.user)
      }
    }
    setLoading(false)
  }

  async function resendConfirmation() {
    if (!supabase || !email.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` } })
    setMessage(error ? 'We could not resend the email right now. Wait a moment and try again.' : 'Confirmation email resent. Check inbox, spam, and promotions folders.')
    setLoading(false)
  }

  async function submitTeam(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const response = await fetch('/api/registration/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: mode, value }) })
    const result = await response.json()
    setMessage(result.error ?? 'Team saved.')
    if (response.ok) { setValue(''); await refreshTeam() }
    setLoading(false)
  }

  async function pay(memberId: string) {
    setLoading(true)
    const response = await fetch('/api/registration/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId }) })
    const result = await response.json()
    if (result.url) window.location.href = result.url
    else setMessage(result.error ?? 'Unable to start payment.')
    setLoading(false)
  }

  if (!user) return (
    <main className="registration-shell">
      <div className="registration-card auth-card">
        <a className="back-link" href="/">← Back to arena</a>
        <div className="section-kicker">[ REGISTRATION / ACCESS ]</div>
        <h1>{authMode === 'signup' ? <>Create your<br /><span>account.</span></> : <>Enter the<br /><span>arena.</span></>}</h1>
        <p>{authMode === 'signup' ? 'Create your participant account before choosing a team.' : 'Sign in before choosing a team or joining an invitation.'}</p>
        <div className="mode-switch auth-switch">
          <button type="button" className={authMode === 'signin' ? 'active' : ''} onClick={() => switchAuth('signin')}>Sign in</button>
          <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => switchAuth('signup')}>Sign up</button>
        </div>
        {signupComplete ? (
          <div className="signup-confirmation">
            <Check size={28} />
            <h2>Check your inbox.</h2>
            <p>We requested a confirmation link for <strong>{email}</strong>. Check spam and promotions too.</p>
            <div className="confirmation-actions">
              <button type="button" className="button button-primary" onClick={resendConfirmation} disabled={loading}>{loading ? 'Resending…' : 'Resend email'} <Mail size={17} /></button>
              <button type="button" className="button button-outline" onClick={() => switchAuth('signin')}>Go to sign in</button>
            </div>
          </div>
        ) : (
          <form onSubmit={authenticate} className="registration-form">
            <label htmlFor="registration-email">Email address<input id="registration-email" required type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label htmlFor="registration-password">Password<input id="registration-password" required type="password" minLength={6} placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} /></label>
            <button className="button button-primary button-large" disabled={loading}>{loading ? 'Working…' : authMode === 'signup' ? 'Create account' : 'Sign in'} <LogIn size={18} /></button>
          </form>
        )}
        {message && <p className="form-message">{message}</p>}
      </div>
    </main>
  )

  return (
    <main className="registration-shell">
      <div className="registration-card">
        <a className="back-link" href="/">← Back to arena</a>
        <div className="section-kicker">[ FINAL CHECKPOINT / TEAM REGISTRATION ]</div>
        <h1>Build your<br /><span>squad.</span></h1>
        <p className="registration-lede">Every participant registers and pays individually. Your team is complete only when every member is verified.</p>
        {!team ? (
          <>
            <div className="mode-switch"><button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}><Users size={16} /> Create a team</button><button className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>Join a team</button></div>
            <form onSubmit={submitTeam} className="registration-form"><label>{mode === 'create' ? 'Unique team name' : 'Team invitation code'}<input required minLength={mode === 'create' ? 3 : 4} value={value} onChange={e => setValue(e.target.value)} placeholder={mode === 'create' ? 'e.g. Neon Builders' : 'e.g. A1B2C3D4'} /></label><button className="button button-primary button-large" disabled={loading}>{loading ? 'Saving…' : mode === 'create' ? 'Create squad' : 'Join squad'}</button></form>
          </>
        ) : (
          <section className="team-dashboard"><div className="team-header"><div><span className="status-pill"><ShieldCheck size={14} /> Team active</span><h2>{team.name}</h2><p>Share this code with your teammates.</p></div><button className="code-chip" onClick={() => navigator.clipboard.writeText(team.code)}>{team.code} <Copy size={14} /></button></div><div className="member-list">{members.map(member => { const paid = member.registration_payments?.[0]?.status === 'paid'; const isYou = member.user_id === user.id; return <article className="member-row" key={member.id}><div><strong>{member.full_name || (isYou ? 'You' : 'Participant')}</strong><span>{member.role === 'leader' ? 'Team leader' : 'Team member'}</span></div><div className="member-status">{member.registration_status === 'complete' ? <><Check size={15} /> Form complete</> : <span>Form incomplete</span>}{paid ? <><Check size={15} /> Payment verified</> : isYou ? <button className="pay-button" onClick={() => pay(member.id)} disabled={loading}><WalletCards size={13} /> Pay registration fee</button> : <span>Payment pending</span>}</div></article> })}</div><div className="team-note"><ShieldCheck size={18} /> The team is fully registered only after every member completes their form and has a verified payment.</div></section>
        )}
        {message && <p className="form-message">{message}</p>}
      </div>
    </main>
  )
}
