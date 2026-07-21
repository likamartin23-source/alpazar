'use client'

import { supabase } from '../../../lib/supabase'

export function SubsSection({ subs, plans, onSaved, onError }: any) {
  async function adjust(userId: string, planId: string, days: number) {
    const { data, error } = await supabase.rpc('admin_adjust_subscription', { p_user_id: userId, p_plan_id: planId, p_days: days })
    if (error || data?.error) { onError(error?.message || data?.error); return }
    onSaved()
  }
  if (subs.length === 0) return <div className="card center muted">Asnjë abonim aktiv ose në pritje.</div>
  return (
    <>
      {subs.map((s: any) => (
        <div key={s.id} className="card">
          <div className="row">
            <div>
              <b>{s.profiles?.full_name || s.profiles?.username || s.user_id.slice(0, 8)}</b>
              <div className="muted">{s.premium_plans?.name} · {s.status}{s.cancel_at_period_end ? ' · anulohet në fund' : ''}</div>
              {s.current_period_end && <div className="muted">Deri: {new Date(s.current_period_end).toLocaleDateString('sq-AL')}</div>}
            </div>
            <button type="button" className="btn small" onClick={() => adjust(s.user_id, s.plan_id, 30)}>+30 ditë</button>
          </div>
        </div>
      ))}
      <div className="muted" style={{ fontSize: 11 }}>Aprovimet e pagesave bëhen te paneli kryesor (Kërkesat Premium) — aktivizimi ndodh automatikisht.</div>
    </>
  )
}
