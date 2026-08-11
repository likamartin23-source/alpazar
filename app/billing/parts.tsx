'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const L = (n: any) => Number(n || 0).toLocaleString('sq-AL', { maximumFractionDigits: 2 })

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

// /billing menaxhon VETEM abonimin qe ke. Katalogu i planeve eshte te /premium —
// keshtu nuk ka mbivendosje dhe nuk mund te kalosh gabimisht nga Premium ne Boost.
export function PlansGrid({ plans, plan, sub, busy, act }: any) {
  if (!sub) {
    return (
      <div className="card center">
        <div className="sec-t">Nuk ke abonim aktiv</div>
        <div className="muted" style={{ marginBottom: 10 }}>
          Shiko planet dhe zgjidh atë që të përshtatet.
        </div>
        <a href="/premium" className="btn primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Shiko planet
        </a>
      </div>
    )
  }

  const tier = sub.tier || plan?.tier || 'premium'
  const same = plans.filter((p: any) => (p.tier || 'premium') === tier)

  return (
    <div className="card">
      <div className="sec-t">Ndrysho periudhën e faturimit</div>
      <div className="grid">
        {same.map((p: any) => (
          <div key={p.id} className={`pcard ${plan?.id === p.id ? 'cur' : ''}`}>
            <div className="pname">
              {p.name}
              {p.tier === 'boost' && <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 800, color: '#7C3AED' }}>⚡</span>}
            </div>
            <div className="pprice">
              {L(p.price_all)} L <span className="muted">/ {p.months || 1} muaj</span>
            </div>
            <div className="muted" style={{ fontSize: 11 }}>
              {p.discount_pct > 0 ? `Kurseni ${p.discount_pct}%` : 'Faturim mujor'}
            </div>
            {plan?.id === p.id
              ? <div className="cur-tag">Plani yt</div>
              : <button type="button" className="btn small" disabled={!!busy}
                  onClick={() => act('change_my_plan', { p_plan_id: p.id })}>Kalo këtu</button>}
          </div>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
        Përfitimet janë të njëjta në çdo periudhë — ndryshon vetëm sa shpesh faturohesh.
        Ndryshimi hyn në fuqi në rinovimin e ardhshëm, pa pagesa të fshehura.
      </div>
      {tier === 'premium' && (
        <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          Do shikueshmëri maksimale? Shto <a href="/premium" style={{ color: '#C42B0F', fontWeight: 700 }}>Ekstra Boost VIP</a>.
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
                  style={{ fontSize: 10.5, color: '#C42B0F', fontWeight: 700 }}>Shkarko</a>
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
