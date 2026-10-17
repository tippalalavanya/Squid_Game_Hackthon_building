'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { LogIn, Smartphone, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PRICE = 199
const PAYEE_PHONE = '+91 99599 88096'
const PAYEE_UPI_ID = '9959988096@upi'
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
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [utr, setUtr] = useState('')
  const [step, setStep] = useState<'details' | 'payment' | 'pending'>('details')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const amount = useMemo(() => teamSize * PRICE, [teamSize])

  useEffect(() => { if (supabase) supabase.auth.getUser().then(({ data }) => { setUser(data.user); if (data.user?.email) setMembers([{ name: '', email: data.user.email, phone: '' }]) }) }, [supabase])
  function resize(size: number) { setTeamSize(size); setMembers(current => Array.from({ length: size }, (_, i) => current[i] ?? { name: '', email: '', phone: '' })) }
  function update(index: number, key: keyof Person, value: string) { setMembers(current => current.map((member, i) => i === index ? { ...member, [key]: value } : member)) }
  function paymentUrl(app?: 'gpay' | 'phonepe') { const query = new URLSearchParams({ pa: PAYEE_UPI_ID, pn: 'Squid Games Hackathon', am: String(amount), cu: 'INR', tn: `Team registration - ${teamName}` }).toString(); return `${app === 'gpay' ? 'tez' : app === 'phonepe' ? 'phonepe' : 'upi'}://pay?${query}` }
  function launchPayment(app: 'gpay' | 'phonepe') {
    const url = paymentUrl(app)
    const inPreviewFrame = window.self !== window.top
    const paymentWindow = inPreviewFrame ? window.open(url, '_blank', 'noopener,noreferrer') : null
    if (paymentWindow) return
    window.location.href = url
  }

  async function authenticate(event: FormEvent) { event.preventDefault(); if (!supabase) return; setLoading(true); setMessage(''); const email = authEmail.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) { setMessage('Enter a valid email and password of at least 6 characters.'); setLoading(false); return } if (authMode === 'signup') { const response = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); if (!response.ok) { const result = await response.json(); setMessage(result.error ?? 'Unable to create account.'); setLoading(false); return } } const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error || !data.user) setMessage(error?.message ?? 'Unable to sign in.'); else { setUser(data.user); setMembers([{ name: '', email: data.user.email ?? email, phone: '' }]) }; setLoading(false) }
  async function continuePayment(event: FormEvent) { event.preventDefault(); if (!teamName.trim() || members.some(member => !member.name.trim() || !/^\S+@\S+\.\S+$/.test(member.email.trim()) || !member.phone.trim())) { setMessage('Complete the team name and every participant detail.'); return } setLoading(true); const response = await fetch('/api/registration/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', value: teamName, additionalMembers: teamSize - 1, leader: members[0], members, total: amount }) }); const result = await response.json(); if (!response.ok) { setMessage(result.error ?? 'Unable to create team.'); setLoading(false); return } setStep('payment'); setMessage('Team saved. Choose your payment app below.'); setLoading(false) }
  function submitPayment(event: FormEvent) { event.preventDefault(); if (!paymentFile || !/^\d{12}$/.test(utr)) { setMessage('Upload the screenshot and enter the 12-digit UTR.'); return } setStep('pending'); setMessage('Payment submitted. Your team is pending verification.') }

  if (!user) return <main className="registration-shell"><div className="registration-card auth-card"><a className="back-link" href="/">← Back to arena</a><div className="section-kicker">[ REGISTRATION / ACCESS ]</div><h1>{authMode === 'signup' ? <>Create your<br /><span>account.</span></> : <>Enter the<br /><span>arena.</span></>}</h1><p>Sign in to register your group.</p><div className="mode-switch"><button type="button" className={authMode === 'signin' ? 'active' : ''} onClick={() => setAuthMode('signin')}>Sign in</button><button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Sign up</button></div><form onSubmit={authenticate} className="registration-form"><label>Email address<input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="name@gmail.com" /></label><label>Password<input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></label><button className="button button-primary button-large" disabled={loading}>{loading ? 'Working…' : authMode === 'signup' ? 'Create account' : 'Sign in'} <LogIn size={18} /></button></form>{message && <p className="form-message">{message}</p>}</div></main>

  return <main className="registration-shell"><div className="registration-card"><a className="back-link" href="/">← Back to arena</a><div className="section-kicker">[ GROUP REGISTRATION / ₹199 PER CANDIDATE ]</div><h1>Register your<br /><span>squad.</span></h1>{step === 'details' && <form onSubmit={continuePayment} className="registration-form"><label>Team name<input required value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Apex Squad" /></label><div className="capacity-picker"><span>Team size</span>{[1, 2, 3, 4].map(size => <button type="button" key={size} className={teamSize === size ? 'selected' : ''} onClick={() => resize(size)}>{size}</button>)}</div><div className="member-forms"><h2>Participant details</h2>{members.map((member, index) => <div className="member-form" key={index}><div className="member-form-heading"><strong>{index === 0 ? 'Leader' : `Member ${index + 1}`}</strong><span>{index === 0 ? 'Your details' : 'Invitee details'}</span></div><label>Name<input required value={member.name} onChange={e => update(index, 'name', e.target.value)} /></label><label>Email<input required type="email" value={member.email} onChange={e => update(index, 'email', e.target.value)} /></label><label>Phone<input required type="tel" value={member.phone} onChange={e => update(index, 'phone', e.target.value)} /></label></div>)}</div><div className="payment-summary"><span>Payment total</span><strong>{teamSize} {teamSize === 1 ? 'member' : 'members'} × ₹{PRICE} = ₹{amount}</strong></div><button className="button button-primary button-large" disabled={loading}>{loading ? 'Saving team…' : 'Continue to payment'}</button></form>}{step === 'payment' && <section className="payment-checkout"><h2>Pay ₹{amount}</h2><p>On a phone, tap an app below. The UPI intent opens the installed app with the amount filled in.</p><div className="gpay-box"><strong>{PAYEE_PHONE}</strong><span>{PAYEE_UPI_ID}</span><small>Payment recipient • Total: ₹{amount}</small></div><div className="payment-app-actions"><button type="button" className="button button-primary" onClick={() => launchPayment('gpay')}><Smartphone size={17} /> Open Google Pay</button><button type="button" className="button button-outline" onClick={() => launchPayment('phonepe')}><Smartphone size={17} /> Open PhonePe</button></div><p className="payment-note">If the app does not open, use the UPI ID above in any UPI app. After paying, return here and submit proof.</p><form onSubmit={submitPayment}><label>Payment screenshot<input required type="file" accept="image/*" onChange={e => setPaymentFile(e.target.files?.[0] ?? null)} /><small><Upload size={14} /> Upload the completed payment screen</small></label><label>12-digit UTR number<input required inputMode="numeric" maxLength={12} value={utr} onChange={e => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="123456789012" /></label><button className="button button-primary button-large">Submit payment for verification</button></form></section>}{step === 'pending' && <section className="pending-card"><h2>Payment submitted</h2><p>Your team is pending admin verification. Confirmation will be sent after the payment is approved.</p></section>}{message && <p className="form-message">{message}</p>}</div></main>
}
