'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Field } from './shared'

export function PlansSection({ plans, onSaved, onError }: any) {
  const [edit, setEdit] = useState<any>(null)
  async function save() {
    const p = edit
    const row = {
      name: p.name, slug: p.slug, price_eur: Number(p.price_eur) || 0, price_all: Number(p.price_all) || 0,
      duration_days: Number(p.duration_days) || 30, max_listings: Number(p.max_listings) || 0,
      max_images: Number(p.max_images) || 10, boost_credits: Number(p.boost_credits) || 0,
      is_active: !!p.is_active, sort_order: Number(p.sort_order) || 0, description: p.description || null,
    }
    const q = p.id
      ? supabase.from('premium_plans').update(row).eq('id', p.id)
      : supabase.from('premium_plans').insert(row)
    const { error } = await q
    if (error) { onError(error.message); return }
    setEdit(null); onSaved()
  }
  return (
    <>
      {plans.map((p: any) => (
        <div key={p.id} className="card">
          <div className="row">
            <div>
              <b>{p.name}</b> <span className="muted">({p.slug})</span>
              <div className="muted">{p.price_eur}€ / {p.duration_days} ditë · {p.max_listings === -1 ? '∞' : p.max_listings} shpallje · {p.boost_credits} boost</div>
            </div>
            <div className="row-r">
              <span className={`dot ${p.is_active ? 'g' : 'r'}`} title={p.is_active ? 'Aktiv' : 'Joaktiv'} />
              <button type="button" className="btn small" onClick={() => setEdit({ ...p })}>Redakto</button>
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="btn primary" onClick={() => setEdit({ name: '', slug: '', price_eur: 0, price_all: 0, duration_days: 30, max_listings: 30, max_images: 10, boost_credits: 0, is_active: true, sort_order: 0 })}>+ Plan i ri</button>
      {edit && (
        <div className="card edit">
          <div className="sec-t">{edit.id ? 'Redakto planin' : 'Plan i ri'}</div>
          <Field label="Emri" value={edit.name} onChange={(v: string) => setEdit({ ...edit, name: v })} />
          <Field label="Slug" value={edit.slug} onChange={(v: string) => setEdit({ ...edit, slug: v })} />
          <div className="two">
            <Field label="Çmimi (€)" type="number" value={edit.price_eur} onChange={(v: string) => setEdit({ ...edit, price_eur: v })} />
            <Field label="Çmimi (Lekë)" type="number" value={edit.price_all} onChange={(v: string) => setEdit({ ...edit, price_all: v })} />
          </div>
          <div className="two">
            <Field label="Ditë" type="number" value={edit.duration_days} onChange={(v: string) => setEdit({ ...edit, duration_days: v })} />
            <Field label="Boost kredite" type="number" value={edit.boost_credits} onChange={(v: string) => setEdit({ ...edit, boost_credits: v })} />
          </div>
          <div className="two">
            <Field label="Max shpallje (-1 = ∞)" type="number" value={edit.max_listings} onChange={(v: string) => setEdit({ ...edit, max_listings: v })} />
            <Field label="Max foto" type="number" value={edit.max_images} onChange={(v: string) => setEdit({ ...edit, max_images: v })} />
          </div>
          <label className="chk"><input type="checkbox" checked={!!edit.is_active} onChange={e => setEdit({ ...edit, is_active: e.target.checked })} /> Aktiv (i dukshëm për përdoruesit)</label>
          <div className="btns">
            <button type="button" className="btn primary" onClick={save}>Ruaj</button>
            <button type="button" className="btn" onClick={() => setEdit(null)}>Mbyll</button>
          </div>
        </div>
      )}
    </>
  )
}
