'use client'

import { useState, useEffect } from 'react'

const KEY = 'alpazar_age_ok'

export function AgeGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    const ok = localStorage.getItem(KEY)
    setConfirmed(ok === '1')
    setChecked(true)
  }, [])

  if (!checked) return null

  if (!confirmed) return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(17,17,17,0.97)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: 24,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 48 }}>🦅</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#F5C842', letterSpacing: 2 }}>ALPAZAR</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
          Para se të vazhdosh, konfirmo moshën tënde
        </div>
        <div style={{ fontSize: 12, color: '#888', textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
          Kjo platformë lejon vetëm përdorues mbi moshën 16 vjeç sipas kushteve tona të shërbimit dhe kërkesave ligjore.
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={() => { localStorage.setItem(KEY, '1'); setConfirmed(true) }}
            style={{
              background: '#F5C842', color: '#111', border: 'none',
              borderRadius: 12, padding: '14px 32px',
              fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}
          >
            Po, jam 16+ vjeç
          </button>
          <button
            onClick={() => { window.location.href = 'https://www.google.com' }}
            style={{
              background: 'none', color: '#666', border: '1px solid #333',
              borderRadius: 12, padding: '14px 24px',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            Jo, largohem
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#555', textAlign: 'center', maxWidth: 280, marginTop: 4, lineHeight: 1.5 }}>
          Duke klikuar "Po", konfirmon se ke mbushur 16 vjeç dhe pranon{' '}
          <a href="/terms" style={{ color: '#888', textDecoration: 'underline' }}>Kushtet e Shërbimit</a>.
        </div>
      </div>
      {/* Still render children hidden behind overlay */}
      <div style={{ visibility: 'hidden', pointerEvents: 'none' }}>{children}</div>
    </>
  )

  return <>{children}</>
}
