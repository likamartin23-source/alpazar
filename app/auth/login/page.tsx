'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
export default function Login() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [msg, setMsg] = useState('')
  const css = `*{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
  .wrap{min-height:100vh;background:#FFFBEA;display:flex;align-items:center;justify-content:center;padding:20px;}
  .card{background:#fff;border-radius:16px;border:1.5px solid #e0b030;padding:32px;width:100%;max-width:380px;}
  .logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:24px;}
  .brand{font-size:24px;font-weight:700;color:#111;letter-spacing:2px;}
  h2{font-size:18px;font-weight:700;color:#111;margin-bottom:6px;text-align:center;}
  p{font-size:13px;color:#888;text-align:center;margin-bottom:24px;}
  label{font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:4px;}
  input{width:100%;border:1px solid #ddd;border-radius:8px;padding:10px 14px;font-size:14px;font-family:inherit;outline:none;margin-bottom:14px;}
  input:focus{border-color:#F5C842;}
  .btn{width:100%;background:#E63312;color:#fff;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:12px;}
  .btn-sec{width:100%;background:#F5C842;color:#111;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
  .msg{text-align:center;font-size:12px;padding:8px;border-radius:6px;margin-bottom:10px;}
  .msg.ok{background:#EAF3DE;color:#3B6D11;} .msg.err{background:#FFF0EE;color:#E63312;}`
  async function handle() {
    setMsg('')
    if (mode==='login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) setMsg('error:'+error.message)
      else { setMsg('ok:Hyrja u krye!'); setTimeout(()=>window.location.href='/',1000) }
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pass })
      if (error) setMsg('error:'+error.message)
      else setMsg('ok:Regjistrim i suksesshem! Kontrollo emailin.')
    }
  }
  const [t,m] = msg.split(':')
  return (<>
    <style>{css}</style>
    <div className="wrap"><div className="card">
      <div className="logo">
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#E63312"/><g fill="#111"><ellipse cx="20" cy="22" rx="4" ry="5.5"/><circle cx="15.5" cy="13" r="3.2"/><circle cx="24.5" cy="13" r="3.2"/><polygon points="13,15.5 11,16.5 13,17.5"/><polygon points="27,15.5 29,16.5 27,17.5"/><polygon points="20,20 6,18 8,26 20,25"/><polygon points="20,20 34,18 32,26 20,25"/><polygon points="17,27 23,27 24,33 20,32 16,33"/></g><rect x="24" y="26" width="12" height="10" rx="3" fill="#F5C842"/></svg>
        <span className="brand">ALPAZAR</span>
      </div>
      <h2>{mode==='login'?'Hyr ne llogari':'Krijo llogari'}</h2>
      <p>Shit - Bli - Bej Pazrin Tend</p>
      {msg && <div className={`msg ${t}`}>{m}</div>}
      <label>Email *</label>
      <input type="email" placeholder="emaili@domain.com" value={email} onChange={e=>setEmail(e.target.value)}/>
      <label>Fjalekalimi *</label>
      <input type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)}/>
      <button className="btn" onClick={handle}>{mode==='login'?'Hyr':'Regjistrohu'}</button>
      <button className="btn-sec" onClick={()=>setMode(mode==='login'?'register':'login')}>
        {mode==='login'?'Nuk ke llogari? Regjistrohu':'Ke llogari? Hyr'}
      </button>
    </div></div>
  </>)
}
