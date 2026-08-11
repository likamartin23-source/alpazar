'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { UserRow } from './UserRow'
import { exportCsv } from './exportCsv'

const F = [
  ['all', 'Të gjithë'], ['premium', 'Premium'], ['boost', 'VIP Boost'],
  ['verified', 'Verifikuar'], ['suspended', 'Pezulluar'], ['admins', 'Admin'],
] as const

export function UsersTab() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [f, setF] = useState<string>('all')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState('')
  const [plans, setPlans] = useState<any[]>([])
  const [pick, setPick] = useState<Record<string, string>>({})
  const [sel, setSel] = useState<string[]>([])

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_users',
      { p_q: q.trim(), p_filter: f, p_limit: 300 })
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setRows((data as any)?.users || []); setErr('')
  }, [q, f])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase.from('premium_plans').select('id,name,tier').eq('is_active', true)
      .order('tier', { ascending: false }).order('sort_order')
      .then(({ data }) => setPlans(data || []), () => {})
  }, [])

  useEffect(() => {
    const ch = supabase.channel('adm-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const call = useCallback(async (fn: string, args: any, id: string) => {
    setBusy(id); setErr('')
    const { data, error } = await supabase.rpc(fn, args)
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setConfirmDel('')
    load()
  }, [load])

  const toggle = (id: string) =>
    setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const toggleAll = () =>
    setSel(s => s.length === rows.length ? [] : rows.map(r => r.id))

  async function bulk(flag: string, value: boolean) {
    if (sel.length === 0) return
    setBusy('bulk'); setErr('')
    const { data, error } = await supabase.rpc('admin_bulk_user_flag',
      { p_user_ids: sel, p_flag: flag, p_value: value })
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setSel([]); load()
  }

  function eksporto() {
    exportCsv('perdoruesit', rows.map(r => ({
      emri: r.full_name || '', username: r.username || '',
      premium: r.is_premium ? 'po' : 'jo', vip: r.has_boost ? 'po' : 'jo',
      verifikuar: r.is_verified ? 'po' : 'jo', pezulluar: r.is_suspended ? 'po' : 'jo',
      admin: r.is_admin ? 'po' : 'jo', shpallje: r.listings,
      pike: r.points, besueshmeria: r.trust_score,
      premium_deri: r.premium_expires_at || '', regjistruar: r.created_at,
    })))
  }

  const st = {
    total: rows.length,
    prem: rows.filter(r => r.is_premium).length,
    vip: rows.filter(r => r.has_boost).length,
    susp: rows.filter(r => r.is_suspended).length,
  }

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">👥</span> Përdoruesit</div>
        <div className="live-dot">Live</div>
      </div>

      <div className="stats">
        <div className="sc"><div className="sn">{st.total}</div><div className="sl">Të shfaqur</div></div>
        <div className="sc"><div className="sn">{st.prem}</div><div className="sl">Premium</div></div>
        <div className="sc"><div className="sn">{st.vip}</div><div className="sl">VIP Boost</div></div>
        <div className="sc"><div className="sn">{st.susp}</div><div className="sl">Pezulluar</div></div>
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#C42B0F', fontSize: 12 }}>{err}</div>
      )}

      <div className="card">
        <div className="ct">
          Kërko dhe filtro
          <input className="finput" style={{ width: 240 }} value={q} placeholder="Emër ose username…"
            aria-label="Kërko përdorues" onChange={e => setQ(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {F.map(([k, l]) => (
            <button type="button" key={k} className="btn" aria-pressed={f === k}
              style={{ background: f === k ? '#111' : '#f0f0f0', color: f === k ? '#fff' : '#555' }}
              onClick={() => setF(k)}>{l}</button>
          ))}
          <button type="button" className="edit-btn" style={{ marginLeft: 'auto' }}
            disabled={rows.length === 0} onClick={eksporto}>Eksporto CSV</button>
        </div>
      </div>

      {sel.length > 0 && (
        <div className="card" style={{ borderColor: '#F5C842', background: '#FFFDF3' }}>
          <div className="ct">
            {sel.length} të zgjedhur
            <button type="button" className="edit-btn" onClick={() => setSel([])}>Hiq zgjedhjen</button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-orange" disabled={busy === 'bulk'}
              onClick={() => bulk('is_suspended', true)}>Pezullo të gjithë</button>
            <button type="button" className="btn btn-green" disabled={busy === 'bulk'}
              onClick={() => bulk('is_suspended', false)}>Aktivizo të gjithë</button>
            <button type="button" className="btn" disabled={busy === 'bulk'}
              onClick={() => bulk('is_verified', true)}>Verifiko të gjithë</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="ct">Lista</div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 28 }}>
                <input type="checkbox" aria-label="Zgjidh të gjithë"
                  checked={rows.length > 0 && sel.length === rows.length} onChange={toggleAll} />
              </th>
              <th>Përdoruesi</th><th>Statusi</th><th>Abonimet</th><th style={{ width: 230 }}>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <UserRow key={u.id} u={u} plans={plans} pick={pick} setPick={setPick}
                busy={busy} confirmDel={confirmDel} setConfirmDel={setConfirmDel} call={call}
                selected={sel.includes(u.id)} onToggle={toggle} />
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 22 }}>Asnjë përdorues.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
