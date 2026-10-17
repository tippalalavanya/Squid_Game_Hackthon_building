'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Copy, LogIn, Upload, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PRICE = 199

type Person = { name: string; email: string; phone: string }

export default function RegisterPage() {
  const [supabase] = useState(() => typeof window === 'undefined' ? null : createClient())
  const [user, setUser] = useState<any>(null)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamSize, setTeamSize] = useState(1)
  const [members, setMembers] = useState<Person[]>([{ name: '', email: '', phone: '' }])
  const [inviteCode, setInviteCode] = useState('')
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [utr, setUtr] = useState('')
  const [status, setStatus] = useState<'draft' | 'pending'>('draft')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { if (supabase) supabase.auth.getUser().then(({ data }) => { setUser(data.user); if (data.user?.email) setMembers(current => [{ ...current[0], email: data.user.email ?? '' }, ...current.slice(1)]) }) }, [supabase])

  const total = useMemo(() => teamSize * PRICE, [teamSize])

  function setSize(size: number) {
    setTeamSize(size)
    setMembers(current => Array.from({ length: size }, (_, index) => current[index] ?? { name: '', email: '', phone: '' }))
  }

  function updateMember(index: number, key: keyof Person, value: string) {
    setMembers(current => current.map((member, memberIndex) => memberIndex === index ? { ...member, [key]: value } : member))
  }

  async function authenticate(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setLoading(true); setMessage('')
    const email = authEmail.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) { setMessage('Enter a valid email and a password of at least 6 characters.'); setLoading(false); return }
    if (authMode === 'signup') {
      const response = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const result = await response.json()
      if (!response.ok) { setMessage(result.error ?? 'Unable to create account.'); setLoading(false); return }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) setMessage(error?.message ?? 'Unable to sign in.')
    else { setUser(data.user); setMessage('Signed in. Complete your team registration below.') }
    setLoading(false)
  }

  async function createPendingTeam(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage('')
    if (members.some(member => !member.name.trim() || !/^\S+@\S+\.\S+$/.test(member.email.trim()) || !member.phone.trim())) { setMessage('Complete the name, email, and phone for every member.'); setLoading(false); return }
    const response = await fetch('/api/registration/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', value: teamName, additionalMembers: teamSize - 1, leader: members[0], members, total, utr }) })
    const result = await response.json()
    if (!response.ok) { setMessage(result.error ?? 'Unable to save the team.'); setLoading(false); return }
    setInviteCode(result.data?.code ?? '')
    setStatus('pending')
    setMessage('Team saved as pending. Upload payment proof and submit verification.')
    setLoading(false)
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault()
    if (!paymentFile || !/^\d{12}$/.test(utr)) { setMessage('Upload the payment screenshot and enter the 12-digit UTR number.'); return }
    setLoading(true)
    setMessage('Payment proof submitted. Your team is pending admin verification.')
    setStatus('pending')
    setLoading(false)
  }

  if (!user) return <main className="registration-shell"><div className="registration-card auth-card"><a className="back-link" href="/">← Back to arena</a><div className="section-kicker">[ REGISTRATION / ACCESS ]</div><h1>{authMode === 'signup' ? <>Create your<br /><span>account.</span></> : <>Enter the<br /><span>arena.</span></>}</h1><p>{authMode === 'signup' ? 'Create your account to register your team.' : 'Sign in to register and pay for your team.'}</p><div className="mode-switch"><button type="button" className={authMode === 'signin' ? 'active' : ''} onClick={() => setAuthMode('signin')}>Sign in</button><button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Sign up</button></div><form onSubmit={authenticate} className="registration-form"><label>Email address<input required type="email" value={authEmail} onChange={event => setAuthEmail(event.target.value)} placeholder="name@gmail.com" /></label><label>Password<input required type="password" minLength={6} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 6 characters" /></label><button className="button button-primary button-large" disabled={loading}>{loading ? 'Working…' : authMode === 'signup' ? 'Create account' : 'Sign in'} <LogIn size={18} /></button></form>{message && <p className="form-message">{message}</p>}</div></main>

  return <main className="registration-shell"><div className="registration-card"><a className="back-link" href="/">← Back to arena</a><div className="section-kicker">[ GROUP REGISTRATION / ₹199 PER CANDIDATE ]</div><h1>Register your<br /><span>squad.</span></h1><p className="registration-lede">The leader enters everyone’s details, pays for the group, and submits one payment proof for admin verification.</p>{status === 'draft' ? <form onSubmit={createPendingTeam} className="registration-form"><label>Group leader and team name<input required value={teamName} onChange={event => setTeamName(event.target.value)} placeholder="e.g. Apex Squad" /></label><div className="capacity-picker"><span>Team size</span>{[1, 2, 3, 4].map(size => <button type="button" key={size} className={teamSize === size ? 'selected' : ''} onClick={() => setSize(size)}>{size}</button>)}</div><div className="member-forms"><h2>Participant details</h2>{members.map((member, index) => <div className="member-form" key={index}><div className="member-form-heading"><strong>{index === 0 ? 'Leader' : `Member ${index + 1}`}</strong>{index === 0 && <span>Auto-filled from your account after sign in</span>}</div><label>Name<input required value={member.name} onChange={event => updateMember(index, 'name', event.target.value)} placeholder="Participant name" /></label><label>Email<input required type="email" value={member.email} onChange={event => updateMember(index, 'email', event.target.value)} placeholder="participant@email.com" /></label><label>Phone<input required type="tel" value={member.phone} onChange={event => updateMember(index, 'phone', event.target.value)} placeholder="10-digit phone number" /></label></div>)}</div><div className="payment-summary"><span>Total payment</span><strong>{teamSize} member{teamSize === 1 ? '' : 's'} × ₹{PRICE} = ₹{total}</strong></div><button className="button button-primary button-large" disabled={loading}>{loading ? 'Saving…' : 'Continue to payment'}</button></form> : <><section className="pending-card"><span className="status-pill">Payment pending verification</span><h2>{teamName}</h2><p>Share this invite reference with your members if they need it.</p><button type="button" className="code-chip" onClick={() => navigator.clipboard?.writeText(inviteCode)}>{inviteCode || 'Pending'} <Copy size={14} /></button></section><form onSubmit={submitPayment} className="payment-checkout"><h2>Pay and verify</h2><p className="registration-lede">Pay exactly <strong>₹{total}</strong> using Google Pay, then upload the screenshot and enter the UTR.</p><div className="gpay-box"><strong>Google Pay</strong><span>+91 99599 88096</span><small>Scan the QR code or pay to the number above.</small><div className="upi-qr" aria-label="UPI QR code placeholder">UPI<br />₹{total}</div></div><label>Payment screenshot<input required type="file" accept="image/*" onChange={event => setPaymentFile(event.target.files?.[0] ?? null)} /><small><Upload size={14} /> {paymentFile?.name ?? 'Upload image proof'}</small></label><label>12-digit UTR number<input required inputMode="numeric" pattern="[0-9]{12}" maxLength={12} value={utr} onChange={event => setUtr(event.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="123456789012" /></label><button className="button button-primary button-large" disabled={loading}>{loading ? 'Submitting…' : 'Submit for admin verification'}</button></form><p className="form-message">Your team remains pending until an admin verifies the payment. Confirmation emails require an email provider to be connected.</p></>}</div></main>
}
