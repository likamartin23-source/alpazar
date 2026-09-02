'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const L = (n: any) => Number(n || 0).toLocaleString('sq-AL', { maximumFractionDigits: 2 })
const PERIOD: Record<string, string> = { monthly: 'Mujor', quarterly: '3-mujor', yearly: 'Vjetor' }

const FIELDS = [
  ['name', 'Emri', 'text'],
  ['price_all', 'Çmimi (Lekë)', 'number'],
  ['price_eur', 'Çmimi (€)', 'number'],
  ['discount_pct', 'Zbritja (%)', 'number'],
  ['sort_order', 'Renditja', 'number'],
] as const

export function PlansTab() {
  const [rows, setRows] = useState<any[]>([])
  const [edit, setEdit] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('premium_plans').select('*')
      .order('tier', { ascending: false }).order('sort_order')
    if (error) { setErr(error.message); return }
    setRows(data || []); setErr('')
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!edit) return
    setBusy(true); setErr(''); setOk('')
    const { error } = await supabase.from('premium_plans').update({
      name: edit.name,
      price_all: Number(edit.price_all) || 0,
      price_eur: Number(edit.price_eur) || 0,
      discount_pct: Number(edit.discount_pct) || 0,
      sort_order: Number(edit.sort_order) || 0,
    }).eq('id', edit.id)
    setBusy(false)
    if (error) { setErr(error.message); return }
    setEdit(null); setOk('Plani u ruajt. Çmimet u sinkronizuan automatikisht.')
    setTimeout(() => setOk(''), 3000)
    load()
  }

  async function toggle(p: any) {
    setBusy(true); setErr('')
    const { error } = await supabase.from('premium_plans').update({ is_active: !p.is_active }).eq('id', p.id)
    setBusy(false)
    if (error) { setErr(error.message); return }
    load()
  }

  const prem = rows.filter(r => (r.tier || 'premium') === 'premium')
  const boost = rows.filter(r => r.tier === 'boost')

  const table = (list: any[], title: string, note: string) => (
    <div className="card">
      <div className="ct">{title}</div>
      <div style={{ fontSize: 10.5, color: '#999', marginBottom: 10 }}>{note}</div>
      <table>
        <thead>
          <tr><th>Plani</th><th>Periudha</th><th>Çmimi</th><th>Zbritja</th><th>Statusi</th><th style={{ width: 150 }} /></tr>
        </thead>
        <tbody>
          {list.map(p => (
            <tr key={p.id}>
              <td><strong style={{ fontSize: 11.5 }}>{p.name}</strong><div style={{ color: '#aaa', fontSize: 9.5 }}>{p.slug}</div></td>
              <td>{PERIOD[p.billing_period] || p.billing_period}<div style={{ color: '#aaa', fontSize: 9.5 }}>{p.months} muaj</div></td>
              <td><strong>{L(p.price_all)} L</strong><div style={{ color: '#aaa', fontSize: 9.5 }}>{p.price_eur} €</div></td>
              <td>{Number(p.discount_pct) > 0 ? `−${p.discount_pct}%` : '—'}</td>
              <td><span className={`badge ${p.is_active ? 'ba' : 'bd'}`}>{p.is_active ? 'Aktiv' : 'Fshehur'}</span></td>
              <td>
                <button type="button" className="edit-btn" onClick={() => setEdit({ ...p })}>Redakto</button>{' '}
                <button type="button" className="edit-btn" disabled={busy} onClick={() => toggle(p)}>
                  {p.is_active ? 'Fshih' : 'Shfaq'}
                </button>
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: 18 }}>Asnjë plan.</td></tr>}
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">⭐</span> Planet</div>
        {ok && <div className="live-dot">{ok}</div>}
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#C42B0F', fontSize: 12 }}>{err}</div>
      )}

      {edit && (
        <div className="card" style={{ borderColor: '#F5C842' }}>
          <div className="ct">Redakto — {edit.name}</div>
          {FIELDS.map(([k, l, t]) => (
            <div className="cfg-row" key={k}>
              <div className="cfg-label">{l}</div>
              <input className="finput" style={{ width: 200 }} type={t} aria-label={l}
                value={edit[k] ?? ''} onChange={e => setEdit({ ...edit, [k]: e.target.value })} />
            </div>
          ))}
          <div className="save-row">
            <button type="button" className="save-btn" disabled={busy} onClick={save}>
              {busy ? 'Duke ruajtur…' : 'Ruaj'}
            </button>
            <button type="button" className="edit-btn" onClick={() => setEdit(null)}>Anulo</button>
          </div>
        </div>
      )}

      {table(prem, 'Premium', 'Të gjithë përdoruesit Premium janë të barabartë — ndryshon vetëm periudha e faturimit. Kufijtë redaktohen te tab-i “Kufijtë”.')}
      {table(boost, 'VIP Ekstra Boost', 'Produkt i veçantë, blihet vetëm nga përdorues që kanë Premium aktiv.')}

      <div className="card">
        <div className="ct">Sinkronizimi</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
          Sa herë ndryshon një çmim këtu, faqja kryesore, faqja e planeve dhe asistenti Albi e marrin
          vlerën e re menjëherë. Asnjë çmim nuk është i shkruar në kod.
        </div>
      </div>
    </>
  )
}
