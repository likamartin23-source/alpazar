'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

type F = { k: string; l: string; d: string; t: 'int' | 'bool' | 'text' }

const GROUPS: { label: string; note?: string; rows: F[] }[] = [
  {
    label: 'Llogari pa pagesë',
    rows: [
      { k: 'free_listings_limit', l: 'Shpallje aktive', d: 'Sa shpallje mund të ketë njëherësh', t: 'int' },
      { k: 'max_images_free', l: 'Foto për shpallje', d: 'Numri maksimal i fotove', t: 'int' },
      { k: 'free_videos_limit', l: 'Video për shpallje', d: 'Numri maksimal i videove', t: 'int' },
    ],
  },
  {
    label: 'Premium',
    rows: [
      { k: 'max_images_premium', l: 'Foto për shpallje', d: 'Shkruaj -1 për “pa limit”', t: 'int' },
      { k: 'max_videos_premium', l: 'Video për shpallje', d: 'Numri maksimal i videove', t: 'int' },
    ],
  },
  {
    label: 'Video — vlen për të gjithë',
    rows: [
      { k: 'video_max_seconds', l: 'Kohëzgjatja maksimale (sekonda)', d: '300 = 5 minuta', t: 'int' },
    ],
  },
  {
    label: 'Mbrojtje dhe abuzim',
    note: 'Zbatohen në vetë bazën e të dhënave — askush nuk i anashkalon dot nga klienti.',
    rows: [
      { k: 'max_listings_per_day', l: 'Shpallje në 24 orë', d: '0 = pa limit. Ndal shpërthimet e spam-it.', t: 'int' },
      { k: 'min_listing_price', l: 'Çmimi minimal i lejuar', d: '0 = lejo “me marrëveshje”', t: 'int' },
    ],
  },
  {
    label: 'Profili i biznesit',
    note: 'Kur Premium-i bie, profili errësohet vetvetiu dhe zhduket nga publiku.',
    rows: [
      { k: 'business_requires_premium', l: 'Kërkon Premium aktiv', d: 'Fike vetëm nëse do që bizneset të mbeten publike pa pagesë', t: 'bool' },
    ],
  },
  {
    label: 'Abonime dhe fatura',
    rows: [
      { k: 'invoice_autosend', l: 'Dërgo faturën automatikisht', d: 'Kur aprovon pagesën, fatura shkon vetë në inbox', t: 'bool' },
      { k: 'subscription_grace_days', l: 'Ditë tolerance pas skadimit', d: 'Sa ditë i mban përfitimet pas mbarimit', t: 'int' },
    ],
  },
  {
    label: 'Njoftim për të gjithë përdoruesit',
    note: 'Shfaqet në krye të çdo faqeje, menjëherë, pa rifreskim.',
    rows: [
      { k: 'announcement_active', l: 'Aktiv', d: 'Ndiz ose fik njoftimin', t: 'bool' },
      { k: 'announcement_text', l: 'Teksti', d: 'Çfarë lexojnë përdoruesit', t: 'text' },
      { k: 'announcement_level', l: 'Ngjyra', d: 'info · sukses · kujdes', t: 'text' },
    ],
  },
]

const ALL = GROUPS.flatMap(g => g.rows)
const cap = (v: string) => (String(v) === '-1' ? '∞' : v || '—')

export function LimitsTab() {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('app_config').select('key,value')
      .in('key', ALL.map(f => f.k))
    if (error) { setErr(error.message); return }
    const m: Record<string, string> = {}
    for (const r of (data || []) as any[]) m[r.key] = r.value ?? ''
    setVals(m); setSaved(m)
  }, [])

  useEffect(() => { load() }, [load])

  async function save(f: F, forced?: string) {
    const v = String(forced ?? vals[f.k] ?? '').trim()
    if (f.t === 'int' && (v === '' || isNaN(Number(v)))) { setErr('Vlera duhet të jetë numër.'); return }
    setBusy(f.k); setErr(''); setOk('')
    const { error } = await supabase.from('app_config')
      .upsert({ key: f.k, value: v, type: f.t }, { onConflict: 'key' })
    setBusy('')
    if (error) { setErr(error.message); return }
    setSaved(s => ({ ...s, [f.k]: v }))
    setVals(s => ({ ...s, [f.k]: v }))
    setOk(f.k); setTimeout(() => setOk(''), 2500)
  }

  const g = (k: string) => saved[k] ?? ''

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🎚️</span> Kufijtë dhe rregullat</div>
        <div className="live-dot">Burim i vetëm</div>
      </div>

      <div className="stats">
        <div className="sc"><div className="sn">{cap(g('free_listings_limit'))}</div><div className="sl">Shpallje falas</div></div>
        <div className="sc"><div className="sn">{cap(g('max_images_free'))}</div><div className="sl">Foto falas</div></div>
        <div className="sc"><div className="sn">{cap(g('free_videos_limit'))}</div><div className="sl">Video falas</div></div>
        <div className="sc"><div className="sn">{cap(g('max_videos_premium'))}</div><div className="sl">Video Premium</div></div>
      </div>

      {err && <div className="card" role="alert" style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#E63312', fontSize: 12 }}>{err}</div>}

      {GROUPS.map(grp => (
        <div className="card" key={grp.label}>
          <div className="ct">{grp.label}</div>
          {grp.note && <div style={{ fontSize: 10.5, color: '#999', marginBottom: 10 }}>{grp.note}</div>}
          {grp.rows.map(f => {
            const cur = vals[f.k] ?? ''
            const dirty = String(cur) !== String(saved[f.k] ?? '')
            const on = String(saved[f.k]) === 'true'
            return (
              <div className="cfg-row" key={f.k}>
                <div className="cfg-label">
                  {f.l}
                  <div className="cfg-desc">{f.d}</div>
                </div>
                {f.t === 'bool' ? (
                  <button type="button" aria-pressed={on} disabled={busy === f.k}
                    className={`tgl ${on ? 'tgl-on' : 'tgl-off'}`}
                    aria-label={f.l}
                    onClick={() => save(f, on ? 'false' : 'true')}>
                    <span className="tdot" />
                  </button>
                ) : (
                  <div style={{ width: 230, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className="finput" type={f.t === 'int' ? 'number' : 'text'} aria-label={f.l}
                      value={cur} onChange={e => setVals(v => ({ ...v, [f.k]: e.target.value }))} />
                    {dirty && (
                      <button type="button" className="save-btn" disabled={busy === f.k} onClick={() => save(f)}>
                        {busy === f.k ? '…' : 'Ruaj'}
                      </button>
                    )}
                    {ok === f.k && <span className="save-ok">✓</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      <div className="card">
        <div className="ct">Si funksionon</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
          Këta çelësa lexohen njëkohësisht nga formulari i shpalljes, nga faqja e redaktimit,
          nga asistenti Albi dhe nga vetë baza e të dhënave. Ndryshimi vlen menjëherë.
          <br />
          Asnjë çelës këtu nuk është dekorativ — secili ka një lexues real.
        </div>
      </div>
    </>
  )
}
