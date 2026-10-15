'use client'

import { useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Code2,
  Link,
  Menu,
  Share2,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react'

const posterUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Ir0No5qW3qMeWPFARPLBAUmbuWeHyb.png'
const registrationUrl = '#register'

const benefits = [
  { number: '01', icon: ClipboardCheck, title: 'Digital certificate', body: 'An online participation certificate for eligible participants.' },
  { number: '02', icon: Trophy, title: 'The hall of fame', body: 'Winning projects and past winners can be showcased on the hackathon homepage.' },
  { number: '03', icon: Link, title: 'LinkedIn visibility', body: 'Opportunities to share the event and celebrate achievements through professional networks.' },
  { number: '04', icon: Code2, title: 'Build your portfolio', body: 'Demonstrate problem-solving, creativity, and technical skills through a project.' },
]

const steps = [
  ['01', 'Join the game', 'Complete the official registration process.'],
  ['02', 'Build your idea', 'Develop a solution based on your own idea.'],
  ['03', 'Submit your project', 'Complete the official online submission process.'],
  ['04', 'Claim your moment', 'Await the judging outcome and celebrate the announced winners.'],
]

const faqs = [
  ['Who can participate?', 'College students can participate in the hackathon.'],
  ['How do I register?', 'Complete the official registration form to join the hackathon.'],
  ['What do I submit?', 'Submit any good idea that solves a meaningful problem or creates something useful.'],
  ['Will I receive a certificate?', 'All participants will get a online certificate, and winners will receive an additional certificate and prize.'],
]

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main className="arena-shell">
      <div className="noise" aria-hidden="true" />
      <header className="nav-wrap">
        <nav className="nav container" aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="Squid Games Hackathon home">
            <span className="brand-mark"><Circle size={17} strokeWidth={3} /><span /></span>
            <span>SGH<span className="brand-dot">/</span>26</span>
          </a>
          <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
            <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
            <a href="#rewards" onClick={() => setMenuOpen(false)}>Rewards</a>
            <a href="#experience" onClick={() => setMenuOpen(false)}>Experience</a>
            <a href="#hall-of-fame" onClick={() => setMenuOpen(false)}>Hall of fame</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a className="nav-register" href={registrationUrl} onClick={() => setMenuOpen(false)}>Register <ArrowRight size={15} /></a>
          </div>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </nav>
      </header>

      <section id="top" className="hero container">
        <div className="hero-atmosphere"><span className="shape triangle">△</span><span className="shape square">□</span><span className="shape circle-shape">○</span></div>
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> College hackathon <span className="eyebrow-line" /> 01 / enter arena</div>
          <h1>THE NEXT MOVE<br /><em>COULD BE YOURS.</em></h1>
          <p className="hero-lede">Think beyond the ordinary. Build something extraordinary. Enter the Squid Games Hackathon, compete with talented minds, and turn your ideas into an opportunity for cash prizes and recognition.</p>
          <div className="hero-actions">
            <a className="button button-primary" href={registrationUrl}>Enter the arena <ArrowRight size={18} /></a>
            <a className="text-link" href="#rewards">Explore the rewards <ArrowDown size={16} /></a>
          </div>
          <div className="hero-stats">
            <div><strong>₹10,000</strong><span>First place</span></div>
            <div className="stat-divider" />
            <div><strong>₹5,000</strong><span>Second place</span></div>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-ring" />
          <div className="poster-frame"><img src={posterUrl} alt="Squid Games Hackathon poster with neon prizes and arena artwork" /></div>
          <div className="art-label label-top">// THE ARENA IS LIVE</div>
          <div className="art-label label-bottom">CREATIVITY <span>×</span> CODE <span>×</span> COURAGE</div>
        </div>
        <div className="scroll-cue"><span>Scroll to enter</span><div className="scroll-line" /></div>
      </section>

      <section id="about" className="intro section container">
        <div className="section-kicker">[ 00 / THE BRIEF ]</div>
        <div className="intro-grid"><h2>ONE ARENA.<br /><span>ENDLESS</span><br />POSSIBILITIES.</h2><div><p className="big-copy">Your idea is the only weapon you need.</p><p className="muted-copy">A high-energy arena for students who think differently, build boldly, and want their work to be seen. This is your moment to turn an instinct into an impact.</p></div></div>
      </section>

      <section id="rewards" className="rewards section">
        <div className="container"><div className="section-heading"><div><div className="section-kicker">[ 01 / THE STAKES ]</div><h2>THE STAKES<br /><span>ARE REAL.</span></h2></div><p>Bring your boldest ideas.<br />Build your strongest solution.<br />Compete for the rewards.</p></div>
          <div className="prize-grid">
            <article className="prize-card first"><div className="prize-top"><span>01 / FIRST PLACE</span><Award /></div><div className="trophy trophy-gold">★</div><div className="amount">₹10,000</div><div className="prize-note">The boldest build takes it all.</div><div className="corner-mark">↗</div></article>
            <article className="prize-card second"><div className="prize-top"><span>02 / SECOND PLACE</span><Trophy /></div><div className="trophy trophy-green">✦</div><div className="amount">₹5,000</div><div className="prize-note">Great ideas deserve a spotlight.</div><div className="corner-mark">↗</div></article>
          </div>
        </div>
      </section>

      <section id="experience" className="benefits section container"><div className="section-kicker">[ 02 / YOUR ADVANTAGE ]</div><div className="section-heading compact"><h2>MORE THAN<br /><span>A COMPETITION.</span></h2><p>Leave with more than a result.<br />Leave with momentum.</p></div><div className="benefit-grid">{benefits.map(({ number, icon: Icon, title, body }) => <article className="benefit-card" key={number}><div className="benefit-number">{number}</div><Icon className="benefit-icon" /><h3>{title}</h3><p>{body}</p></article>)}</div></section>

      <section className="journey section"><div className="container"><div className="section-kicker">[ 03 / THE GAMEPLAN ]</div><div className="section-heading compact"><h2>MAKE YOUR<br /><span>MOVE.</span></h2><p>Four steps between you<br />and your moment.</p></div><div className="timeline">{steps.map(([num, title, body], i) => <div className="step" key={num}><div className="step-node">{num}</div><div className="step-content"><h3>{title}</h3><p>{body}</p></div>{i < steps.length - 1 && <div className="step-line" />}</div>)}</div></div></section>

      <section id="hall-of-fame" className="hall section container"><div className="section-kicker">[ 04 / HALL OF FAME ]</div><div className="hall-card"><div><Sparkles className="hall-icon" /><h2>LEGENDS<br /><span>ARE MADE HERE.</span></h2><p>The arena is waiting for its next headline. Will it be yours?</p></div><div className="empty-board"><div className="empty-board-top"><span>LEADERBOARD / 00</span><span>STATUS: OPEN</span></div><div className="empty-board-center"><span className="empty-symbol">+</span><strong>YOUR PROJECT<br />COULD BE HERE</strong><small>Winning builds will be showcased here.</small></div></div></div></section>

      <section className="share section"><div className="container share-inner"><div><div className="section-kicker">[ 05 / BROADCAST ]</div><h2>BUILD IT.<br /><span>SHARE IT.</span><br />GET NOTICED.</h2></div><div className="share-copy"><p>Document the process. Share the breakthrough. Celebrate the achievement with your network.</p><a className="button button-outline" href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fsquidgameshackathon.com" target="_blank" rel="noreferrer">Share on LinkedIn <Share2 size={16} /></a></div></div></section>

      <section id="faq" className="faq section container"><div className="faq-heading"><div className="section-kicker">[ 06 / INTEL ]</div><h2>FREQUENTLY<br /><span>ASKED.</span></h2></div><div className="faq-list">{faqs.map(([question, answer], i) => <div className={`faq-item ${openFaq === i ? 'open' : ''}`} key={question}><button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}><span><b>0{i + 1}</b>{question}</span><ChevronDown /></button>{openFaq === i && <p>{i === 1 ? <>Complete the official <a className="faq-registration-link" href={registrationUrl}><strong>registration</strong></a> form to join the hackathon.</> : answer}</p>}</div>)}</div></section>

      <section id="register" className="register section container"><div className="register-panel"><div className="section-kicker">[ FINAL CHECKPOINT / 07 ]</div><h2>YOUR MOVE.<br /><span>YOUR MOMENT.</span></h2><p>The arena is waiting. Bring your ideas, challenge yourself, and show what you can create.</p><a className="button button-primary button-large" href={registrationUrl}>Register now <ArrowRight size={20} /></a><div className="register-line" /></div></section>

      <footer className="footer container"><div className="brand"><span className="brand-mark"><Circle size={17} strokeWidth={3} /><span /></span><span>SGH<span className="brand-dot">/</span>26</span></div><p>Squid Games Hackathon<span> — One arena. Endless possibilities.</span></p><div className="footer-links"><a href="#top">Back to top ↑</a><a href="#faq">FAQ</a><a href="mailto:hello@squidgameshackathon.com">Contact organizers</a></div></footer>
    </main>
  )
}
