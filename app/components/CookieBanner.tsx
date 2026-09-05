'use client'

import { useState, useEffect } from 'react'
import { getConsent, setConsent, CONSENT_EVENT } from '../../lib/consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [detail, setDetail]   = useState(false)

  useEffect(() => {
    if (!getConsent()) setVisible(true)
    // Kur pëlqimi tërhiqet diku tjetër (p.sh. te /cookies), banneri rikthehet.
    const sync = () => setVisible(!getConsent())
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [])

  // Sinjal për FAB-et: kur banneri është i dukshëm, ngrit body[data-cookie]
  useEffect(() => {
    if (visible) {
      document.body.dataset.cookie = '1'
    } else {
      delete document.body.dataset.cookie
    }
    return () => { delete document.body.dataset.cookie }
  }, [visible])

  // Të dy butonat tani kanë PASOJË TË NDRYSHME: `setConsent` njofton Analytics-in
  // dhe Sentry-n përmes eventit, ndaj 'declined' i mban të çmontuar. Më parë të
  // dy shkruanin një varg që s'e lexonte askush.
  function accept()  { setConsent('accepted'); setVisible(false) }
  function decline() { setConsent('declined'); setVisible(false) }

  if (!visible) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .alpz-cookie {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 9999;
        }
        @media (max-width: 767px) {
          .alpz-cookie {
            bottom: 72px;
          }
        }
      ` }} />
    <div
      className="alpz-cookie"
      role="alertdialog"
      aria-modal="true"
      aria-label="Cookies"
      style={{
        background: '#111', color: '#fff',
        padding: '14px 16px 18px',
        boxShadow: '0 -4px 24px rgba(0,0,0,.4)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        maxWidth: 480, margin: '0 auto',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden="true">🍪</span>
        <div>
          <div style={{ fontSize: 'var(--fs-dysheme)', fontWeight: 700, marginBottom: 4 }}>Alpazar përdor cookies</div>
          <div style={{ fontSize: 'var(--fs-dysheme)', color: '#bbb', lineHeight: 1.6 }}>
            Përdorim cookies thelbësore për funksionimin e platformës dhe analytics anonime për ta përmirësuar.{' '}
            <button type="button" aria-expanded={detail} onClick={() => setDetail(d => !d)} style={{ background: 'none', border: 'none', color: 'var(--az-yellow)', cursor: 'pointer', fontSize: 'var(--fs-dysheme)', fontWeight: 700, padding: 0, fontFamily: 'inherit' }}>
              {detail ? 'Fshih detajet ↑' : 'Shfaq detajet ↓'}
            </button>
          </div>
          {detail && (
            <div style={{ marginTop: 10, fontSize: 'var(--fs-dysheme)', color: '#ccc', lineHeight: 1.7 }}>
              <div style={{ marginBottom: 4 }}><span aria-hidden="true">📌</span> <strong>Thelbësore</strong> — sesioni, autentifikimi, preferencat (gjithmonë aktiv)</div>
              <div style={{ marginBottom: 4 }}><span aria-hidden="true">📊</span> <strong>Analytics</strong> — Vercel Analytics (SHBA): të dhëna trafiku. Ngarkohet <strong>vetëm</strong> nëse pranon.</div>
              <div style={{ marginBottom: 4 }}><span aria-hidden="true">🎥</span> <strong>Diagnostikë</strong> — Sentry (BE): regjistrim sesioni me tekst të maskuar. Vetëm nëse pranon.</div>
              <div><span aria-hidden="true">🔒</span> Nuk shesim të dhëna dhe nuk përdorim cookies reklamash. <a href="/privatesia" style={{ color: 'var(--az-yellow)' }}>Politika e Privatësisë</a></div>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={accept}
          style={{ flex: 1, background: 'linear-gradient(135deg,var(--az-yellow-hi),var(--az-yellow))', color: '#111', border: 'none', borderRadius: 12, padding: '11px 0', fontSize: 'var(--fs-dysheme)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <><span aria-hidden="true">✓</span> Prano të gjitha</>
        </button>
        <button
          type="button"
          onClick={decline}
          style={{ flex: 1, background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '11px 0', fontSize: 'var(--fs-dysheme)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Vetëm thelbësoret
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <a href="/cookies" style={{ color: '#888', fontSize: 'var(--fs-dysheme)', textDecoration: 'none' }}>Politika e Cookies</a>
        {' · '}
        <a href="/privatesia" style={{ color: '#888', fontSize: 'var(--fs-dysheme)', textDecoration: 'none' }}>Privatësia</a>
        {' · '}
        <a href="/te-dhenat-mia" style={{ color: '#888', fontSize: 'var(--fs-dysheme)', textDecoration: 'none' }}>Të dhënat e mia</a>
      </div>
    </div>
    </>
  )
}
