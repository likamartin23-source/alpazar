"use client"

import { useEffect, useState } from 'react'

/**
 * UPDATE PROMPT — AUTO-REFRESH I SIGURT, LOOP-FREE (§13, v2).
 *
 * DOKTRINA (nga saga "flicker→old"): app-i NUK duhet të hyjë KURRË në cikël
 * ringarkimi. Versioni i vjetër ringarkonte pakushtëzuar (timer 25s +
 * visibilitychange + BroadcastChannel) dhe, kur sinjalet e build-id binin
 * jokonsistente, prodhonte cikël të dhunshëm — edhe në incognito.
 *
 * ÇFARË BËN TANI (miratuar nga pronari — "auto-refresh i sigurt"):
 * kur skeda është TASHMË e hapur dhe del një deploy i ri, e freskon vetvetiu
 * NJË herë, pa e prekur përdoruesi — POR me garanci matematike kundër ciklit:
 *
 *   ÇELËSI I SIGURISË = build-id i synuar. Para ringarkimit vendosim
 *   sessionStorage['_alpz_autoupd_<liveBuild>']='1'. Pas ringarkimit, bund-i i
 *   ri E KA build-id-in = liveBuild → `mine === b` → asnjë ringarkim tjetër.
 *   Cikël i pamundur: çdo build synohet me ringarkim maksimumi NJË herë; sapo
 *   je te versioni më i ri, ndalon. Edhe nëse /api/health luhatet mes dy build-eve,
 *   secili merr një ringarkim dhe konvergon te më i riu.
 *
 * MOS-NDËRPRERJA: nuk ringarkon nëse përdoruesi po shkruan (input/textarea/select/
 * contentEditable në fokus) ose ka formular të shënuar `data-alpz-dirty="1"`.
 * Në atë rast bie te banderola opt-in (klik për të rifreskuar) — puna s'humbet.
 *
 * PA TIMER/POLL LOOP: kontrolli bëhet vetëm në montim dhe kur skeda rikthehet në
 * dukje (visibilitychange). Themeli (pa SW, no-store, force-dynamic) garanton
 * tashmë freski në çdo navigim; ky komponent mbulon vetëm skedën e hapur.
 *
 * KRAHASIMI I BESUESHËM: `NEXT_PUBLIC_BUILD_ID` futet në KËTË bundle gjatë build-it
 * (= build-i që shërbeu këtë skedë); `/api/health.build` vjen nga i njëjti env i
 * deploy-it aktual. I njëjti burim → pa `Date.now()`, pa fallback jokonsistent.
 * Nëse build-id mungon ('dev'/bosh) → asnjë krahasim, asnjë veprim.
 */
export default function UpdatePrompt() {
  const [live, setLive] = useState<string | null>(null)

  useEffect(() => {
    const mine = process.env.NEXT_PUBLIC_BUILD_ID
    if (!mine || mine === 'dev') return // pa build-id të besueshëm → asgjë

    let cancelled = false

    // A po e përdor përdoruesi skedën tani (mos ndërpri punën e tij)?
    function poPunon(): boolean {
      try {
        const el = document.activeElement as HTMLElement | null
        if (el) {
          const tag = el.tagName
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
          if (el.isContentEditable) return true
        }
        // Formular i shënuar shprehimisht si "i nisur/i pandryshuar-ruajtur".
        if (document.querySelector('[data-alpz-dirty="1"]')) return true
      } catch { /* ignore */ }
      return false
    }

    async function check() {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        const b = j?.build
        if (!b || b === 'dev' || b === mine) return // njësoj → asgjë
        if (cancelled) return

        // ---- AUTO-REFRESH I SIGURT (i çelësuar me build-id → cikël i pamundur) ----
        const key = '_alpz_autoupd_' + b
        let tentuar = false
        try { tentuar = sessionStorage.getItem(key) === '1' } catch { /* ignore */ }

        if (!tentuar && !poPunon()) {
          try { sessionStorage.setItem(key, '1') } catch { /* ignore */ }
          try { location.reload() } catch { /* ignore */ }
          return
        }

        // Përndryshe (u provua tashmë për këtë build, ose përdoruesi po punon)
        // → banderolë opt-in, e mbylllshme, pa ndërprerje.
        try { if (sessionStorage.getItem('_alpz_upd_dismiss') === b) return } catch { /* ignore */ }
        setLive(b)
      } catch { /* rrjeti — provo herën tjetër, pa gjë */ }
    }

    check()
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVis) }
  }, [])

  if (!live) return null

  function dismiss() {
    try { sessionStorage.setItem('_alpz_upd_dismiss', live!) } catch { /* ignore */ }
    setLive(null)
  }

  // Rifreskim "i fortë": pastron çdo cache + çregjistron çdo Service Worker të
  // mbetur (pajisje të ngecura para kill-switch-it), pastaj ringarkon. Fail-soft.
  async function rifreskoFort() {
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
        onClick={rifreskoFort}
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
