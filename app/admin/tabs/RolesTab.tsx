'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

/* Modeli: Meta Business Suite / Stripe Teams — role te emertuara me
   nje grup fiks lejesh, jo kuti zgjedhjeje per secilen leje.
   Arsyeja: lejet e lira per person behen te pakontrollueshme brenda muajsh. */

const ROLET: { k: string; l: string; d: string; ng: string }[] = [
  { k: 'owner',     l: 'Pronar',        d: 'Gjithçka, përfshirë caktimin e roleve dhe rimbursimet.', ng: '#7A2E12' },
  { k: 'admin',     l: 'Administrator', d: 'Gjithçka përveç roleve dhe rimbursimeve.',               ng: 'var(--az-red)' },
  { k: 'finance',   l: 'Financa',       d: 'Pagesat, faturat, rimbursimet dhe planet. Nuk fshin.',   ng: '#1B7F3B' },
  { k: 'moderator', l: 'Moderator',     d: 'Përmbajtja, përdoruesit dhe bizneset. Pa para, pa fshirje.', ng: '#BA7517' },
  { k: 'support',   l: 'Mbështetje',    d: 'Vetëm lexim — sheh, nuk prek.',                          ng: '#555' },
]

const EMRI: Record<string, string> = {
  'users.view': 'Sheh përdoruesit', 'users.moderate': 'Pezullon / verifikon',
  'users.delete': 'Fshin përdorues', 'users.gift': 'Dhuron plane',
  'business.view': 'Sheh bizneset', 'business.moderate': 'Verifikon / errëson',
  'business.delete': 'Fshin biznese', 'billing.view': 'Sheh faturat',
  'billing.approve': 'Aprovon pagesa', 'billing.refund': 'Rimburson',
  'billing.plans': 'Ndryshon çmimet', 'config.write': 'Ndryshon konfigurimet',
  'broadcast.send': 'Dërgon njoftime masive', 'audit.view': 'Sheh gjurmën',
  'content.moderate': 'Modron përmbajtjen', 'roles.manage': 'Cakton rolet',
}

