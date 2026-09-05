'use client'

/* NJOFTIME NË PAJISJE (web-push, opt-in) — 5 shtator 2026.
 * Shfaqet VETËM kur: shfletuesi mbështet push + çelësi VAPID është vendosur.
 * Pa çelës VAPID → kthen null (feature-i fshihet krejt, inert). iOS pa "ekran bazë"
 * → udhëzim i vogël (kufi i Apple-it). Aktivizimi kërkon KLIK (gjest përdoruesi).
 * Stili te ui-refine.css (.push-optin) — pa inline hex/radius (roja e sheshtë). */

import { useEffect, useState } from 'react'
import { useAlpazar } from '../../lib/context'
import { pushSupported, pushConfigured, isIOS, isStandalone, pushStatus, subscribePush, unsubscribePush } from '../../lib/push'

export default function PushOptIn() {
  const { user } = useAlpazar()
  const [show, setShow] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [denied, setDenied] = useState(false)
  const [iosHint, setIosHint] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      const configured = await pushConfigured()
      if (!alive || !configured) return
      if (isIOS() && !isStandalone()) { if (alive) { setIosHint(true); setShow(true) } return }
      if (!pushSupported()) return
      try {
        const s = await pushStatus()
        if (!alive) return
        setSubscribed(s.subscribed)
        setDenied(s.permission === 'denied')
        setShow(true)
      } catch { /* ignore */ }
    })()
    return () => { alive = false }
  }, [user])

  if (!user || !show) return null

  async function activate() {
    if (!user) return
    setBusy(true)
    try {
      const r = await subscribePush(user.id)
      if (r.ok) setSubscribed(true)
      else if (r.reason === 'denied') setDenied(true)
    } finally { setBusy(false) }
  }
  async function deactivate() {
    setBusy(true)
    try { await unsubscribePush(); setSubscribed(false) } finally { setBusy(false) }
  }

  if (iosHint) {
    return (
      <div className="push-optin">
        <span className="po-ico" aria-hidden="true">🔔</span>
        <span className="po-txt">
          Për njoftime në telefon: hap menunë <b>Ndaj</b> në Safari dhe zgjidh <b>“Shto në ekran bazë”</b>. Pastaj i aktivizon njoftimet nga aplikacioni.
        </span>
      </div>
    )
  }

  if (denied) {
    return (
      <div className="push-optin">
        <span className="po-ico" aria-hidden="true">🔕</span>
        <span className="po-txt">Njoftimet janë të bllokuara nga shfletuesi. Lejoji te cilësimet e faqes për t’i marrë në pajisje.</span>
      </div>
    )
  }

  return (
    <div className="push-optin">
      <span className="po-ico" aria-hidden="true">{subscribed ? '🔔' : '🔕'}</span>
      <span className="po-txt">
        {subscribed ? 'Njoftimet në pajisje janë aktive.' : 'Merr njoftime në pajisje për oferta e mesazhe të reja.'}
      </span>
      <button
        type="button"
        onClick={subscribed ? deactivate : activate}
        disabled={busy}
        className={`po-btn ${subscribed ? 'on' : ''}`}
      >
        {busy ? '…' : subscribed ? 'Çaktivizo' : 'Aktivizo'}
      </button>
    </div>
  )
}
