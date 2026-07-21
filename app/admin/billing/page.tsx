'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAlpazar } from '../../../lib/context'
import { ADMIN_BILLING_CSS } from './shared'
import { PlansSection } from './plans'
import { MethodsSection } from './methods'
import { SubsSection } from './subs'

export default function AdminBillingPage() {
  const { user, profile, authReady } = useAlpazar()
  const [plans, setPlans] = useState<any[]>([])
  const [methods, setMethods] = useState<any[]>([])
  const [subs, setSubs] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'plans' | 'methods' | 'subs'>('plans')

  const load = useCallback(async () => {
    const [p, m, s] = await Promise.all([
      supabase.from('premium_plans').select('*').order('sort_order').order('price_eur'),
      supabase.from('payment_methods').select('*').order('sort_order'),
      supabase.from('subscriptions').select('*, premium_plans(name,slug), profiles:user_id(username,full_name)').in('status', ['pending', 'active']).order('created_at', { ascending: false }),
    ])
    setPlans(p.data || []); setMethods(m.data || []); setSubs(s.data || [])
  }, [])

  useEffect(() => { if (authReady && user) load() }, [authReady, user, load])

  function flash(ok: boolean, text: string) {
    setMsg(`${ok ? 'ok' : 'err'}:${text}`)
    setTimeout(() => setMsg(''), 3500)
  }

  if (!authReady) return null
  if (!profile?.is_admin) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: ADMIN_BILLING_CSS }} />
        <div className="wrap"><div className="body"><div className="card center">Vetëm për administratën.</div></div></div>
      </>
    )
  }

  const [mt, mm] = msg.split(/:(.+)/)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_BILLING_CSS }} />
      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu" onClick={() => { window.location.href = '/admin' }}><i className="ti ti-arrow-left" aria-hidden="true" /></button>
          <h1 className="tt">Billing — Administrata</h1>
        </div>
        <div className="tabs" role="tablist">
          {([['plans', 'Planet'], ['methods', 'Pagesat'], ['subs', 'Abonimet']] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        <div className="body">
          {msg && <div className={`msg ${mt}`} role="alert">{mm}</div>}
          <div className="note">Çdo ndryshim reflektohet <b>menjëherë</b> në platformë (faqja Premium & Plani im lexojnë direkt nga baza) — pa kod, pa deploy.</div>
          {tab === 'plans' && <PlansSection plans={plans} onSaved={() => { load(); flash(true, 'Plani u ruajt.') }} onError={(e: string) => flash(false, e)} />}
          {tab === 'methods' && <MethodsSection methods={methods} onSaved={() => { load(); flash(true, 'Metoda u ruajt.') }} onError={(e: string) => flash(false, e)} />}
          {tab === 'subs' && <SubsSection subs={subs} plans={plans} onSaved={() => { load(); flash(true, 'Abonimi u përditësua.') }} onError={(e: string) => flash(false, e)} />}
        </div>
      </div>
    </>
  )
}
