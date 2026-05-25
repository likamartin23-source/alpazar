'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

type Step = 'form' | 'otp'
type Mode = 'login' | 'register'

function isEmail(val: string) { return val.includes('@') }
function toE164(phone: string) {
  const clean = phone.replace(/[\s\-()]/g, '')
  if (clean.startsWith('+')) return clean
  if (clean.startsWith('06') || clean.startsWith('07')) return '+355' + clean.slice(1)
  if (clean.startsWith('6') || clean.startsWith('7')) return '+355' + clean
  return '+355' + clean
}

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
  body{background:#FFFBEA;}
  .wrap{min-height:100vh;background:#FFFBEA;display:flex;align-items:center;justify-content:center;padding:20px;}
  .card{background:#fff;border-radius:16px;border:1.5px solid #e0b030;padding:28px 24px;width:100%;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,.06);}
  .logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:20px;}
  .brand{font-size:24px;font-weight:700;color:#111;letter-spacing:2px;}
  h2{font-size:17px;font-weight:700;color:#111;margin-bottom:5px;text-align:center;}
  .sub{font-size:12px;color:#888;text-align:center;margin-bottom:20px;line-height:1.6;}
  .sub strong{color:#111;}
  .row-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .field{margin-bottom:12px;}
  label{font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px;}
  input[type=text],input[type=email],input[type=number]{width:100%;border:1.5px solid #ddd;border-radius:8px;padding:11px 13px;font-size:13px;font-family:inherit;outline:none;transition:border .15s;background:#fff;color:#111;}
  input[type=text]:focus,input[type=email]:focus,input[type=number]:focus{border-color:#F5C842;}
  .hint{font-size:10px;color:#aaa;margin-top:4px;}
  .btn{width:100%;background:#E63312;color:#fff;border:none;border-radius:9px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:12px;transition:opacity .15s;}
  .btn:disabled{opacity:.6;cursor:not-allowed;}
  .btn-sec{width:100%;background:#F5C842;color:#111;border:none;border-radius:9px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
  .msg{text-align:center;font-size:12px;padding:10px 12px;border-radius:8px;margin-bottom:14px;font-weight:500;line-height:1.5;}
  .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
  .err{background:#FFF0EE;color:#E63312;border:0.5px solid #F09595;}
  .info{background:#EEF4FF;color:#185FA5;border:0.5px solid #85B7EB;}
  .divider{display:flex;align-items:center;gap:10px;margin:14px 0;color:#ccc;font-size:12px;}
  .divider::before,.divider::after{content:'';flex:1;border-top:1px solid #eee;}
  .back{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:16px;color:#888;font-size:12px;cursor:pointer;text-decoration:none;}
  .back:hover{color:#E63312;}
  .otp-row{display:flex;gap:8px;justify-content:center;margin-bottom:20px;}
  .otp-input{width:46px;height:56px;border:2px solid #ddd;border-radius:10px;font-size:22px;font-weight:700;text-align:center;color:#111;outline:none;transition:border .15s;background:#fff;caret-color:#E63312;}
  .otp-input:focus{border-color:#F5C842;background:#FFFBEA;}
  .otp-input.filled{border-color:#E63312;color:#E63312;}
  .resend{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:14px;}
  .resend span{font-size:12px;color:#888;}
  .resend-btn{font-size:12px;color:#E63312;font-weight:600;background:none;border:none;cursor:pointer;font-family:inherit;text-decoration:underline;}
  .steps{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:18px;}
  .step-dot{width:8px;height:8px;border-radius:50%;background:#eee;}
  .step-dot.active{background:#E63312;width:24px;border-radius:4px;}
  .step-dot.done{background:#97C459;}
  .terms{font-size:10px;color:#aaa;text-align:center;margin-top:10px;line-height:1.6;}
  .terms a{color:#888;text-decoration:underline;}
`

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login')
  const [step, setStep] = useState<Step>('form')
  const [contact, setContact] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/'
    })
  }, [])

  function validate() {
    if (mode === 'register') {
      if (!firstName.trim()) return 'Emri është i detyrueshëm!'
      if (!lastName.trim()) return 'Mbiemri është i detyrueshëm!'
      const ageN = parseInt(age)
      if (!age || ageN < 16 || ageN > 120) return 'Mosha duhet të jetë minimumi 16 vjeç!'
    }
    if (!contact.trim()) return 'Fut emailin ose numrin e telefonit!'
    return null
  }

  async function sendOtp() {
    const err = validate()
    if (err) { setMsg('err:' + err); return }
    setLoading(true); setMsg('')
    try {
      const c = contact.trim()
      const emailContact = isEmail(c)
      let error: any
      if (emailContact) {
        const res = await supabase.auth.signInWithOtp({ email: c, options: { shouldCreateUser: true } })
        error = res.error
      } else {
        const phone = toE164(c)
        const res = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true } })
        error = res.error
      }
      if (error) {
        setMsg(`err:${error.message}`)
      } else {
        setStep('otp')
        setMsg(`info:Kodi u dërgua te ${c} ✉️`)
        setTimeout(() => inputRefs.current[0]?.focus(), 150)
      }
    } catch (e: any) {
      setMsg(`err:${e.message}`)
    }
    setLoading(false)
  }

  async function verifyOtp() {
    const code = otp.join('')
    if (code.length !== 6) { setMsg('err:Plotëso kodin 6-shifror!'); return }
    setLoading(true); setMsg('')
    try {
      const c = contact.trim()
      const emailContact = isEmail(c)
      let data: any, error: any
      if (emailContact) {
        const res = await supabase.auth.verifyOtp({ email: c, token: code, type: 'email' })
        data = res.data; error = res.error
      } else {
        const res = await supabase.auth.verifyOtp({ phone: toE164(c), token: code, type: 'sms' })
        data = res.data; error = res.error
      }
      if (error) {
        setMsg(`err:${error.message.includes('expired') || error.message.includes('invalid') ? 'Kodi i gabuar ose ka skaduar! Provo sërish.' : error.message}`)
      } else if (data?.user) {
        if (mode === 'register') {
          const emailContact = isEmail(c)
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            phone: emailContact ? undefined : toE164(c),
            age: parseInt(age),
            username: emailContact ? c.split('@')[0].replace(/[^a-z0-9_]/gi, '') : undefined,
          }, { onConflict: 'id' })
        }
        setMsg('ok:Mirë se vjen! Duke u ridrejtuar...')
        setTimeout(() => { window.location.href = '/' }, 700)
      }
    } catch (e: any) {
      setMsg(`err:${e.message}`)
    }
    setLoading(false)
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) setTimeout(() => inputRefs.current[i + 1]?.focus(), 0)
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const next = [...otp]; next[i - 1] = ''
      setOtp(next)
      inputRefs.current[i - 1]?.focus()
    }
    if (e.key === 'Enter' && otp.join('').length === 6) verifyOtp()
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length > 0) {
      const next = Array(6).fill('')
      text.split('').forEach((d, i) => { next[i] = d })
      setOtp(next)
      const focusIdx = Math.min(text.length, 5)
      setTimeout(() => inputRefs.current[focusIdx]?.focus(), 0)
    }
  }

  function switchMode(m: Mode) {
    setMode(m); setMsg(''); setStep('form')
    setFirstName(''); setLastName(''); setAge(''); setContact('')
    setOtp(['', '', '', '', '', ''])
  }

  const [t, m] = msg.split(':')
  const emailContact = isEmail(contact)

  return (
    <>
      <style>{CSS}</style>
      <div className="wrap">
        <div className="card">
          <div className="logo">
            <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
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

          <div className="steps">
            <div className={`step-dot ${step === 'form' ? 'active' : 'done'}`} />
            <div className={`step-dot ${step === 'otp' ? 'active' : ''}`} />
          </div>

          {step === 'form' ? (
            <>
              <h2>{mode === 'login' ? '🔑 Hyr në llogarinë tënde' : '🚀 Regjistrohu falas'}</h2>
              <p className="sub">
                {mode === 'login'
                  ? 'Fut emailin ose telefonin — dërgojmë kod konfirmimi automatikisht'
                  : 'Krijo llogarinë tënde në ALPAZAR — falas dhe pa fjalëkalim'}
              </p>

              {msg && <div className={`msg ${t}`}>{m}</div>}

              {mode === 'register' && (
                <>
                  <div className="row-2">
                    <div className="field">
                      <label>Emri *</label>
                      <input
                        type="text"
                        placeholder="Arta"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Mbiemri *</label>
                      <input
                        type="text"
                        placeholder="Hoxha"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Mosha * (min. 16 vjeç)</label>
                    <input
                      type="number"
                      placeholder="25"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      min="16"
                      max="120"
                    />
                  </div>
                </>
              )}

              <div className="field">
                <label>
                  {mode === 'register' ? 'Email ose Numri i Telefonit *' : 'Email ose Numri i Telefonit'}
                </label>
                <input
                  type="text"
                  placeholder="email@domain.com  ose  +355 6X XXX XXXX"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  autoComplete="email"
                />
                <p className="hint">
                  {contact.length > 2
                    ? emailContact
                      ? '📧 Do të dërgojmë kodin konfirmimit me email'
                      : '📱 Do të dërgojmë SMS me kodin (formati: +355 6X XXX XXXX)'
                    : '📧 Email  ·  📱 Telefon (+355...)'}
                </p>
              </div>

              <button className="btn" onClick={sendOtp} disabled={loading}>
                {loading ? '⏳ Duke dërguar kodin...' : '📨 Dërgo Kodin'}
              </button>

              <div className="divider">ose</div>

              <button className="btn-sec" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? '📝 Nuk ke llogari? Regjistrohu falas' : '🔑 Ke llogari? Hyr'}
              </button>

              {mode === 'register' && (
                <p className="terms">
                  Duke u regjistruar pranon{' '}
                  <a href="/kushtet">Kushtet e Përdorimit</a>
                  {' '}dhe{' '}
                  <a href="/privatesia">Politikën e Privatësisë</a>
                </p>
              )}
            </>
          ) : (
            <>
              <h2>🔐 Konfirmo Identitetin</h2>
              <p className="sub">
                Kodi 6-shifror u dërgua te<br />
                <strong>{contact}</strong>
              </p>

              {msg && <div className={`msg ${t}`}>{m}</div>}

              <div className="otp-row" onPaste={handleOtpPaste}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    className={`otp-input${d ? ' filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button className="btn" onClick={verifyOtp} disabled={loading}>
                {loading ? '⏳ Duke verifikuar...' : '✅ Konfirmo Kodin'}
              </button>

              <div className="resend">
                <span>Nuk e more kodin?</span>
                <button
                  className="resend-btn"
                  onClick={() => {
                    setStep('form')
                    setOtp(['', '', '', '', '', ''])
                    setMsg('')
                  }}
                >
                  Kthehu & Dërgo sërish
                </button>
              </div>
            </>
          )}

          <div className="back" onClick={() => window.location.href = '/'}>
            ← Kthehu te faqja kryesore
          </div>
        </div>
      </div>
    </>
  )
}
