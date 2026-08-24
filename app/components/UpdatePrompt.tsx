"use client"

import { useEffect, useState } from 'react'

/**
 * UPDATE PROMPT — SELF-HEAL STRIKT OPT-IN (§13). ZERO RINGARKIM AUTOMATIK.
 *
 * DOKTRINA (e ngrirë, nga saga e "flicker→old"): app-i NUK ringarkohet KURRË
 * vetvetiu. Versioni i vjetër i këtij komponenti ringarkonte faqen me forcë në
 * mospërputhje build-id (timer 25s, visibilitychange, BroadcastChannel) dhe, kur
 * sinjalet e build-id binin jokonsistente, prodhonte cikël ringarkimi të dhunshëm
 * — edhe në incognito. Prandaj: **asnjë `location.reload()` automatik.**
 *
 * ÇFARË BËN TANI (self-heal i sigurt): freskia tashmë garantohet nga serveri
 * (`force-dynamic` + `no-store` + pa SW). Ky komponent shton VETËM një rrjet
 * sigurie: nëse skeda po ekzekuton një bundle më të vjetër se deploy-i aktual,
 * i shfaq përdoruesit një banderolë të vogël, të mbylllshme, dhe RIFRESKON VETËM
 * kur përdoruesi klikon. Kurrë vetvetiu.
 *
 * KRAHASIMI I BESUESHËM: `NEXT_PUBLIC_BUILD_ID` futet në KËTË bundle gjatë build-it
 * (= build-i që shërbeu këtë skedë); `/api/health.build` vjen nga i njëjti env i
 * deploy-it aktual. Të njëjtin burim → pa `Date.now()`, pa fallback jokonsistent.
 * Nëse build-id mungon ('dev'/bosh) → asnjë krahasim, asnjë banderolë.
 *
 * PA TIMER/POLL LOOP: kontrolli bëhet vetëm në montim dhe kur skeda rikthehet në
 * dukje (visibilitychange) — të dyja vetëm SHFAQIN banderolën, s'ringarkojnë.
 * sessionStorage siguron që për të njëjtin version të mos bezdisë dy herë.
 */
export default function UpdatePrompt() {
  const [live, setLive] = useState<string | null>(null)

  useEffect(() => {
    const mine = process.env.NEXT_PUBLIC_BUILD_ID
    if (!mine || mine === 'dev') return // pa build-id të besueshëm → asgjë

    let cancelled = false
    async function check() {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        const b = j?.build
        if (!b || b === 'dev' || b === mine) return // njësoj → pa njoftim
        try { if (sessionStorage.getItem('_alpz_upd_dismiss') === b) return } catch { /* ignore */ }
        if (!cancelled) setLive(b)
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
        onClick={() => { try { location.reload() } catch { /* ignore */ } }}
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