export function RolesTab() {
  const [d, setD] = useState<any>({ admins: [], kandidate: [] })
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [ri, setRi] = useState('')
  const [rol, setRol] = useState('support')
  const [heq, setHeq] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_admins')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setD(data); setErr('')
  }, [])

  useEffect(() => { load() }, [load])

  const cakto = useCallback(async (id: string, r: string | null, etiketa: string) => {
    setBusy(id); setErr(''); setOk('')
    const { data, error } = await supabase.rpc('admin_set_role', { p_user_id: id, p_role: r })
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setHeq(''); setRi('')
    setOk(etiketa)
    setTimeout(() => setOk(''), 3500)
    load()
  }, [load])

  const mund = !!d.mund_te_ndryshoj
  const admins: any[] = d.admins || []

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🔑</span> Rolet</div>
        {ok && <div className="live-dot">{ok}</div>}
      </div>

      <div className="stats">
        {ROLET.map(r => (
          <div className="sc" key={r.k}>
            <div className="sn">{admins.filter(a => a.roli === r.k).length}</div>
            <div className="sl">{r.l}</div>
          </div>
        ))}
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#C42B0F', fontSize: 'var(--fs-dysheme)' }}>{err}</div>
      )}

      {!mund && (
        <div className="card" style={{ borderColor: 'var(--az-yellow)', background: '#FFFBEF', fontSize: 'var(--fs-dysheme)', color: '#7A5B00' }}>
          Ti mund t’i shohësh rolet, por vetëm një <strong>Pronar</strong> i ndryshon ato.
        </div>
      )}

      <div className="card">
        <div className="ct">Ekipi i administratës</div>
        <table>
          <thead>
            <tr><th>Personi</th><th style={{ width: 150 }}>Roli</th><th>Çfarë mund të bëjë</th><th style={{ width: 190 }} /></tr>
          </thead>
          <tbody>
            {admins.map(a => {
              const r = ROLET.find(x => x.k === a.roli)
              const vetja = a.id === d.me
              return (
                <tr key={a.id}>
                  <td>
                    <strong style={{ fontSize: 'var(--fs-dysheme)' }}>{a.emri}</strong>
                    {vetja && <> <span className="badge bp">ti</span></>}
                    {a.pezulluar && <> <span className="badge bd">pezulluar</span></>}
                    <div style={{ color: '#999', fontSize: 'var(--fs-dysheme)' }}>{a.email || (a.username ? '@' + a.username : '')}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: r?.ng || '#555', color: '#fff' }}>{r?.l || a.roli}</span>
                  </td>
                  <td style={{ fontSize: 'var(--fs-dysheme)', color: '#666', lineHeight: 1.7 }}>
                    {(a.lejet || []).map((p: string) => EMRI[p] || p).join(' · ')}
                  </td>
                  <td>
                    {mund && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <select className="finput" style={{ width: 120 }} aria-label={`Roli i ${a.emri}`}
                          value={a.roli} disabled={busy === a.id}
                          onChange={e => cakto(a.id, e.target.value, `${a.emri} → ${e.target.selectedOptions[0].text}`)}>
                          {ROLET.map(x => <option key={x.k} value={x.k}>{x.l}</option>)}
                        </select>
                        {heq === a.id ? (
                          <>
                            <button type="button" className="btn btn-red" disabled={busy === a.id}
                              onClick={() => cakto(a.id, null, `${a.emri} u hoq nga administrata`)}>Po, hiqe</button>
                            <button type="button" className="edit-btn" onClick={() => setHeq('')}>Jo</button>
                          </>
                        ) : (
                          <button type="button" className="edit-btn" style={{ color: '#C42B0F' }}
                            onClick={() => setHeq(a.id)}>Hiq aksesin</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {admins.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: 22 }}>Asnjë admin.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {mund && (
        <div className="card">
          <div className="ct">Shto dikë në administratë</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="finput" style={{ width: 230 }} value={ri} aria-label="Përdoruesi"
              onChange={e => setRi(e.target.value)}>
              <option value="">Zgjidh përdoruesin…</option>
              {(d.kandidate || []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.emri}{c.username ? ` (@${c.username})` : ''}</option>
              ))}
            </select>
            <select className="finput" style={{ width: 150 }} value={rol} aria-label="Roli"
              onChange={e => setRol(e.target.value)}>
              {ROLET.map(x => <option key={x.k} value={x.k}>{x.l}</option>)}
            </select>
            <button type="button" className="save-btn" disabled={!ri || !!busy}
              onClick={() => cakto(ri, rol, 'Roli u caktua')}>Cakto rolin</button>
          </div>
          <div style={{ fontSize: 'var(--fs-dysheme)', color: '#999', marginTop: 8 }}>
            {ROLET.find(x => x.k === rol)?.d}
          </div>
        </div>
      )}

      <div className="card">
        <div className="ct">Kush çfarë mund të bëjë</div>
        <table>
          <thead><tr><th>Roli</th><th>Kufiri</th></tr></thead>
          <tbody>
            {ROLET.map(r => (
              <tr key={r.k}>
                <td><span className="badge" style={{ background: r.ng, color: '#fff' }}>{r.l}</span></td>
                <td style={{ fontSize: 'var(--fs-dysheme)', color: '#666' }}>{r.d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 'var(--fs-dysheme)', color: '#666', lineHeight: 1.8, marginTop: 10 }}>
          Lejet zbatohen në <strong>bazën e të dhënave</strong>, jo në pamje. Edhe nëse dikush e hap
          faqen me mjete të tjera, veprimi që s’i takon rolit të tij kthehet mbrapsht.
          <br />
          Platforma nuk mbetet kurrë pa Pronar — i fundit nuk hiqet dot.
        </div>
      </div>
    </>
  )
}
