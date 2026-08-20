"use client"

import { useEffect, useRef, useState } from 'react'

const BUILD = process.env.NEXT_PUBLIC_BUILD_ID || 'dev'
const EVERY = 5 * 60 * 1000

/* Shënues i njëhershëm. Ndryshoje VETËM nëse duhet një shkrirje e re e
   detyruar për të gjithë shfletuesit.
   -2 (harmonizimi live): shfletuesit që kishin ngecur në një service worker /
   cache të vjetër para merge-it në prodhim çregjistrohen e pastrohen një herë,
   që të marrin menjëherë ndërfaqen e re (kartat e njësuara, "Afër meje", etj.). */
const RESET = 'alpazar-sw-reset-2'

/**
 * DALJA E EMERGJENCËS — pse ekziston
 *
 * Service worker-i i vjetër nuk thërriste kurrë `skipWaiting()`. Versioni i ri
 * instalohej dhe rrinte **në pritje** derisa të mbylleshin të gjitha skedat e
 * faqes. Kush e mban panelin hapur nuk i mbyll kurrë — pra mbetej pa fund në
 * versionin e vjetër, dhe një rifreskim i thjeshtë nuk e zgjidhte.
 *
 * Kurthi: rregullimi i atij problemi dërgohet pikërisht nga service worker-i
 * që nuk përditësohet. Pra nuk mbërrinte dot kurrë vetë.
 *
 * Prandaj kjo shkrirje ekzekutohet NË FAQE, jo në service worker: çregjistron
 * çdo service worker, fshin çdo cache, dhe rifreskon një herë. Kryhet një herë
 * për shfletues — shënuesi vendoset PARA rifreskimit, ndaj nuk hyn në cikël.
 *
 * Pas kësaj, cikli normal merr përsëri, tashmë me një service worker që kalon
 * menjëherë në versionin e ri.
 */
async function shkrirjeNjehere(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false
    if (window.localStorage.getItem(RESET) === '1') return false

    // Shënuesi PARA veprimit — që një dështim në mes të mos e përsërisë pafund.
    window.localStorage.setItem(RESET, '1')

    let dicka = false
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const r of regs) { await r.unregister().catch(() => {}); dicka = true }
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      for (const k of keys) { await caches.delete(k).catch(() => {}); dicka = true }
    }

    if (dicka) { window.location.reload(); return true }
  } catch { /* nese deshton, vazhdo normalisht */ }
  return false
}

/* Sistemi i vetëpërditësimit:
   1. Kërkon përditësim në ngarkim, në fokus, kur faqja rikthehet dhe çdo 5 minuta.
   2. Kur gjendet version i ri -> e sugjeron me një njoftim diskret.
   3. Nëse përdoruesi e injoron, kalimi bëhet në heshtje kur faqja del nga pamja.
   4. Rrjet sigurie: nëse Service Worker mungon, krahason /api/version me build-in. */
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
            // Nese nje version i ri pret, kaloje menjehere — mos e le perdoruesin prapa.
            if (!stop && reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' })
              setReady(true)
              return
            }
          }
        }
        const res = await fetch('/api/version', { cache: 'no-store' })
        if (!res.ok) return
        const j = await res.json()
        if (!stop && j?.build && BUILD !== 'dev' && j.build !== BUILD) setReady(true)
      } catch { /* offline — provo më vonë */ }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
      else if (regRef.current?.waiting) {
        regRef.current.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    }

    // Shkrirja vjen e para: nëse rifreskon, asgjë tjetër nuk ka nevojë të nisë.
    shkrirjeNjehere().then(uRifreskua => {
      if (uRifreskua || stop) return
      check()
      timer = setInterval(check, EVERY)
      window.addEventListener('focus', check)
      document.addEventListener('visibilitychange', onVisible)
    })

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
