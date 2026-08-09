"use client"

import { useEffect, useRef, useState } from 'react'

const BUILD = process.env.NEXT_PUBLIC_BUILD_ID || 'dev'
const EVERY = 5 * 60 * 1000

/* Sistemi i vetperditsimit:
   1. Kerkon perditesim ne ngarkim, ne fokus, kur faqja rikthehet dhe cdo 5 minuta.
   2. Kur gjendet version i ri -> sugjeron me nje njoftim diskret.
   3. Nese perdoruesi e injoron, kalimi behet NE HESHTJE kur faqja del nga pamja,
      keshtu askush nuk mbetet kurre ne version te vjeter dhe askush nuk nderpritet.
   4. Rrjet sigurie: nese Service Worker mungon, krahason /api/version me build-in aktual. */
export default function UpdatePrompt() {
  const [ready, setReady] = useState(false)
  const regRef = useRef<any>(null)
  const applying = useRef(false)

  function apply() {
    if (applying.current) return
    applying.current = true
    const w = regRef.current?.waiting
    if (w) w.postMessage({ type: 'SKIP_WAITING' })
    else window.location.reload()
  }

  useEffect(() => {
    let stop = false
    let timer: any = null

    async function check() {
      try {
        if ('serviceWorker' in navigator) {
          const reg = regRef.current || await navigator.serviceWorker.getRegistration()
          if (reg) {
            regRef.current = reg
            await reg.update().catch(() => {})
            if (!stop && reg.waiting) { setReady(true); return }
          }
        }
        const res = await fetch('/api/version', { cache: 'no-store' })
        if (!res.ok) return
        const j = await res.json()
        if (!stop && j?.build && BUILD !== 'dev' && j.build !== BUILD) setReady(true)
      } catch { /* offline — provo me vone */ }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
      else if (regRef.current?.waiting) {
        // Kalim i heshtur kur perdoruesi nuk po e shikon faqen
        regRef.current.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    }

    check()
    timer = setInterval(check, EVERY)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stop = true
      if (timer) clearInterval(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!ready) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', left: 12, right: 12, bottom: 84, zIndex: 9997,
        maxWidth: 456, margin: '0 auto',
        background: '#111', color: '#fff', borderRadius: 14,
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 28px rgba(0,0,0,.28)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 18 }}>✨</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#F5C842' }}>Version i ri i ALPAZAR</div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
          Përditësoje për ndryshimet më të fundit.
        </div>
      </div>
      <button
        type="button"
        onClick={apply}
        style={{
          background: '#F5C842', color: '#111', border: 'none', borderRadius: 10,
          padding: '9px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
          fontFamily: 'inherit', flexShrink: 0,
        }}
      >
        Përditëso
      </button>
      <button
        type="button"
        aria-label="Mbyll njoftimin"
        onClick={() => setReady(false)}
        style={{
          background: 'transparent', color: '#666', border: 'none',
          fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 2px', flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}
