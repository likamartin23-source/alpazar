'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'alpazar_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [detail, setDetail]   = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {}
  }, [])

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, 'accepted') } catch {}
    setVisible(false)
  }

  function decline() {
    try { localStorage.setItem(STORAGE_KEY, 'declined') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Cookies"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: '#111', color: '#fff',
        padding: '14px 16px 18px',
        boxShadow: '0 -4px 24px rgba(0,0,0,.4)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        maxWidth: 480, margin: '0 auto',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>🍪</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Alpazar përdor cookies</div>
          <div style={{ fontSize: 11, color: '#bbb', lineHeight: 1.6 }}>
            Përdorim cookies thelbësore për funksionimin e platformës dhe analytics anonime për ta përmirësuar.{' '}
            <button onClick={() => setDetail(d => !d)} style={{ background: 'none', border: 'none', color: '#F5C842', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: 0, fontFamily: 'inherit' }}>
              {detail ? 'Fshih detajet ↑' : 'Shfaq detajet ↓'}
            </button>
          </div>
          {detail && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#ccc', lineHeight: 1.7 }}>
              <div style={{ marginBottom: 4 }}>📌 <strong>Thelbësore</strong> — sesioni, autentifikimi, preferencat (gjithmonë aktiv)</div>
              <div style={{ marginBottom: 4 }}>📊 <strong>Analytics</strong> — Vercel Analytics — të dhëna anonime të trafikut</div>
              <div>🔒 Nuk shesim të dhëna. Nuk përdorim cookies të palëve të treta për reklama. <a href="/privatesia" style={{ color: '#F5C842' }}>Politika e Privatësisë</a></div>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={accept}
          style={{ flex: 1, background: '#F5C842', color: '#111', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ✓ Prano të gjitha
        </button>
        <button
          onClick={decline}
          style={{ flex: 1, background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Vetëm thelbësoret
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <a href="/cookies" style={{ color: '#888', fontSize: 10, textDecoration: 'none' }}>Politika e Cookies</a>
        {' · '}
        <a href="/privatesia" style={{ color: '#888', fontSize: 10, textDecoration: 'none' }}>Privatësia</a>
        {' · '}
        <a href="/te-dhenat-mia" style={{ color: '#888', fontSize: 10, textDecoration: 'none' }}>Të dhënat e mia</a>
      </div>
    </div>
  )
}
