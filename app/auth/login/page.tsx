'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If already logged in, redirect home
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/'
    })
  }, [])

  const css = `
    *{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
    .wrap{min-height:100vh;background:#FFFBEA;display:flex;align-items:center;justify-content:center;padding:20px;}
    .card{background:#fff;border-radius:16px;border:1.5px solid #e0b030;padding:32px;width:100%;max-width:380px;box-shadow:0 4px 24px rgba(0,0,0,.06);}
    .logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:24px;}
    .brand{font-size:24px;font-weight:700;color:#111;letter-spacing:2px;}
    h2{font-size:18px;font-weight:700;color:#111;margin-bottom:6px;text-align:center;}
    .sub{font-size:13px;color:#888;text-align:center;margin-bottom:24px;}
    label{font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px;}
    input{width:100%;border:1.5px solid #ddd;border-radius:8px;padding:11px 14px;font-size:14px;font-family:inherit;outline:none;margin-bottom:14px;transition:border .15s;}
    input:focus{border-color:#F5C842;}
    .btn{width:100%;background:#E63312;color:#fff;border:none;border-radius:9px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:12px;transition:opacity .15s;}
    .btn:disabled{opacity:.6;cursor:not-allowed;}
    .btn-sec{width:100%;background:#F5C842;color:#111;border:none;border-radius:9px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
    .msg{text-align:center;font-size:12px;padding:10px;border-radius:8px;margin-bottom:12px;font-weight:500;}
    .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
    .err{background:#FFF0EE;color:#E63312;border:0.5px solid #F09595;}
    .info{background:#EEF4FF;color:#185FA5;border:0.5px solid #85B7EB;}
    .divider{display:flex;align-items:center;gap:10px;margin:16px 0;color:#ccc;font-size:12px;}
    .divider::before,.divider::after{content:'';flex:1;border-top:1px solid #eee;}
    .back{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:16px;color:#888;font-size:12px;text-decoration:none;cursor:pointer;}`

  async function handle() {
    if (!email.trim() || !pass.trim()) { setMsg('err:Plotëso emailin dhe fjalëkalimin!'); return }
    setLoading(true); setMsg('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
        if (error) {
          setMsg(`err:${error.message === 'Invalid login credentials' ? 'Email ose fjalëkalim i gabuar!' : error.message}`)
        } else {
          setMsg('ok:Hyrja u krye! Duke të ridrejtuar...')
          setTimeout(() => { window.location.href = '/' }, 600)
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) {
          setMsg(`err:${error.message}`)
        } else if (data.user && !data.session) {
          setMsg('info:Kontrollo emailin tënd për konfirmim!')
        } else {
          setMsg('ok:Llogaria u krijua! Duke të ridrejtuar...')
          setTimeout(() => { window.location.href = '/' }, 600)
        }
      }
    } catch (e: any) {
      setMsg(`err:${e.message || 'Gabim. Provo përsëri.'}`)
    }
    setLoading(false)
  }

  const [t, m] = msg.split(':')

  return (
    <>
      <style>{css}</style>
      <div className="wrap">
        <div className="card">
          <div className="logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
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

          <h2>{mode === 'login' ? 'Hyr në llogarinë tënde' : 'Krijo llogari falas'}</h2>
          <p className="sub">🦅 Shit · Bli · Bëj Pazrin Tënd</p>

          {msg && <div className={`msg ${t}`}>{m}</div>}

          <label>Email *</label>
          <input type="email" placeholder="emaili@domain.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />

          <label>Fjalëkalimi * (min. 6 karaktere)</label>
          <input type="password" placeholder="••••••••" value={pass}
            onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} />

          <button className="btn" onClick={handle} disabled={loading}>
            {loading ? '⏳ Duke u procesuar...' : mode === 'login' ? '🔑 Hyr' : '🚀 Regjistrohu falas'}
          </button>

          <div className="divider">ose</div>

          <button className="btn-sec" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg('') }}>
            {mode === 'login' ? '📝 Nuk ke llogari? Regjistrohu' : '🔑 Ke llogari? Hyr'}
          </button>

          <div className="back" onClick={() => window.location.href = '/'}>← Kthehu te faqja kryesore</div>
        </div>
      </div>
    </>
  )
}
