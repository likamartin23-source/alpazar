'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

type Mode = 'login' | 'register' | 'forgot'
type Step = 'form' | 'otp' | 'new-pass'

const FN_URL = 'https://sopafwfkrxpcdaljddoh.supabase.co/functions/v1'

function isEmail(val: string) { return val.includes('@') }
function fmt2(n: number) { return String(n).padStart(2, '0') }

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
  body{background:#FFFBEA;}
  .wrap{min-height:100vh;background:#FFFBEA;display:flex;align-items:center;justify-content:center;padding:20px;}
  .card{background:#fff;border-radius:16px;border:1.5px solid #e0b030;padding:28px 24px;width:100%;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,.06);}
  .logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:18px;}
  .brand{font-size:24px;font-weight:700;color:#111;letter-spacing:2px;}
  h2{font-size:17px;font-weight:700;color:#111;margin-bottom:5px;text-align:center;}
  .sub{font-size:12px;color:#888;text-align:center;margin-bottom:18px;line-height:1.6;}
  .sub strong{color:#111;}
  .row-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .field{margin-bottom:12px;}
  label{font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px;}
  input[type=text],input[type=email],input[type=number],input[type=password]{width:100%;border:1.5px solid #ddd;border-radius:8px;padding:11px 13px;font-size:13px;font-family:inherit;outline:none;transition:border .15s;background:#fff;color:#111;}
  input:focus{border-color:#F5C842;}
  .hint{font-size:10px;color:#aaa;margin-top:4px;}
  .btn{width:100%;background:#E63312;color:#fff;border:none;border-radius:9px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px;transition:opacity .15s;}
  .btn:disabled{opacity:.6;cursor:not-allowed;}
  .btn-sec{width:100%;background:#F5C842;color:#111;border:none;border-radius:9px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px;}
  .btn-ghost{width:100%;background:none;color:#888;border:1.5px solid #eee;border-radius:9px;padding:11px;font-size:13px;cursor:pointer;font-family:inherit;}
  .btn-ghost:hover{border-color:#ddd;color:#555;}
  .msg{text-align:center;font-size:12px;padding:10px 12px;border-radius:8px;margin-bottom:12px;font-weight:500;line-height:1.5;}
  .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
  .err{background:#FFF0EE;color:#E63312;border:0.5px solid #F09595;}
  .info{background:#EEF4FF;color:#185FA5;border:0.5px solid #85B7EB;}
  .warn{background:#FFF8EE;color:#A05000;border:0.5px solid #F5C842;}
  .divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:#ccc;font-size:12px;}
  .divider::before,.divider::after{content:'';flex:1;border-top:1px solid #eee;}
  .back{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:14px;color:#888;font-size:12px;cursor:pointer;}
  .back:hover{color:#E63312;}
  .otp-row{display:flex;gap:8px;justify-content:center;margin-bottom:16px;}
  .otp-input{width:46px;height:54px;border:2px solid #ddd;border-radius:10px;font-size:22px;font-weight:700;text-align:center;color:#111;outline:none;transition:border .15s;background:#fff;}
  .otp-input:focus{border-color:#F5C842;background:#FFFBEA;}
  .otp-input.filled{border-color:#E63312;color:#E63312;}
  .otp-input:disabled{background:#f9f9f9;color:#bbb;border-color:#eee;}
  .countdown{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding:8px 12px;border-radius:8px;background:#FFFBEA;border:1px solid #f0e0a8;}
  .countdown-time{font-size:18px;font-weight:700;font-variant-numeric:tabular-nums;}
  .countdown-time.ok-c{color:#3B6D11;}
  .countdown-time.warn-c{color:#A05000;}
  .countdown-time.err-c{color:#E63312;}
  .resend-btn{font-size:12px;color:#E63312;font-weight:600;background:none;border:none;cursor:pointer;font-family:inherit;text-decoration:underline;}
  .resend-btn:disabled{color:#bbb;text-decoration:none;cursor:default;}
  .forgot-link{display:block;text-align:right;font-size:11px;color:#888;cursor:pointer;margin-bottom:14px;margin-top:-8px;text-decoration:underline;}
  .forgot-link:hover{color:#E63312;}
  .steps{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:16px;}
  .step-dot{width:8px;height:8px;border-radius:50%;background:#eee;}
  .step-dot.active{background:#E63312;width:20px;border-radius:4px;}
  .step-dot.done{background:#97C459;}
  .terms{font-size:10px;color:#aaa;text-align:center;margin-top:8px;line-height:1.6;}
  .terms a{color:#888;text-decoration:underline;}
  .pass-wrap{position:relative;}
  .pass-toggle{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#aaa;font-size:13px;padding:4px;}
`

const OTP_SECONDS = 60

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login')
  const [step, setStep] = useState<Step>('form')

  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)
  const [expired, setExpired] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/'
    })
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function startCountdown() {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(OTP_SECONDS)
    setExpired(false)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); setExpired(true); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function resetToForm() {
    setStep('form')
    setOtp(['', '', '', '', '', ''])
    setMsg('')
    setExpired(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function switchMode(m: Mode) {
    setMode(m); setStep('form'); setMsg('')
    setContact(''); setPassword(''); setNewPass(''); setNewPass2('')
    setFirstName(''); setLastName(''); setAge('')
    setOtp(['', '', '', '', '', ''])
    setExpired(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  // ── LOGIN (email + fjalëkalim) ────────────────────────────────────────────
  async function login() {
    if (!contact.trim() || !password) { setMsg('err:Plotëso emailin dhe fjalëkalimin!'); return }
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email: contact.trim(), password })
    if (error) {
      setMsg(`err:${error.message.includes('Invalid') ? 'Email ose fjalëkalim i gabuar!' : error.message}`)
    } else {
      setMsg('ok:Hyrja u krye! Duke të ridrejtuar...')
      setTimeout(() => { window.location.href = '/' }, 600)
    }
    setLoading(false)
  }

  // ── SEND OTP — via edge function (Resend) ────────────────────────────────
  async function sendOtp() {
    const raw = contact.trim()
    if (!raw) { setMsg('err:Fut emailin!'); return }
    if (!isEmail(raw)) { setMsg('err:Fut një email të vlefshëm!'); return }

    if (mode === 'register') {
      if (!firstName.trim()) { setMsg('err:Emri është i detyrueshëm!'); return }
      if (!lastName.trim()) { setMsg('err:Mbiemri është i detyrueshëm!'); return }
      const ageN = parseInt(age)
      if (!age || ageN < 16 || ageN > 120) { setMsg('err:Mosha duhet të jetë minimumi 16 vjeç!'); return }
    }

    setLoading(true); setMsg('')
    try {
      const res = await fetch(`${FN_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: raw }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        const e: string = data.error ?? 'Gabim gjatë dërgimit.'
        if (e.toLowerCase().includes('shumë kërkesa') || e.includes('429')) {
          setMsg('warn:Shumë kërkesa. Provo pas 10 minutash.')
        } else {
          setMsg(`err:${e}`)
        }
      } else {
        setStep('otp')
        startCountdown()
        setOtp(['', '', '', '', '', ''])
        setMsg(`info:Kodi u dërgua te ${raw} — kontrollo email-in (dhe spam)`)
        setTimeout(() => inputRefs.current[0]?.focus(), 150)
      }
    } catch (e: any) {
      setMsg(`err:${e.message}`)
    }
    setLoading(false)
  }

  // ── VERIFY OTP — via edge function ───────────────────────────────────────
  async function verifyOtp() {
    const code = otp.join('')
    if (code.length !== 6) { setMsg('err:Plotëso kodin 6-shifror!'); return }
    if (expired) { setMsg('err:Kodi ka skaduar! Kërko një kod të ri.'); return }
    setLoading(true); setMsg('')
    try {
      const res = await fetch(`${FN_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: contact.trim(),
          code,
          mode,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          age: age ? parseInt(age) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setMsg(`err:${data.error ?? 'Kodi i gabuar ose ka skaduar!'}`)
        return
      }

      // Use the magic link token_hash to create a real Supabase session
      const { error: sessErr } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      })
      if (sessErr) { setMsg(`err:${sessErr.message}`); setLoading(false); return }

      if (timerRef.current) clearInterval(timerRef.current)

      if (mode === 'register') {
        setMsg('ok:Llogaria u krijua! Duke u ridrejtuar...')
        setTimeout(() => { window.location.href = '/' }, 700)
      } else {
        // forgot — go to new-password step
        setStep('new-pass')
        setMsg('')
      }
    } catch (e: any) {
      setMsg(`err:${e.message}`)
    }
    setLoading(false)
  }

  // ── SET NEW PASSWORD ──────────────────────────────────────────────────────
  async function setNewPassword() {
    if (newPass.length < 6) { setMsg('err:Fjalëkalimi duhet të ketë minimumi 6 karaktere!'); return }
    if (newPass !== newPass2) { setMsg('err:Fjalëkalimet nuk përputhen!'); return }
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) {
      setMsg(`err:${error.message}`)
    } else {
      setMsg('ok:Fjalëkalimi u ndryshua! Duke u ridrejtuar...')
      setTimeout(() => { window.location.href = '/' }, 700)
    }
    setLoading(false)
  }

  // ── OTP INPUT HANDLERS ────────────────────────────────────────────────────
  function handleOtpChange(i: number, val: string) {
    if (!/^\d*$/.test(val) || expired) return
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next)
    if (val && i < 5) setTimeout(() => inputRefs.current[i + 1]?.focus(), 0)
  }
  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const next = [...otp]; next[i - 1] = ''; setOtp(next)
      inputRefs.current[i - 1]?.focus()
    }
    if (e.key === 'Enter' && otp.join('').length === 6) verifyOtp()
  }
  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const next = Array(6).fill('')
    text.split('').forEach((d, i) => { next[i] = d })
    setOtp(next)
    setTimeout(() => inputRefs.current[Math.min(text.length, 5)]?.focus(), 0)
  }

  const [t, m] = msg.split(':')
  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60
  const timeClass = countdown > 30 ? 'ok-c' : countdown > 10 ? 'warn-c' : 'err-c'
  const stepCount = mode === 'forgot' ? 3 : mode === 'register' ? 2 : 1
  const stepIdx = step === 'form' ? 0 : step === 'otp' ? 1 : 2

  return (
    <>
      <style>{CSS}</style>
      <div className="wrap">
        <div className="card">
          <div className="logo">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#E63312"/>
              <g fill="#111">
                <ellipse cx="20" cy="22" rx="4" ry="5.5"/>
                <circle cx="15.5" cy="13" r="3.2"/>
                <circle cx="24.5" cy="13" r="3.2"/>
                <polygon points="13,15.5 11,16.5 13,17.5"/>
                <polygon points="27,15.5 29,16.5 27,17.5"/>
                <polygon points="20,20 6,18 8,26 20,25"/>
                <polygon points="20,20 34,18 32,26 20,25"/>
                <polygon points="17,27 23,27 24,33 20,32 16,33"/>
              </g>
              <rect x="24" y="26" width="12" height="10" rx="3" fill="#F5C842"/>
            </svg>
            <span className="brand">ALPAZAR</span>
          </div>

          {mode !== 'login' && (
            <div className="steps">
              {Array.from({ length: stepCount }).map((_, i) => (
                <div key={i} className={`step-dot ${i === stepIdx ? 'active' : i < stepIdx ? 'done' : ''}`} />
              ))}
            </div>
          )}

          {msg && <div className={`msg ${t}`}>{m}</div>}

          {/* ─── LOGIN ──────────────────────────────────── */}
          {mode === 'login' && (
            <>
              <h2>🔑 Hyr në llogarinë tënde</h2>
              <p className="sub">ALPAZAR · Shit · Bli · Bëj Pazrin Tënd</p>

              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="emaili@domain.com" value={contact}
                  onChange={e => setContact(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && login()} autoComplete="email" />
              </div>

              <div className="field">
                <label>Fjalëkalimi</label>
                <div className="pass-wrap">
                  <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && login()} autoComplete="current-password"
                    style={{ paddingRight: 36 }} />
                  <button className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <span className="forgot-link" onClick={() => switchMode('forgot')}>
                Harrove fjalëkalimin?
              </span>

              <button className="btn" onClick={login} disabled={loading}>
                {loading ? '⏳ Duke hyrë...' : '🔑 Hyr'}
              </button>

              <div className="divider">ose</div>

              <button className="btn-sec" onClick={() => switchMode('register')}>
                📝 Regjistrohu falas
              </button>
            </>
          )}

          {/* ─── REGISTER — step: form ───────────────────── */}
          {mode === 'register' && step === 'form' && (
            <>
              <h2>🚀 Regjistrohu falas</h2>
              <p className="sub">Krijo llogarinë tënde — falas, pa fjalëkalim</p>

              <div className="row-2">
                <div className="field">
                  <label>Emri *</label>
                  <input type="text" placeholder="Arta" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="field">
                  <label>Mbiemri *</label>
                  <input type="text" placeholder="Hoxha" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="field">
                <label>Mosha * (min. 16 vjeç)</label>
                <input type="number" placeholder="25" value={age} onChange={e => setAge(e.target.value)} min="16" max="120" />
              </div>

              <div className="field">
                <label>Email *</label>
                <input type="email" placeholder="email@domain.com"
                  value={contact} onChange={e => setContact(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()} autoComplete="email" />
                <p className="hint">📧 Do të marrësh kodin e konfirmimit me email</p>
              </div>

              <button className="btn" onClick={() => sendOtp()} disabled={loading}>
                {loading ? '⏳ Duke dërguar kodin...' : '📨 Dërgo Kodin'}
              </button>

              <div className="divider">ose</div>
              <button className="btn-ghost" onClick={() => switchMode('login')}>🔑 Ke llogari? Hyr</button>

              <p className="terms">
                Duke u regjistruar pranon{' '}
                <a href="/kushtet">Kushtet e Përdorimit</a> dhe{' '}
                <a href="/privatesia">Politikën e Privatësisë</a>
              </p>
            </>
          )}

          {/* ─── FORGOT — step: form ──────────────────────── */}
          {mode === 'forgot' && step === 'form' && (
            <>
              <h2>🔓 Rivendos Fjalëkalimin</h2>
              <p className="sub">Fut emailin tënd — dërgojmë një kod konfirmimi</p>

              <div className="field">
                <label>Email *</label>
                <input type="email" placeholder="emaili@domain.com" value={contact}
                  onChange={e => setContact(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()} autoComplete="email" />
              </div>

              <button className="btn" onClick={() => sendOtp()} disabled={loading}>
                {loading ? '⏳ Duke dërguar kodin...' : '📨 Dërgo Kodin'}
              </button>

              <button className="btn-ghost" onClick={() => switchMode('login')}>← Kthehu te hyrja</button>
            </>
          )}

          {/* ─── OTP STEP ─────────────────────────────────── */}
          {(mode === 'register' || mode === 'forgot') && step === 'otp' && (
            <>
              <h2>🔐 Konfirmo Kodin</h2>
              <p className="sub">
                Kodi 6-shifror u dërgua te<br /><strong>{contact}</strong><br />
                <span style={{ fontSize: 10 }}>(kontrollo spam nëse nuk e gjen)</span>
              </p>

              <div className="countdown">
                <span style={{ fontSize: 12, color: '#888' }}>
                  {expired ? 'Kodi skadoi' : 'Skadon në:'}
                </span>
                <span className={`countdown-time ${expired ? 'err-c' : timeClass}`}>
                  {expired ? '0:00' : `${mins}:${fmt2(secs)}`}
                </span>
                <button className="resend-btn" onClick={() => sendOtp()} disabled={loading}>
                  {loading ? '...' : 'Ridërgo'}
                </button>
              </div>

              {expired && (
                <div className="msg warn">Kodi ka skaduar. Klikoje "Ridërgo" për një kod të ri.</div>
              )}

              <div className="otp-row" onPaste={handleOtpPaste}>
                {otp.map((d, i) => (
                  <input key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    className={`otp-input${d ? ' filled' : ''}`}
                    type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
                    value={d} disabled={expired}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    autoComplete="one-time-code" />
                ))}
              </div>

              <button className="btn" onClick={verifyOtp} disabled={loading || expired}>
                {loading ? '⏳ Duke verifikuar...' : '✅ Konfirmo Kodin'}
              </button>

              <button className="btn-ghost" onClick={resetToForm}>← Ndrysho adresën</button>
            </>
          )}

          {/* ─── FORGOT — new-pass ──────────────────────── */}
          {mode === 'forgot' && step === 'new-pass' && (
            <>
              <h2>🔒 Vendos Fjalëkalim të Ri</h2>
              <p className="sub">Zgjidh një fjalëkalim të sigurt (min. 6 karaktere)</p>

              <div className="field">
                <label>Fjalëkalimi i ri *</label>
                <div className="pass-wrap">
                  <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={newPass}
                    onChange={e => setNewPass(e.target.value)} autoComplete="new-password"
                    style={{ paddingRight: 36 }} />
                  <button className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Konfirmo fjalëkalimin *</label>
                <input type="password" placeholder="••••••••" value={newPass2}
                  onChange={e => setNewPass2(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setNewPassword()}
                  autoComplete="new-password" />
              </div>

              <button className="btn" onClick={setNewPassword} disabled={loading}>
                {loading ? '⏳ Duke ruajtur...' : '🔒 Ruaj Fjalëkalimin'}
              </button>
            </>
          )}

          <div className="back" onClick={() => window.location.href = '/'}>← Kthehu te faqja kryesore</div>
        </div>
      </div>
    </>
  )
}
