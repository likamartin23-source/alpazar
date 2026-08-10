'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { exportCsv } from './exportCsv'

const F = [
  ['all', 'Të gjitha'], ['visible', 'Të dukshme'], ['dimmed', 'Të errësuara'],
  ['verified', 'Të verifikuara'], ['unverified', 'Pa verifikim'], ['pending', 'Presin verifikim'],
] as const

const d = (x: any) => (x ? new Date(x).toLocaleDateString('sq-AL') : '')

export function BusinessesTab() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [f, setF] = useState<string>('all')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [del, setDel] = useState('')
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_businesses',
      { p_q: q.trim(), p_filter: f, p_limit: 300 })
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setRows((data as any)?.businesses || []); setErr('')
  }, [q, f])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = supabase.channel('adm-biz')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  async function call(fn: string, args: any, id: string, note?: string) {
    setBusy(id); setErr(''); setOk('')
    const { data, error } = await supabase.rpc(fn, args)
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setDel(''); setReason('')
    if (note) { setOk(note); setTimeout(() => setOk(''), 3000) }
    load()
  }

  const st = {
    total: rows.length,
    visible: rows.filter(r => r.is_visible).length,
    dimmed: rows.filter(r => !r.is_visible).length,
    verified: rows.filter(r => r.is_verified).length,
  }

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🏢</span> Bizneset</div>
        {ok ? <div className="live-dot">{ok}</div> : <div className="live-dot">Live</div>}
      </div>

      <div className="stats">
        <div className="sc"><div className="sn">{st.total}</div><div className="sl">Gjithsej</div></div>
        <div className="sc"><div className="sn">{st.visible}</div><div className="sl">Të dukshme</div></div>
        <div className="sc"><div className="sn">{st.dimmed}</div><div className="sl">Të errësuara</div></div>
        <div className="sc"><div className="sn">{st.verified}</div><div className="sl">Të verifikuara</div></div>
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#E63312', fontSize: 12 }}>{err}</div>
      )}

      <div className="card">
        <div className="ct">
          Kërko dhe filtro
          <input className="finput" style={{ width: 240 }} value={q}
            placeholder="Emër, qytet, NIPT ose pronar…" aria-label="Kërko biznese"
            onChange={e => setQ(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {F.map(([k, l]) => (
            <button type="button" key={k} className="btn" aria-pressed={f === k}
              style={{ background: f === k ? '#111' : '#f0f0f0', color: f === k ? '#fff' : '#555' }}
              onClick={() => setF(k)}>{l}</button>
          ))}
          <button type="button" className="edit-btn" style={{ marginLeft: 'auto' }}
            disabled={rows.length === 0}
            onClick={() => exportCsv('bizneset', rows.map(r => ({
              emri: r.name, qyteti: r.city || '', nipt: r.nipt || '',
              pronari: r.owner?.name || '', premium: r.owner?.is_premium ? 'po' : 'jo',
              i_dukshem: r.is_visible ? 'po' : 'jo', arsyeja: r.dim_reason || '',
              verifikuar: r.is_verified ? 'po' : 'jo', shpallje: r.listings,
              ndjekes: r.followers || 0, krijuar: r.created_at,
            })))}>Eksporto CSV</button>
        </div>
      </div>

      <div className="card">
        <div className="ct">Lista</div>
        <table>
          <thead>
            <tr>
              <th>Biznesi</th><th>Pronari</th><th>Dukshmëria</th><th>Verifikimi</th>
              <th style={{ width: 250 }}>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(b => (
              <tr key={b.id} style={!b.is_visible ? { background: '#FAFAFA', opacity: .85 } : undefined}>
                <td>
                  <strong style={{ fontSize: 11.5 }}>{b.name}</strong>
                  <div style={{ color: '#999', fontSize: 10 }}>
                    {b.city || '—'}{b.nipt ? ` · NIPT ${b.nipt}` : ''} · {b.listings} shpallje
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 11 }}>{b.owner?.name || '—'}</div>
                  {b.owner?.is_premium
                    ? <span className="badge ba">Premium</span>
                    : <span className="badge bd">Pa Premium</span>}
                  {b.owner?.is_suspended && <> <span className="badge bd">Pezulluar</span></>}
                </td>
                <td>
                  {b.is_visible
                    ? <span className="badge ba">I dukshëm</span>
                    : <>
                        <span className="badge bd">I errësuar</span>
                        <div style={{ color: '#999', fontSize: 9.5, marginTop: 2 }}>{b.dim_reason}</div>
                      </>}
                </td>
                <td>
                  {b.is_verified
                    ? <><span className="badge ba">✓ Verifikuar</span>
                        <div style={{ color: '#aaa', fontSize: 9.5 }}>{d(b.verified_at)}</div></>
                    : b.verification?.status === 'pending'
                      ? <span className="badge bp">Pret shqyrtim</span>
                      : <span style={{ color: '#bbb' }}>—</span>}
                </td>
                <td>
                  <button type="button" className="edit-btn" disabled={busy === b.id}
                    onClick={() => call('admin_set_business_flag',
                      { p_business_id: b.id, p_flag: 'is_verified', p_value: !b.is_verified, p_reason: null },
                      b.id, b.is_verified ? 'Verifikimi u hoq' : 'Biznesi u verifikua')}>
                    {b.is_verified ? 'Hiq ✓' : 'Verifiko'}
                  </button>{' '}
                  <button type="button" className="edit-btn" disabled={busy === b.id}
                    onClick={() => call('admin_set_business_flag',
                      { p_business_id: b.id, p_flag: 'is_active', p_value: !b.is_active, p_reason: null },
                      b.id, b.is_active ? 'Biznesi u errësua' : 'Biznesi u riaktivizua')}>
                    {b.is_active ? 'Errëso' : 'Riaktivizo'}
                  </button>

                  <div style={{ marginTop: 6 }}>
                    {del === b.id ? (
                      <div style={{ display: 'grid', gap: 6 }}>
                        <input className="finput" value={reason} placeholder="Arsyeja (i shkon pronarit)"
                          aria-label="Arsyeja" onChange={e => setReason(e.target.value)} />
                        <div>
                          <button type="button" className="btn btn-red" disabled={busy === b.id}
                            onClick={() => call('admin_delete_business',
                              { p_business_id: b.id, p_reason: reason || null }, b.id, 'Biznesi u fshi')}>
                            Po, fshi përfundimisht
                          </button>
                          <button type="button" className="edit-btn" onClick={() => { setDel(''); setReason('') }}>Jo</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" className="edit-btn" style={{ color: '#E63312' }}
                        onClick={() => setDel(b.id)}>Fshi biznesin</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 22 }}>Asnjë biznes.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="ct">Si funksionon errësimi</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
          Dukshmëria e një biznesi <strong>rrjedh nga e drejta e pronarit</strong> — nuk ruhet me dorë.
          Kur Premium-i skadon ose anulohet, profili errësohet vetvetiu dhe zhduket nga publiku;
          kur pagesa rikthehet, ndriçohet menjëherë. Pronari vazhdon ta shohë profilin e vet.
          <br />
          Errësimi manual nga administrata vlen edhe kur pronari paguan.
          Fshirja nuk i prek shpalljet — ato thjesht shkëputen nga biznesi.
        </div>
      </div>
    </>
  )
}
