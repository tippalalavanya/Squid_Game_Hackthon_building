'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, Copy, LogIn, ShieldCheck, Users, WalletCards } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function getSignupMessage(error: { message?: string }) {
  const message = error.message?.toLowerCase() ?? ''
  if (message.includes('already') || message.includes('registered')) return 'This email is already registered. Switch to Sign in.'
  if (message.includes('email_address_invalid') || message.includes('invalid email')) return 'Enter a real email address that can receive mail.'
  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) return 'Use a stronger password with at least 6 characters.'
  if (message.includes('rate limit') || message.includes('too many')) return 'Too many attempts. Wait a few minutes, then try again.'
  if (message.includes('not authorized') || message.includes('not_authorized')) return 'This email cannot receive mail from the current Supabase email provider. Use the project-authorized email or configure SMTP.'
  return 'Unable to create the account right now. Check your email and password, then try again.'
}

export default function RegisterPage() {
  const [supabase] = useState(() => typeof window === 'undefined' ? null : createClient())
  const [user, setUser] = useState<any>(null)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [value, setValue] = useState('')
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState({ fullName: '', college: '', phone: '' })

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

  useEffect(() => {
    if (!team || !user) return
    const interval = window.setInterval(() => refreshTeam(user), 5000)
    return () => window.clearInterval(interval)
  }, [team?.id, user?.id])

  function switchAuth(nextMode: 'signin' | 'signup') {
    setAuthMode(nextMode)
    setMessage('')
  }

  async function authenticate(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setLoading(true)
    setMessage('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage('Enter a valid email address, for example name@gmail.com.')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    if (authMode === 'signup') {
      const response = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: normalizedEmail, password }) })
      const result = await response.json()
      if (!response.ok) {
        setMessage(result.error ?? 'Unable to create the account right now. Try again.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error || !data.user) setMessage('Account was created, but sign-in could not be completed. Check that the email and password are correct, then use Sign in.')
        else { setUser(data.user); setMessage('Account created and signed in. Choose your team path below.'); await refreshTeam(data.user) }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (error) setMessage(error.message.toLowerCase().includes('invalid login') ? 'Email or password is incorrect. If you have not created an account yet, switch to Sign up first.' : 'Unable to sign in right now. Please try again.')
      else {
        setUser(data.user)
        setMessage('Signed in. Choose your team path below.')
        await refreshTeam(data.user)
      }
    }
    setLoading(false)
  }

  async function submitTeam(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    const response = await fetch('/api/registration/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: mode, value }) })
    const result = await response.json()
    if (!response.ok) {
      setMessage(result.error ?? 'Unable to save the team.')
    } else {
      setValue('')
      if (result.data) setTeam(result.data)
      setMessage(mode === 'create' ? 'Team created. Share the code with your teammates.' : 'You joined the team. Complete your registration details next.')
      await refreshTeam()
    }
    setLoading(false)
  }

  async function completeProfile(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !user) return
    setLoading(true)
    const member = members.find(item => item.user_id === user.id)
    if (!member) { setMessage('Your team membership could not be found. Refresh and try again.'); setLoading(false); return }
    const { error } = await supabase.from('team_members').update({ full_name: profile.fullName.trim(), college: profile.college.trim(), phone: profile.phone.trim(), registration_status: 'complete' }).eq('id', member.id).eq('user_id', user.id)
    setMessage(error ? 'We could not save your registration details. Try again.' : 'Registration details saved. Continue to payment.')
    if (!error) await refreshTeam()
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
        <form onSubmit={authenticate} className="registration-form">
            <label htmlFor="registration-email">Email address<input id="registration-email" required type="email" autoComplete="email" placeholder="name@gmail.com" value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label htmlFor="registration-password">Password<input id="registration-password" required type="password" minLength={6} placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} /></label>
            <button className="button button-primary button-large" disabled={loading}>{loading ? 'Working…' : authMode === 'signup' ? 'Create account' : 'Sign in'} <LogIn size={18} /></button>
          </form>
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
          <>
          <section className="team-invite-panel"><div><span className="status-pill"><ShieldCheck size={14} /> Team created</span><h2>{team.name}</h2><p>Step 1 is complete. Copy this code and send it to every teammate. They must choose Join a team and enter this code.</p></div><button className="code-chip" onClick={() => navigator.clipboard.writeText(team.code)}>{team.code} <Copy size={14} /></button></section>
          <section className="member-registration"><div className="section-kicker">[ STEP 01 / YOUR DETAILS ]</div><h2>Register yourself.</h2><p className="registration-lede">Share the team code above now. Your teammates can join while you complete your own details.</p><form onSubmit={completeProfile} className="registration-form"><label>Full name<input required value={profile.fullName} onChange={e => setProfile({ ...profile, fullName: e.target.value })} placeholder="Enter your name" /></label><label>College / university<input required value={profile.college} onChange={e => setProfile({ ...profile, college: e.target.value })} placeholder="Enter your college" /></label><label>Phone number<input required type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="Enter your phone number" /></label><button className="button button-primary button-large" disabled={loading}>{loading ? 'Saving…' : 'Save registration details'}</button></form></section><section className="invite-roster"><div className="section-kicker">[ STEP 02 / TEAMMATES ]</div><h3>Build your team.</h3><p>Teammates appear here automatically after they join. Each teammate must complete their details and pay individually.</p><button type="button" className="button button-outline roster-refresh" onClick={() => refreshTeam()} disabled={loading}>Refresh teammate list</button><div className="member-list">{members.map(member => <article className="member-row" key={member.id}><div><strong>{member.full_name || (member.user_id === user.id ? 'You' : 'Participant')}</strong><span>{member.role === 'leader' ? 'Team leader' : 'Team member'}</span></div><div className="member-status">{member.registration_status === 'complete' ? 'Details complete' : 'Details pending'}</div></article>)}</div></section><section className="team-dashboard"><div className="team-header"><div><span className="status-pill"><ShieldCheck size={14} /> Team active</span><h2>{team.name}</h2><p>Share this code with your teammates.</p></div><button className="code-chip" onClick={() => navigator.clipboard.writeText(team.code)}>{team.code} <Copy size={14} /></button></div><div className="member-list">{members.map(member => { const paid = member.registration_payments?.[0]?.status === 'paid'; const isYou = member.user_id === user.id; return <article className="member-row" key={member.id}><div><strong>{member.full_name || (isYou ? 'You' : 'Participant')}</strong><span>{member.role === 'leader' ? 'Team leader' : 'Team member'}</span></div><div className="member-status">{member.registration_status === 'complete' ? <><Check size={15} /> Form complete</> : <span>Form incomplete</span>}{paid ? <><Check size={15} /> Payment verified</> : isYou ? <button className="pay-button" onClick={() => pay(member.id)} disabled={loading}><WalletCards size={13} /> Pay registration fee</button> : <span>Payment pending</span>}</div></article> })}</div><div className="team-note"><ShieldCheck size={18} /> The team is fully registered only after every member completes their form and has a verified payment.</div></section>
          </>
        )}
        {message && <p className="form-message">{message}</p>}
      </div>
    </main>
  )
}
