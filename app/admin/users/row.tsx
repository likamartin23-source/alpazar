'use client'

import { useState } from 'react'

export function UserRow({ u, plans, act }: any) {
  const [open, setOpen] = useState(false)
  const [planId, setPlanId] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const sub = u.subscription

  return (
    <div className="card">
      <div className="row">
        <div style={{ minWidth: 0 }}>
          <b>{u.full_name || u.username || u.id.slice(0, 8)}</b>
          {u.is_admin && <span className="pill admin">ADMIN</span>}
          {u.is_premium && <span className="pill prem">PREMIUM</span>}
          {u.is_suspended && <span className="pill susp">PEZULLUAR</span>}
          {u.is_verified && <span className="pill ver">✓</span>}
          <div className="muted">@{u.username || '—'} · {u.listings} shpallje · {u.points || 0} pikë</div>
          {sub && <div className="muted">{sub.plan} · {sub.status}{sub.period_end ? ` · deri ${new Date(sub.period_end).toLocaleDateString('sq-AL')}` : ''}</div>}
        </div>
        <button type="button" className="btn small" onClick={() => setOpen(!open)}>{open ? 'Mbyll' : 'Menaxho'}</button>
      </div>

      {open && (
        <div className="panel">
          <div className="btns">
            <button type="button" className="btn small" onClick={() => act('admin_set_user_flag', { p_user_id: u.id, p_flag: 'is_suspended', p_value: !u.is_suspended }, u.is_suspended ? 'U aktivizua.' : 'U pezullua.')}>
              {u.is_suspended ? 'Aktivizo' : 'Pezullo'}
            </button>
            <button type="button" className="btn small" onClick={() => act('admin_set_user_flag', { p_user_id: u.id, p_flag: 'is_verified', p_value: !u.is_verified }, 'U përditësua.')}>
              {u.is_verified ? 'Hiq verifikimin' : 'Verifiko'}
            </button>
            <button type="button" className="btn small" onClick={() => act('admin_set_user_flag', { p_user_id: u.id, p_flag: 'is_admin', p_value: !u.is_admin }, 'U përditësua.')}>
              {u.is_admin ? 'Hiq admin' : 'Bëj admin'}
            </button>
          </div>

          <div className="sub-t">Abonimi</div>
          <select value={planId} onChange={e => setPlanId(e.target.value)} aria-label="Plani">
            <option value="">Zgjidh planin…</option>
            {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.duration_days} ditë)</option>)}
          </select>
          <div className="btns">
            <button type="button" className="btn small primary" disabled={!planId}
              onClick={() => act('admin_gift_subscription', { p_user_id: u.id, p_plan_id: planId, p_days: null }, 'Abonimi u dhurua.')}>
              Dhuro
            </button>
            {sub && (
              <>
                <button type="button" className="btn small" disabled={!planId}
                  onClick={() => act('admin_change_subscription_plan', { p_user_id: u.id, p_plan_id: planId }, 'Plani u ndryshua.')}>
                  Ndrysho planin
                </button>
                <button type="button" className="btn small" onClick={() => act('admin_deactivate_subscription', { p_user_id: u.id, p_reason: 'admin' }, 'Abonimi u çaktivizua.')}>
                  Çaktivizo
                </button>
              </>
            )}
          </div>

          <div className="sub-t">Zonë e rrezikshme</div>
          {confirmDel ? (
            <div className="btns">
              <button type="button" className="btn small danger" onClick={() => act('admin_delete_user', { p_user_id: u.id }, 'Përdoruesi u fshi.')}>Po, fshi përfundimisht</button>
              <button type="button" className="btn small" onClick={() => setConfirmDel(false)}>Anulo</button>
            </div>
          ) : (
            <button type="button" className="btn small danger" onClick={() => setConfirmDel(true)}>Fshi përdoruesin</button>
          )}
        </div>
      )}
    </div>
  )
}
