"use client"

import { useEffect, useState } from 'react'

/**
 * UPDATE PROMPT — DETEKTIM + VETË-RINGARKIM KUR SKEDA ËSHTË E LIRË, banderolë vetëm kur shkruhet (§13, v5).
 *
 * ⚠ KUJDES LEXUESIT: ky koment përshkruan kodin e MËPOSHTËM. Mos e beso një koment pa
 *   e lexuar trupin (klasa F4 e taksonomisë — "pretendimi rri te komenti"; komenti i v4
 *   mbeti "zero ringarkim" ndërsa kodi tashmë ringarkonte, dhe një auditim ra pikërisht aty).
 *
 * HISTORIKU: v3 ("ringarko vetëm kur skeda është e fshehur") dhe v4 ("zero vetë-ringarkim,
 *   vetëm banderolë opt-in") NUK e zgjidhën "vazhdon kthimi te e vjetra". Me v4, meqë Code
 *   deploy-on shpesh, banderola dilte por pronari rrinte në bundle të vjetruar derisa e
 *   klikonte — praktikisht gjithmonë i vjetër (shkaku gjithëditor, konfirmuar nga [O38]/[O42]).
 *
 * DOKTRINA AKTUALE (v5, commit 00338fc): app-i ringarkon VETË kur kjo është e sigurt.
 *   - Build i ri zbuluar DHE skedë PA shkrim aktiv (asnjë input/textarea/contenteditable në
 *     fokus) → `location.reload()` menjëherë. Kështu skedat e lëna hapur nuk mbeten të vjetra.
 *   - Build i ri zbuluar NDËRSA përdoruesi po shkruan → VETËM banderolë opt-in (mos ndërpre
 *     një formë në mes); ringarkimi bëhet me klik ("Rifresko" → `rifreskoTani`, pastron cache
 *     + çregjistron çdo SW të ngecur).
 *   - Me `no-store` në HTML + asete hashed, freskia s'humbet as në navigimin e radhës.
 *
 * ZBULIMI real-time: në montim, në rikthim fokusi (visibilitychange→visible, ku ringarkon
 *   direkt sepse skeda sapo u aktivizua), dhe poll i butë 30s kur skeda është e dukshme.
 *
 * KRAHASIMI: `NEXT_PUBLIC_BUILD_ID` (i pjekur në këtë bundle) vs `/api/health.build`
 * (env i deploy-it aktual) — i njëjti burim (VERCEL_GIT_COMMIT_SHA). Nëse mungon
 * ('dev'/bosh) → asnjë krahasim, asnjë banderolë.
 */
export default function UpdatePrompt() {
  const [live, setLive] = useState<string | null>(null)

  useEffect(() => {
    const mine = process.env.NEXT_PUBLIC_BUILD_ID
    if (!mine || mine === 'dev') return // pa build-id të besueshëm → asgjë

    let cancelled = false

    async function check() {
      try {
        // /api/version (edge, i lehtë) në vend të /api/health (nodejs + ping DB + ping realtime):
        // poll-i çdo 30s për çdo klient s'duhet të godasë DB-në/realtime-in. I njëjti NEXT_PUBLIC_BUILD_ID.
        const r = await fetch('/api/version', { cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        const b = j?.build
        if (!b || b === 'dev' || b === mine) return // njësoj → asgjë
        if (cancelled) return
        // U zbulua build i ri. Skedë PA shkrim aktiv (asnjë input/textarea/contenteditable në fokus)
        // → RINGARKO VETË: shkaku gjithëditor ishte pikërisht skeda e vjetër që mbetej derisa klikohej
        // banderola, ndaj pronari rrinte gjithnjë në bundle të vjetruar. Fushë aktive → banderolë,
        // që të mos ndërpritet një formë në mes.
        const ae = document.activeElement as HTMLElement | null
        const typing = !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)
        if (!typing) { location.reload(); return }
        try { if (sessionStorage.getItem('_alpz_upd_dismiss') === b) return } catch { /* ignore */ }
        setLive(b)
      } catch { /* rrjeti — provo herën tjetër */ }
    }

    // Në MONTIM: vetëm zbulim → banderolë (mos ringarko; përdoruesi mund të jetë duke shkruar).
    check()
    // RIKTHIM te skeda (hidden→visible): pikë e SIGURT hyrjeje — nëse ekziston build i ri, RINGARKO
    // automatikisht. Kjo zgjidh "disa gjëra reflektohen, disa jo" (C): skedat e lëna hapur mbanin
    // bundle-in e vjetër derisa përdoruesi klikonte "Rifresko". Skeda AKTIVE (kurrë e fshehur) mban
    // banderolën, që të mos ndërpritet një formë në mes.
    const onVis = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const r = await fetch('/api/version', { cache: 'no-store' })
        if (!r.ok) return
        const b = (await r.json())?.build
        if (b && b !== 'dev' && b !== mine) { location.reload(); return }
      } catch { /* rrjeti — provo herën tjetër */ }
    }
    document.addEventListener('visibilitychange', onVis)

    // Poll i butë 30s vetëm kur skeda është e dukshme (ndalon kur fshihet). Vetëm ZBULON.
    const POLL_MS = 30000
    let iv: ReturnType<typeof setInterval> | null = null
    const startPoll = () => { if (iv == null) iv = setInterval(check, POLL_MS) }
    const stopPoll = () => { if (iv != null) { clearInterval(iv); iv = null } }
    const onVisPoll = () => { if (document.visibilityState === 'visible') startPoll(); else stopPoll() }
    document.addEventListener('visibilitychange', onVisPoll)
    if (document.visibilityState === 'visible') startPoll()

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      document.removeEventListener('visibilitychange', onVisPoll)
      stopPoll()
    }
  }, [])

  if (!live) return null

  function dismiss() {
    try { sessionStorage.setItem('_alpz_upd_dismiss', live!) } catch { /* ignore */ }
    setLive(null)
  }

  // Rifreskim "i fortë" — VETËM me klik të përdoruesit. Pastron çdo cache + çregjistron
  // çdo Service Worker të mbetur (pajisje të ngecura para kill-switch-it), pastaj reload.
  async function rifreskoTani() {
    try {
      if ('serviceWorker' in navigator) {
        const rs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(rs.map(r => r.unregister().catch(() => {})))
      }
    } catch { /* ignore */ }
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys()
        await Promise.all(keys.map(k => caches.delete(k).catch(() => false)))
      }
    } catch { /* ignore */ }
    // Reload i thjeshtë pas çregjistrimit — RUAN sesionin (pa Clear-Site-Data → pa dalje nga llogaria).
    // Për pajisje kokëforta (rrallë, iOS PWA) mbetet rruga manuale /rifresko (reset i plotë me vullnet).
    try { location.reload() } catch { /* ignore */ }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 9999,
        maxWidth: 460, margin: '0 auto',
        background: 'linear-gradient(135deg,#1a1a1a,#000)', color: '#fff',
        borderRadius: 14, padding: '12px 14px', boxShadow: '0 8px 28px -6px rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: 18 }} aria-hidden="true">✨</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
        Ka dalë një version i ri i Alpazar.
      </span>
      <button
        type="button"
        onClick={rifreskoTani}
        style={{ background: '#F5C842', color: '#111', border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minHeight: 40 }}
      >
        Rifresko
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Mbyll njoftimin"
        style={{ background: 'transparent', color: 'rgba(255,255,255,.6)', border: 'none', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1, padding: 4, minHeight: 40, minWidth: 32 }}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  )
}
