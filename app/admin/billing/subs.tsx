'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export function SubsSection({ subs, plans, onSaved, onError }: any) {
  const [giftUser, setGiftUser] = useState('')
  const [giftPlan, setGiftPlan] = useState('')
  const [giftPer, setGiftPer] = useState<'monthly' | 'yearly'>('monthly')

  async function rpc(fn: string, args: any) {
    const { data, error } = await supabase.rpc(fn, args)
    if (error || data?.error) { onError(error?.message || data?.error); return false }
    onSaved(); return true
  }

  async function gift() {
    const uname = giftUser.trim().replace(/^@/, '')
    if (!uname || !giftPlan) { onError('Shkruaj përdoruesin dhe zgjidh planin.'); return }
    const { data: prof } = await supabase.from('profiles').select('id').or(`username.eq.${uname},full_name.eq.${uname}`).limit(1).maybeSingle()
    if (!prof?.id) { onError('Përdoruesi nuk u gjet.'); return }
    if (await rpc('admin_gift_subscription', { p_user_id: prof.id, p_plan_id: giftPlan, p_period: giftPer })) {
      setGiftUser('')
    }
  }

  return (
    <>
      <div className="card edit">
        <div className="sec-t">Dhuro abonim</div>
        <label className="fld"><span>Përdoruesi (username)</span>
          <input value={giftUser} onChange={e => setGiftUser(e.target.value)} placeholder="p.sh. martinel" />
        </label>
        <div className="two">
          <label className="fld"><span>Plani</span>
            <select value={giftPlan} onChange={e => setGiftPlan(e.target.value)}>
              <option value="">Zgjidh…</option>
              {plans.filter((p: any) => p.is_active).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="fld"><span>Periudha</span>
            <select value={giftPer} onChange={e => setGiftPer(e.target.value as any)}>
              <option value="monthly">Mujore (30 ditë)</option>
              <option value="yearly">Vjetore (365 ditë)</option>
            </select>
          </label>
        </div>
        <button type="button" className="btn primary" onClick={gift}>Dhuro</button>
      </div>

      {subs.length === 0 && <div className="card center muted">Asnjë abonim aktiv ose në pritje.</div>}
      {subs.map((s: any) => (
        <div key={s.id} className="card">
          <div className="row">
            <div>
              <b>{s.profiles?.full_name || s.profiles?.username || s.user_id.slice(0, 8)}</b>
              <div className="muted">{s.premium_plans?.name} · {s.period === 'yearly' ? 'vjetor' : 'mujor'} · {s.status}{s.cancel_at_period_end ? ' · anulohet në fund' : ''}</div>
              {s.current_period_end && <div className="muted">Deri: {new Date(s.current_period_end).toLocaleDateString('sq-AL')}</div>}
            </div>
            <div className="row-r">
              <button type="button" className="btn small" onClick={() => rpc('admin_adjust_subscription', { p_user_id: s.user_id, p_plan_id: s.plan_id, p_days: 30 })}>+30 ditë</button>
              <button type="button" className="btn small" style={{ color: '#E63312', borderColor: '#E63312' }} onClick={() => { if (confirm('Çaktivizo menjëherë abonimin e këtij përdoruesi?')) rpc('admin_cancel_subscription', { p_user_id: s.user_id, p_immediate: true }) }}>Çaktivizo</button>
            </div>
          </div>
        </div>
      ))}
      <div className="muted" style={{ fontSize: 11 }}>Aprovimet e pagesave bëhen te paneli kryesor (Kërkesat Premium) — aktivizimi + fatura ndodhin automatikisht.</div>
    </>
  )
}
