'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

/* Burimi i VETEM i kufijve. Formulari i shpalljes, Albi dhe vete baza
   lexojne pikerisht keta celesa — prandaj nuk dalin dot kontradiktore. */
const GROUPS: { label: string; rows: { k: string; l: string; d: string }[] }[] = [
  {
    label: 'Llogari pa pagesë',
    rows: [
      { k: 'free_listings_limit', l: 'Shpallje aktive', d: 'Sa shpallje mund të ketë njëherësh' },
      { k: 'max_images_free', l: 'Foto për shpallje', d: 'Numri maksimal i fotove' },
      { k: 'free_videos_limit', l: 'Video për shpallje', d: 'Numri maksimal i videove' },
    ],
  },
  {
    label: 'Premium',
    rows: [
      { k: 'max_images_premium', l: 'Foto për shpallje', d: 'Shkruaj -1 për “pa limit”' },
      { k: 'max_videos_premium', l: 'Video për shpallje', d: 'Numri maksimal i videove' },
    ],
  },
  {
    label: 'Video — vlen për të gjithë',
    rows: [
      { k: 'video_max_seconds', l: 'Kohëzgjatja maksimale (sekonda)', d: '300 = 5 minuta' },
    ],
  },
]

const ALL = GROUPS.flatMap(g => g.rows.map(r => r.k))
const cap = (v: string) => (String(v) === '-1' ? '∞' : v || '—')

export function LimitsTab() {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('app_config').select('key,value').in('key', ALL)
    if (error) { setErr(error.message); return }
    const m: Record<string, string> = {}
    for (const r of (data || []) as any[]) m[r.key] = r.value ?? ''
    setVals(m); setSaved(m)
  }, [])

  useEffect(() => { load() }, [load])

  async function save(k: string) {
    const v = String(vals[k] ?? '').trim()
    if (v === '' || isNaN(Number(v))) { setErr('Vlera duhet të jetë numër.'); return }
    setBusy(k); setErr(''); setOk('')
    const { error } = await supabase.from('app_config')
      .upsert({ key: k, value: v, type: 'int' }, { onConflict: 'key' })
    setBusy('')
    if (error) { setErr(error.message); return }
    setSaved(s => ({ ...s, [k]: v }))
    setOk(k)
    setTimeout(() => setOk(''), 2500)
  }

  const g = (k: string) => saved[k] ?? ''

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🎚️</span> Kufijtë</div>
        <div className="live-dot">Burim i vetëm</div>
      </div>

      <div className="stats">
        <div className="sc"><div className="sn">{cap(g('free_listings_limit'))}</div><div className="sl">Shpallje falas</div></div>
        <div className="sc"><div className="sn">{cap(g('max_images_free'))}</div><div className="sl">Foto falas</div></div>
        <div className="sc"><div className="sn">{cap(g('free_videos_limit'))}</div><div className="sl">Video falas</div></div>
        <div className="sc"><div className="sn">{cap(g('max_videos_premium'))}</div><div className="sl">Video Premium</div></div>
      </div>

      {err && <div className="card" style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#E63312', fontSize: 12 }} role="alert">{err}</div>}

      {GROUPS.map(grp => (
        <div className="card" key={grp.label}>
          <div className="ct">{grp.label}</div>
          {grp.rows.map(r => {
            const dirty = String(vals[r.k] ?? '') !== String(saved[r.k] ?? '')
            return (
              <div className="cfg-row" key={r.k}>
                <div className="cfg-label">
                  {r.l}
                  <div className="cfg-desc">{r.d}</div>
                </div>
                <div style={{ width: 190, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    className="finput"
                    type="number"
                    aria-label={r.l}
                    value={vals[r.k] ?? ''}
                    onChange={e => setVals(v => ({ ...v, [r.k]: e.target.value }))}
                  />
                  {dirty && (
                    <button type="button" className="save-btn" disabled={busy === r.k} onClick={() => save(r.k)}>
                      {busy === r.k ? '…' : 'Ruaj'}
                    </button>
                  )}
                  {ok === r.k && <span className="save-ok">✓</span>}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <div className="card">
        <div className="ct">Si funksionon</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
          Këta çelësa lexohen njëkohësisht nga formulari i shpalljes, nga asistenti Albi dhe nga vetë
          baza e të dhënave. Ndryshimi vlen menjëherë, pa rikompilim.
          <br />
          Të gjithë përdoruesit Premium janë të barabartë — planet ndryshojnë vetëm në periudhën e faturimit.
        </div>
      </div>
    </>
  )
}
