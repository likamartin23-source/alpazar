'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { reportError } from '../lib/monitor'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // GARANCIA: raporto në TË DYJA sistemet (urdhër pronari) — Sentry (i jashtëm)
    // DHE health_events → paneli i adminit (real-time). Rrëzimet rrënjë s'shkonin
    // te paneli më parë.
    Sentry.captureException(error)
    reportError(error, 'boundary')
  }, [error])

  return (
    <html lang="sq">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', fontFamily: 'sans-serif', padding: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--az-ink)' }}>Diçka shkoi gabim!</h2>
          <p style={{ color: '#666', maxWidth: '400px' }}>Gabimi u raportua automatikisht. Provo sërish ose rifresko faqen.</p>
          <button
            type="button"
            onClick={reset}
            style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '16px', cursor: 'pointer', fontWeight: 600 }}
          >
            Provo sërish
          </button>
        </div>
      </body>
    </html>
  )
}
