'use client'

import { useEffect } from 'react'
import { reportError } from '../lib/monitor'

// Si te `not-found.tsx`: kjo faqe render-ohet BRENDA layout-it rrenje, ndaj
// etiketat rrenje te vetat prishnin hidratimin. Ato i takojne vetem
// `global-error.tsx`, qe zevendeson layout-in kur deshton vete rrenja.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error('[App Error]', error); reportError(error, 'route') }, [error])

  return (
    <div style={{ background: 'var(--az-cream)' }}>
        <div style={{
          minHeight: '58vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16,
        }}>
          <div style={{
            background: '#fff', border: '1.5px solid #f0e0a8', borderRadius: 20,
            padding: '36px 28px', maxWidth: 380, width: '100%', textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,.06)',
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }} aria-hidden="true">⚠️</div>
            <div style={{
              background: '#111', color: 'var(--az-yellow)', fontWeight: 800,
              letterSpacing: 3, fontSize: 18, padding: '6px 16px',
              borderRadius: 8, display: 'inline-block', marginBottom: 16,
            }}>
              ALPAZAR
            </div>
            <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
              Ndodhi një gabim
            </h2>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: '0 0 24px' }}>
              {error?.message
                ? error.message.slice(0, 200)
                : 'Diçka nuk shkoi siç duhet. Provo të rifreskosh faqen.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  background: 'linear-gradient(135deg,var(--az-red),#c42a0e)', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '13px 0', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Provo sërish
              </button>
              <a
                href="/"
                style={{
                  display: 'block', background: 'var(--az-yellow)', color: '#111',
                  border: 'none', borderRadius: 10, padding: '12px 0',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}
              >
                ← Kthehu në faqe kryesore
              </a>
            </div>
            {error?.digest && (
              <p style={{ fontSize: 10, color: '#ccc', marginTop: 16 }}>
                ID: {error.digest}
              </p>
            )}
          </div>
        </div>
    </div>
  )
}
