"use client"

import { useEffect, useRef, useState } from 'react'

/**
 * UPDATE PROMPT — FRESKIM REAL-TIME PA FLICKER (§13, v3 — "zgjidhja definitive").
 *
 * AUTOPSIA (24 gusht 2026, me të dhëna reale Vercel + kod live):
 *   Të gjitha përpjekjet e mëparshme sulmuan boshtin Service-Worker / cache HTTP.
 *   Por u vërtetua empirikisht: (a) app-i NUK regjistron SW (public/sw.js është
 *   kill-switch), (b) HTML shërbehet me `no-store`, (c) navigimi është DOKUMENT
 *   i plotë (`window.location.href` — 0 <Link>/router.push). Pra "përmbajtja e
 *   vjetër" NUK mund të vijë nga cache. I VETMI mekanizëm që mbetej për ta
 *   prodhuar ishte VETË ky komponent: auto-reload-i i HESHTUR në plan të parë.
 *   Me ritmin e shpeshtë të deploy-eve, sapo `/api/health.build` ndryshonte, faqja
 *   RINGARKOHEJ me forcë poshtë përdoruesit; dhe kur ringarkimi kapte dritaren e
 *   ndërtimit (aliasi/asetet duke racuar mes deploy-it të vjetër e të ri), për një
 *   çast shfaqej shell-i i vjetër → pikërisht ndjesia "1s e re → me forcë te e vjetra".
 *   Flicker-i ishte i VETËSHKAKTUAR nga auto-reload-i, jo nga cache-i.
 *
 * DOKTRINA E RE (garancia më e fortë, pa kompromis freskie):
 *   1) NUK ringarkojmë KURRË në plan të parë. Kur përdoruesi po e shikon skedën
 *      dhe del version i ri → shfaqet vetëm banderola opt-in (e mbylllshme). Puna
 *      s'këputet, faqja s'kërcen. → ZERO flicker i dukshëm, matematikisht.
 *   2) Freskimi automatik ndodh vetëm KUR SKEDA ËSHTË E FSHEHUR (`visibilitychange`
 *      → 'hidden'): ringarkojmë skedën në sfond, ku askush s'e sheh. Kur përdoruesi
 *      kthehet, e gjen tashmë të freskët. → real-time, por i padukshëm.
 *   3) ÇELËS SIGURIE = build-id i synuar (sessionStorage `_alpz_autoupd_<build>`):
 *      çdo build synohet me maksimum NJË ringarkim → cikël matematikisht i pamundur.
 *   4) MOS-NDËRPRERJE: nuk ringarkojmë (as në sfond) nëse ka formular të nisur
 *      (`[data-alpz-dirty="1"]`) ose fushë teksti në fokus — ringarkimi do të
 *      humbte të dhëna edhe në sfond. Në atë rast mbetet banderola.
 *
 * ZBULIMI real-time mbetet: kontroll në montim, në rikthim fokusi, dhe poll i butë
 * 30s vetëm kur skeda është e dukshme. Poll-i vetëm ZBULON; ringarkimi është i
 * çelësuar me build-id + i kufizuar te gjendja 'hidden'.
 *
 * KRAHASIMI I BESUESHËM: `NEXT_PUBLIC_BUILD_ID` (i pjekur në KËTË bundle gjatë
 * build-it) vs `/api/health.build` (i njëjti env i deploy-it aktual). I njëjti
 * burim (VERCEL_GIT_COMMIT_SHA) → pa `Date.now()`, pa fallback jokonsistent. Nëse
 * mungon ('dev'/bosh) → asnjë krahasim, asnjë veprim.
 */
export default function UpdatePrompt() {
  const [live, setLive] = useState<string | null>(null)
  // Build i ri i zbuluar ndërsa skeda ishte e dukshme → ringarkohet kur skeda
  // të fshihet (freskim i padukshëm). Mbahet në ref që dëgjuesi i fshehjes ta lexojë.
  const pendingRef = useRef<string | null>(null)

  useEffect(() => {
    const mine = process.env.NEXT_PUBLIC_BUILD_ID
    if (!mine || mine === 'dev') return // pa build-id të besueshëm → asgjë

    let cancelled = false

    // A po e përdor përdoruesi skedën tani (mos i humb punën, as në sfond)?
    function poPunon(): boolean {
      try {
        const el = document.activeElement as HTMLElement | null
        if (el) {
          const tag = el.tagName
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
          if (el.isContentEditable) return true
        }
        if (document.querySelector('[data-alpz-dirty="1"]')) return true
      } catch { /* ignore */ }
      return false
    }

    // Ringarkim i çelësuar me build-id: maksimum një herë për build → pa cikël.
    function ringarkoNjeHere(b: string) {
      const key = '_alpz_autoupd_' + b
      try { if (sessionStorage.getItem(key) === '1') return } catch { /* ignore */ }
      if (poPunon()) return // mos humb punë të panisur, edhe në sfond
      try { sessionStorage.setItem(key, '1') } catch { /* ignore */ }
      try { location.reload() } catch { /* ignore */ }
    }

    async function check() {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        const b = j?.build
        if (!b || b === 'dev' || b === mine) return // njësoj → asgjë
        if (cancelled) return

        pendingRef.current = b // shëno për freskim-në-fshehje

        // NËSE skeda është E FSHEHUR tani → fresko në sfond menjëherë (i padukshëm).
        if (document.visibilityState === 'hidden') {
          ringarkoNjeHere(b)
          return
        }

        // Skeda është E DUKSHME → KURRË mos ringarko në plan të parë. Banderolë opt-in.
        try { if (sessionStorage.getItem('_alpz_upd_dismiss') === b) return } catch { /* ignore */ }
        setLive(b)
      } catch { /* rrjeti — provo herën tjetër */ }
    }

    // FRESKIM I PADUKSHËM: sapo skeda fshihet dhe ka build të ri në pritje → ringarko
    // në sfond. Përdoruesi kur kthehet e gjen të freskët, pa parë asnjë kërcim.
    const onHide = () => {
      if (document.visibilityState === 'hidden' && pendingRef.current) {
        ringarkoNjeHere(pendingRef.current)
      }
    }
    document.addEventListener('visibilitychange', onHide)

    // Zbulim: montim + rikthim fokusi.
    check()
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)

    // Poll i butë 30s vetëm kur skeda është e dukshme (zbulon deploy-in e ri për
    // një skedë idle). Vetëm ZBULON; ringarkimi mbetet i çelësuar + vetëm-në-fshehje.
    const POLL_MS = 30000
    let iv: ReturnType<typeof setInterval> | null = null
    const startPoll = () => { if (iv == null) iv = setInterval(check, POLL_MS) }
    const stopPoll = () => { if (iv != null) { clearInterval(iv); iv = null } }
    const onVisPoll = () => { if (document.visibilityState === 'visible') startPoll(); else stopPoll() }
    document.addEventListener('visibilitychange', onVisPoll)
    if (document.visibilityState === 'visible') startPoll()

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onHide)
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

  // Rifreskim "i fortë": pastron çdo cache + çregjistron çdo Service Worker të
  // mbetur (pajisje të ngecura para kill-switch-it), pastaj ringarkon. Fail-soft.
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
