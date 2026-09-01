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
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button type="button" aria-label="Kthehu mbrapa" onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111', flex: 1, margin: 0 }}><span aria-hidden="true">🏢</span> Krijo Biznes Online</h1>
      </div>
      <div style={{ padding: '20px 16px' }}>
        {ok ? <BusinessForm mode="create" /> : (
          <div style={{ textAlign: 'center', padding: 40, color: '#555', fontSize: 13 }}>Duke ngarkuar…</div>
        )}
      </div>
    </div>
  )
}
