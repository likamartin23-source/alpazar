'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlpazar } from '../../lib/context'
import { PREMIUM_CSS } from './ui'

export default function PremiumPage() {
  const { user, profile, authReady } = useAlpazar()
  const [pricing, setPricing] = useState<any>(null)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [planId, setPlanId] = useState('')
  const [methodId, setMethodId] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [mySub, setMySub] = useState<any>(null)

  const load = useCallback(async () => {
    const [p, b] = await Promise.all([
      supabase.rpc('get_public_pricing'),
      user ? supabase.rpc('get_my_billing') : Promise.resolve({ data: null }),
    ])
    setPricing(p.data)
    setMySub((b as any)?.data?.subscription || null)
  }, [user])

  useEffect(() => { if (authReady) load() }, [authReady, load])

  const plans: any[] = (pricing?.plans || []).filter((p: any) => p.billing_period === period)
  const methods: any[] = pricing?.payment_methods || []
  const [mt, mm] = msg.split(/:(.+)/)

  async function subscribe() {
    if (!user) { window.location.href = '/auth/login'; return }
    if (!planId) { setMsg('err:Zgjidh një plan.'); return }
    if (!methodId) { setMsg('err:Zgjidh metodën e pagesës.'); return }
    setBusy(true); setMsg('')
    const { data, error } = await supabase.rpc('request_subscription', { p_plan_id: planId, p_payment_method_id: methodId })
    setBusy(false)
    if (error || data?.error) { setMsg(`err:${error?.message || data?.error}`); return }
    setMsg('ok:Kërkesa u dërgua! Shiko detajet te “Plani im”.')
    setTimeout(() => { window.location.href = '/billing' }, 1500)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_CSS }} />
      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu" onClick={() => window.history.back()}><i className="ti ti-arrow-left" aria-hidden="true" /></button>
          <h1 className="tt">Premium</h1>
        </div>

        <div className="body">
          {msg && <div className={`msg ${mt}`} role="alert">{mm}</div>}

          {mySub && (
            <div className="note">
              Ke tashmë një abonim <b>{mySub.status === 'active' ? 'aktiv' : 'në pritje'}</b>
              {mySub.plan?.name ? ` (${mySub.plan.name})` : ''}. Menaxhoje te{' '}
              <a href="/billing">Plani im</a>.
            </div>
          )}

          <div className="hero">
            <div className="hero-t">Rrit shitjet me Premium</div>
            <div className="hero-s">Më shumë shpallje, më shumë foto, prioritet në kërkim dhe boost.</div>
          </div>

          <div className="seg" role="tablist" aria-label="Periudha e faturimit">
            <button type="button" role="tab" aria-selected={period === 'monthly'} className={`sg ${period === 'monthly' ? 'on' : ''}`} onClick={() => { setPeriod('monthly'); setPlanId('') }}>Mujor</button>
            <button type="button" role="tab" aria-selected={period === 'yearly'} className={`sg ${period === 'yearly' ? 'on' : ''}`} onClick={() => { setPeriod('yearly'); setPlanId('') }}>
              Vjetor <span className="save">−17%</span>
            </button>
          </div>

          {!pricing && <div className="card center muted">Duke ngarkuar planet…</div>}

          {plans.map((p: any) => (
            <button key={p.id} type="button" aria-pressed={planId === p.id}
              className={`plan ${planId === p.id ? 'on' : ''} ${p.is_featured ? 'feat' : ''}`}
              onClick={() => setPlanId(p.id)}>
              <div className="p-top">
                <div>
                  <div className="p-name">{p.name}{p.is_featured && <span className="tag">Më i zgjedhuri</span>}</div>
                  <div className="p-desc">{p.max_listings === -1 ? 'Shpallje pa limit' : `${p.max_listings} shpallje`} · {p.max_images} foto · {p.boost_credits} boost</div>
                </div>
                <div className="p-price">
                  <b>{Number(p.price_all).toLocaleString('sq-AL')} L</b>
                  <span>{period === 'monthly' ? '/muaj' : '/vit'}</span>
                </div>
              </div>
              {p.badge && <div className="p-badge">{p.badge}</div>}
            </button>
          ))}

          {plans.length > 0 && (
            <div className="card">
              <div className="sec-t">Metoda e pagesës</div>
              {methods.length === 0 && <div className="muted">Asnjë metodë aktive. Kontakto administratën.</div>}
              {methods.map((m: any) => (
                <button key={m.id} type="button" aria-pressed={methodId === m.id}
                  className={`pm ${methodId === m.id ? 'on' : ''}`} onClick={() => setMethodId(m.id)}>
                  <i className={`ti ti-${m.type === 'card' ? 'credit-card' : m.type === 'paypal' ? 'brand-paypal' : m.type === 'mobile' ? 'device-mobile' : 'building-bank'}`} aria-hidden="true" />
                  {m.name}
                  {methodId === m.id && <i className="ti ti-circle-check ok" aria-hidden="true" />}
                </button>
              ))}
              <button type="button" className="cta" disabled={busy || !planId || !methodId} onClick={subscribe}>
                {busy ? 'Duke dërguar…' : 'Abonohu tani'}
              </button>
              <div className="muted small">Pagesa konfirmohet nga administrata. Mund ta anulosh kurdo te “Plani im”.</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
