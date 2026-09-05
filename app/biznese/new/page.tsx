'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { tierNgaProfili } from '../../components/Avatar'
import BusinessForm from '../../components/BusinessForm'

// §1B: krijimi i biznesit kërkon Premium aktiv (toggle nga app_config; gate-i i
// vërtetë është RLS). Formulari i plotë ndodhet te komponenti i vetëm BusinessForm
// (i njëjti create + edit, BLLOKU PËRFUNDIMTAR §3.8).
export default function BiznesNewPage() {
  const [ok, setOk] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      const [{ data: prof }, { data: cfg }, { data: myBiz }] = await Promise.all([
        supabase.from('profiles').select('is_premium,premium_expires_at,has_boost,boost_expires_at').eq('id', session.user.id).single(),
        supabase.from('app_config').select('value').eq('key', 'business_requires_premium').maybeSingle(),
        // NJË pronar = NJË biznes (rregulli i /profile g2). Kjo rrugë e dytë s'e kontrollonte
        // ekzistencën → krijonte biznes PARALEL (F1). Nëse ka biznes → çoje tek ai, mos krijo të dytë.
        supabase.from('businesses').select('id').eq('owner_id', session.user.id).limit(1).maybeSingle(),
      ])
      if (myBiz?.id) { window.location.href = `/biznese/${myBiz.id}`; return }
      const kerkohetPremium = ((cfg?.value ?? 'true') === 'true')
      if (kerkohetPremium && tierNgaProfili(prof) === 'free') { window.location.href = '/premium'; return }
      setOk(true)
    })
  }, [])

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: `
      .biz-new-wrap{max-width:480px;margin:0 auto;background:var(--az-cream);min-height:100vh;padding-bottom:80px;}
      @media(min-width:768px){.biz-new-wrap{max-width:760px}}
      @media(min-width:1024px){.biz-new-wrap{max-width:1080px}}
    ` }} />
    <div className="biz-new-wrap">
      <div style={{ background: 'linear-gradient(165deg,var(--az-yellow-hi) 0%,var(--az-yellow) 52%,var(--az-yellow-lo) 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button type="button" aria-label="Kthehu mbrapa" onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: '#111', flex: 1, margin: 0 }}><span aria-hidden="true">🏢</span> Krijo Biznes Online</h1>
      </div>
      <div style={{ padding: '20px 16px' }}>
        {ok ? <BusinessForm mode="create" /> : (
          <div style={{ textAlign: 'center', padding: 40, color: '#555', fontSize: 'var(--fs-dysheme)' }}>Duke ngarkuar…</div>
        )}
      </div>
    </div>
    </>
  )
}
