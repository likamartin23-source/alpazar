'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { dateShort } from '../../lib/format'

/**
 * BANDEROLA E RIKTHIMIT — §2.3 (neni 20/3, ligji 10128).
 * Kur llogaria është në fshirje me afat 30-ditor, shfaq një banderolë të dukshme
 * KUDO pas kyçjes: afati + butoni "Anulo fshirjen" — rikthimi aq i lehtë sa kërkesa.
 * Një thirrje e vetme `my_deletion_status()` për sesion (vetëm përdorues të kyçur).
 * Fail-soft: çdo gabim → asnjë banderolë (faqja s'preket).
 */
export default function RikthimiFshirjes() {
  const [purgeAt, setPurgeAt] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !alive) return
        const { data, error } = await supabase.rpc('my_deletion_status')
        if (error || !alive) return
        const row = Array.isArray(data) ? data[0] : data
        if (row?.pending && row?.purge_at) setPurgeAt(row.purge_at as string)
      } catch { /* fail-soft */ }
    })()
    return () => { alive = false }
  }, [])

  if (!purgeAt) return null

  const dt = new Date(purgeAt)
  const dataTxt = dateShort(dt) // muaj shqip deterministë (jo Intl/ICU — T-012)

  async function anulo() {
    setBusy(true)
    try {
      const { error } = await supabase.rpc('cancel_account_deletion')
      if (error) { setBusy(false); return }
      setPurgeAt(null)
      window.location.reload()
    } catch { setBusy(false) }
  }

  return (
    <div role="alert" style={{ position: 'sticky', top: 0, zIndex: 60, background: 'var(--az-red-deep)', color: 'var(--az-white)', padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
      <span><span aria-hidden="true">⏳</span> Llogaria jote është në fshirje me afat — fshihet përfundimisht më <b>{dataTxt}</b>.</span>
      <button type="button" onClick={anulo} disabled={busy}
        style={{ background: 'var(--az-white)', color: 'var(--az-red-deep)', border: 'none', borderRadius: 'var(--r-btn)', padding: '7px 14px', fontSize: 13, fontWeight: 800, cursor: busy ? 'default' : 'pointer', minHeight: 40, opacity: busy ? 0.6 : 1, fontFamily: 'inherit' }}>
        {busy ? 'Duke anuluar…' : 'Anulo fshirjen'}
      </button>
    </div>
  )
}
