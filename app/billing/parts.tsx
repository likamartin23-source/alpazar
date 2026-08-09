'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const L = (n: any) => Number(n || 0).toLocaleString('sq-AL', { maximumFractionDigits: 2 })

export function PlanBuy({ plan, methods, busy, onBuy }: any) {
  const [mid, setMid] = useState('')
  return (
    <div style={{ marginTop: 8 }}>
      <select value={mid} onChange={e => setMid(e.target.value)} aria-label="Metoda e pagesës">
        <option value="">Metoda e pagesës…</option>
        {methods.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <button type="button" className="btn primary small" disabled={busy || !mid}
        onClick={() => onBuy(mid)} style={{ marginTop: 6 }}>Abonohu</button>
    </div>
  )
}

export function BoostStrip({ boost }: any) {
  if (!boost) return null
  const active = boost.status === 'active'
  return (
    <div className="card" style={{ borderColor: '#DDD6FE', background: '#FAF8FF' }}>
      <div className="row">
        <div>
          <div className="plan-name">⚡ {boost.plan?.name}</div>
          <div className="muted">{L(boost.plan?.price_all)} L / {boost.plan?.months || 1} muaj</div>
        </div>
        <span style={{ background: active ? '#EDE9FE' : '#FFF8E1', color: active ? '#5B21B6' : '#856404', fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 999 }}>
          {active ? 'Aktiv' : 'Në pritje'}
        </span>
      </div>
      {active && boost.current_period_end && (
        <div className="muted" style={{ marginTop: 8 }}>
          Shikueshmëri maksimale deri më <b>{new Date(boost.current_period_end).toLocaleDateString('sq-AL')}</b> ({boost.days_left} ditë).
        </div>
      )}
    </div>
  )
}

export function PlansGrid({ plans, plan, sub, methods, busy, act }: any) {
  return (
    <div className="card">
      <div className="sec-t">{sub ? 'Ndrysho planin' : 'Zgjidh një plan'}</div>
      <div className="grid">
        {plans.map((p: any) => (
          <div key={p.id} className={`pcard ${plan?.id === p.id ? 'cur' : ''}`}>
            <div className="pname">
              {p.name}
              {p.tier === 'boost' && <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 800, color: '#7C3AED' }}>⚡</span>}
            </div>
            <div className="pprice">
              {L(p.price_all)} L <span className="muted">/ {p.months || 1} muaj</span>
            </div>
            <div className="muted" style={{ fontSize: 11 }}>
              {p.tier === 'boost' ? 'Shikueshmëri maksimale' : 'Të gjitha përfitimet, pa limite'}
              {p.discount_pct > 0 && ` · −${p.discount_pct}%`}
            </div>
            {plan?.id === p.id
              ? <div className="cur-tag">Plani yt</div>
              : sub
                ? <button type="button" className="btn small" disabled={!!busy}
                    onClick={() => act('change_my_plan', { p_plan_id: p.id })}>Kalo këtu</button>
                : <PlanBuy plan={p} methods={methods} busy={!!busy}
                    onBuy={(mid: string) => act('request_subscription', { p_plan_id: p.id, p_payment_method_id: mid })} />}
          </div>
        ))}
      </div>
      {sub?.status === 'active' && (
        <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
          Ndryshimi i planit hyn në fuqi në rinovimin e ardhshëm — transparencë e plotë, pa pagesa të fshehura.
        </div>
      )}
    </div>
  )
}

export function MyInvoices() {
  const [list, setList] = useState<any[] | null>(null)

  useEffect(() => {
    supabase.rpc('get_my_invoices', { p_limit: 24 })
      .then(({ data }) => setList((data as any)?.invoices || []), () => setList([]))
  }, [])

  if (!list || list.length === 0) return null

  return (
    <div className="card">
      <div className="sec-t">Faturat</div>
      {list.map((i: any) => (
        <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '.5px solid #f2f2f2' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111' }}>
              {i.number}
              {i.file_kind === 'fiscal' && (
                <span style={{ marginLeft: 6, background: '#EAF3DE', color: '#3B6D11', fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4 }}>TATIMORE</span>
              )}
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
              {i.plan_name}{i.issued_at ? ` · ${new Date(i.issued_at).toLocaleDateString('sq-AL')}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>
              {L(i.total)} {i.currency || 'EUR'}
            </div>
            {i.file_url
              ? <a href={i.file_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 10.5, color: '#E63312', fontWeight: 700 }}>Shkarko</a>
              : <span className="muted" style={{ fontSize: 10 }}>
                  {i.status === 'paid' ? 'E paguar' : i.status === 'sent' ? 'Dërguar' : i.status}
                </span>}
          </div>
        </div>
      ))}
      <div className="muted" style={{ fontSize: 10.5, marginTop: 8 }}>
        Faturat të vijnë edhe në njoftimet e llogarisë sate.
      </div>
    </div>
  )
}
