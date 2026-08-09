'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { ADMIN_BILLING_CSS } from '../billing/shared'

// Burimi i VETEM i kufijve. Platforma (formulari, Albi, baza) lexon pikerisht keto celesa.
const FIELDS = [
  { k: 'free_listings_limit', l: 'Shpallje — llogari falas', h: 'Sa shpallje aktive mund të ketë një përdorues pa pagesë' },
  { k: 'max_images_free', l: 'Foto për shpallje — falas', h: 'Numri maksimal i fotove' },
  { k: 'free_videos_limit', l: 'Video për shpallje — falas', h: 'Numri maksimal i videove' },
  { k: 'max_images_premium', l: 'Foto për shpallje — Premium', h: 'Shkruaj -1 për “pa limit”' },
  { k: 'max_videos_premium', l: 'Video për shpallje — Premium', h: 'Numri maksimal i videove' },
  { k: 'video_max_seconds', l: 'Kohëzgjatja max e videos (sekonda)', h: '300 = 5 minuta. Vlen për të gjithë.' },
]

const show = (v: string) => (String(v) === '-1' ? 'pa limit' : v || '—')

export default function AdminLimits() {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('app_config').select('key,value')
      .in('key', FIELDS.map(f => f.k))
    if (error) { setMsg(`err:${error.message}`); return }
    const m: Record<string, string> = {}
    for (const r of (data || []) as any[]) m[r.key] = r.value ?? ''
    setVals(m); setSaved(m)
  }, [])

  useEffect(() => { load() }, [load])

  async function save(k: string) {
    const v = String(vals[k] ?? '').trim()
    if (v === '' || isNaN(Number(v))) { setMsg('err:Vlera duhet të jetë numër.'); return }
    setBusy(k); setMsg('')
    const { error } = await supabase.from('app_config')
      .upsert({ key: k, value: v, type: 'int' }, { onConflict: 'key' })
    setBusy('')
    if (error) { setMsg(`err:${error.message}`); return }
    setSaved(s => ({ ...s, [k]: v }))
    setMsg('ok:U ruajt. Ndryshimi vlen menjëherë në të gjithë platformën.')
  }

  const [mt, mm] = msg.split(/:(.+)/)
  const g = (k: string) => saved[k] ?? ''

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_BILLING_CSS }} />
      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <h1 className="tt">Kufijtë</h1>
        </div>

        <div className="body">
          {msg && <div className={`msg ${mt}`} role="alert">{mm}</div>}

          <div className="panel">
            <div className="sub-t"><b>Çfarë sheh përdoruesi tani</b></div>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.8 }}>
              <b>Falas:</b> {show(g('free_listings_limit'))} shpallje · {show(g('max_images_free'))} foto · {show(g('free_videos_limit'))} video<br />
              <b>Premium:</b> shpallje pa limit · {show(g('max_images_premium'))} foto · {show(g('max_videos_premium'))} video<br />
              <b>Video:</b> deri në {Math.round(Number(g('video_max_seconds') || 300) / 60)} minuta secila
            </div>
          </div>

          {FIELDS.map(f => (
            <div key={f.k} className="panel">
              <label>{f.l}</label>
              <input
                type="number"
                value={vals[f.k] ?? ''}
                onChange={e => setVals(v => ({ ...v, [f.k]: e.target.value }))}
              />
              <div className="muted" style={{ fontSize: 10.5, marginTop: 4 }}>{f.h}</div>
              {String(vals[f.k] ?? '') !== String(saved[f.k] ?? '') && (
                <button type="button" className="btn primary" style={{ marginTop: 8 }}
                  disabled={busy === f.k} onClick={() => save(f.k)}>
                  {busy === f.k ? 'Duke ruajtur…' : 'Ruaj'}
                </button>
              )}
            </div>
          ))}

          <div className="panel">
            <div className="muted" style={{ fontSize: 11, lineHeight: 1.7 }}>
              Këta janë të vetëmit çelësa që përcaktojnë kufijtë. Lexohen njëkohësisht nga formulari i
              shpalljes, nga Albi dhe nga vetë baza e të dhënave — pra nuk mund të dalin kontradiktorë.
              Përfitimet e Premium janë të njëjta për të gjithë; planet ndryshojnë vetëm në periudhën e faturimit.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
