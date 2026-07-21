'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Field } from './shared'

export function MethodsSection({ methods, onSaved, onError }: any) {
  const [edit, setEdit] = useState<any>(null)
  async function save() {
    const m = edit
    const cfg = { ...(m.config_json || {}), bank_name: m._bank || null, iban: m._iban || null, account_holder: m._holder || null, swift: m._swift || null, instructions: m._instr || null }
    const row = { name: m.name, type: m.type || 'bank', description: m.description || null, is_active: !!m.is_active, sort_order: Number(m.sort_order) || 0, config_json: cfg }
    const q = m.id ? supabase.from('payment_methods').update(row).eq('id', m.id) : supabase.from('payment_methods').insert(row)
    const { error } = await q
    if (error) { onError(error.message); return }
    setEdit(null); onSaved()
  }
  function open(m: any) {
    const c = m.config_json || {}
    setEdit({ ...m, _bank: c.bank_name || '', _iban: c.iban || '', _holder: c.account_holder || '', _swift: c.swift || '', _instr: c.instructions || '' })
  }
  return (
    <>
      {methods.map((m: any) => (
        <div key={m.id} className="card">
          <div className="row">
            <div>
              <b>{m.name}</b> <span className="muted">({m.type})</span>
              {m.config_json?.iban && <div className="muted">IBAN: {m.config_json.iban}</div>}
            </div>
            <div className="row-r">
              <span className={`dot ${m.is_active ? 'g' : 'r'}`} />
              <button type="button" className="btn small" onClick={() => open(m)}>Redakto</button>
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="btn primary" onClick={() => open({ name: '', type: 'bank', is_active: true, sort_order: 0, config_json: {} })}>+ Metodë e re</button>
      {edit && (
        <div className="card edit">
          <div className="sec-t">{edit.id ? 'Redakto metodën' : 'Metodë e re'}</div>
          <Field label="Emri (p.sh. Raiffeisen Bank)" value={edit.name} onChange={(v: string) => setEdit({ ...edit, name: v })} />
          <label className="fld"><span>Lloji</span>
            <select value={edit.type} onChange={e => setEdit({ ...edit, type: e.target.value })}>
              <option value="bank">Transfertë bankare</option>
              <option value="card">Kartë</option>
              <option value="paypal">PayPal</option>
              <option value="mobile">Portofol mobil</option>
            </select>
          </label>
          <Field label="Banka" value={edit._bank} onChange={(v: string) => setEdit({ ...edit, _bank: v })} />
          <Field label="IBAN" value={edit._iban} onChange={(v: string) => setEdit({ ...edit, _iban: v })} />
          <div className="two">
            <Field label="Përfituesi" value={edit._holder} onChange={(v: string) => setEdit({ ...edit, _holder: v })} />
            <Field label="SWIFT/BIC" value={edit._swift} onChange={(v: string) => setEdit({ ...edit, _swift: v })} />
          </div>
          <label className="fld"><span>Udhëzime për klientin</span>
            <textarea rows={2} value={edit._instr} onChange={e => setEdit({ ...edit, _instr: e.target.value })} />
          </label>
          <label className="chk"><input type="checkbox" checked={!!edit.is_active} onChange={e => setEdit({ ...edit, is_active: e.target.checked })} /> Aktive</label>
          <div className="btns">
            <button type="button" className="btn primary" onClick={save}>Ruaj</button>
            <button type="button" className="btn" onClick={() => setEdit(null)}>Mbyll</button>
          </div>
        </div>
      )}
    </>
  )
}
