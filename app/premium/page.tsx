'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlpazar } from '../../lib/context'
import { PREMIUM_CSS } from './ui'
import { TierTabs, Hero, PeriodSeg, PlanCard, PayBox } from './parts'

export default function PremiumPage() {
  const { user, authReady } = useAlpazar()
  const [pricing, setPricing] = useState<any>(null)
  const [ent, setEnt] = useState<any>(null)
  const [tier, setTier] = useState<'premium' | 'boost'>('premium')
  const [period, setPeriod] = useState('monthly')
  const [planId, setPlanId] = useState('')
  const [methodId, setMethodId] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [p, e] = await Promise.all([
      supabase.rpc('get_public_pricing'),
      user ? supabase.rpc('get_my_entitlements') : Promise.resolve({ data: null }),
    ])
    setPricing(p.data)
    setEnt((e as any)?.data || null)
  }, [user])

  useEffect(() => { if (authReady) load() }, [authReady, load])

  // Cdo ndryshim ne planet ose ne konfigurim reflektohet MENJEHERE, pa rifreskim.
  useEffect(() => {
    const ch = supabase.channel('pricing-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'premium_plans' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const all: any[] = pricing?.plans || []
  const plans = all.filter((p: any) => p.tier === tier && p.billing_period === period)
  const methods: any[] = pricing?.payment_methods || []
  const [mt, mm] = msg.split(/:(.+)/)
  const isPremium = !!ent?.is_premium
  const locked = tier === 'boost' && !isPremium
  const owned = tier === 'boost' ? !!ent?.has_boost : isPremium
  const sel = plans.find((p: any) => p.id === planId)

  async function subscribe() {
    if (!user) { window.location.href = '/auth/login'; return }
    if (!planId) { setMsg('err:Zgjidh një plan.'); return }
    if (!methodId) { setMsg('err:Zgjidh metodën e pagesës.'); return }
    setBusy(true); setMsg('')
    const { data, error } = await supabase.rpc('request_subscription', {
      p_plan_id: planId, p_payment_method_id: methodId,
    })
    setBusy(false)
    if (error || data?.error) {
      setMsg('err:' + (data?.message || error?.message || data?.error))
      return
    }
    setMsg('ok:Kërkesa u dërgua! Përfitimet aktivizohen menjëherë pas konfirmimit.')
    setTimeout(() => { window.location.href = '/billing' }, 1600)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_CSS }} />
      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <h1 className="tt">Planet</h1>
        </div>

        <div className="body">
          {msg && <div className={`msg ${mt}`} role="alert">{mm}</div>}

          <TierTabs tier={tier} pricing={pricing} onPick={(t: any) => { setTier(t); setPlanId(''); setMsg('') }} />
          <Hero tier={tier} />

          {owned && (
            <div className="note ok">
              <b>{tier === 'premium' ? 'Premium' : 'VIP Ekstra Boost'} është aktiv.</b>{' '}
              Menaxhoje te <a href="/billing">Plani im</a>.
            </div>
          )}

          {locked && (
            <div className="note">
              <b>VIP Ekstra Boost kërkon Premium aktiv.</b> Aktivizo së pari Premium — pastaj mund ta shtosh Boost-in.
            </div>
          )}

          <PeriodSeg period={period} onPick={(k: string) => { setPeriod(k); setPlanId('') }} />

          {!pricing && <div className="card center muted">Duke ngarkuar planet…</div>}

          {plans.map((p: any) => (
            <PlanCard key={p.id} p={p} selected={planId === p.id} locked={locked} onPick={setPlanId} />
          ))}

          {plans.length > 0 && !locked && (
            <PayBox
              methods={methods} methodId={methodId} setMethodId={setMethodId}
              sel={sel} busy={busy} planId={planId} owned={owned} onSubmit={subscribe}
            />
          )}
        </div>
      </div>
    </>
  )
}
