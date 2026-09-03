'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import BusinessForm, { BusinessInitial } from '../../../components/BusinessForm'
import VerificationBox from '../../../components/VerificationBox'

// BLLOKU PËRFUNDIMTAR §3.8 — Editimi përdor TË NJËJTIN komponent BusinessForm si
// krijimi (një burim i vetëm). Vetëm-pronar (kontroll owner===viewer para ngarkimit).
export default function BiznesEditPage() {
  const params = useParams() as { id: string }
  const [loading, setLoading] = useState(true)
  const [initial, setInitial] = useState<BusinessInitial | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      const { data: b } = await supabase.from('businesses').select('*').eq('id', params.id).single()
      if (!b) { window.location.href = '/profile'; return }
      if (b.owner_id !== session.user.id) { window.location.href = `/biznese/${params.id}`; return }
      const { data: maps } = await supabase.from('business_subcategory_map').select('subcategory_id').eq('business_id', params.id)
      setInitial({
        id: b.id, name: b.name, type: b.type, description: b.description, tagline: b.tagline,
        founded_year: b.founded_year, logo_url: b.logo_url, cover_url: b.cover_url,
        gallery: Array.isArray(b.gallery) ? b.gallery : null,
        phone: b.phone, whatsapp: b.whatsapp, email: b.email, website: b.website, contact_person: b.contact_person,
        socials: b.socials, city: b.city, address: b.address, latitude: b.latitude, longitude: b.longitude,
        service_area: b.service_area, delivery: b.delivery, hours: b.hours, nipt: b.nipt,
        legal_form: b.legal_form, withdrawal_days: b.withdrawal_days,
        payment_methods: Array.isArray(b.payment_methods) ? b.payment_methods : null,
        return_policy: b.return_policy, warranty: b.warranty,
        subcatIds: (maps || []).map((m: any) => m.subcategory_id),
      })
      setLoading(false)
    })
  }, [params.id])

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: `
      .biz-edit-wrap{max-width:480px;margin:0 auto;background:var(--az-cream);min-height:100vh;padding-bottom:80px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
      @media(min-width:768px){.biz-edit-wrap{max-width:760px}}
      @media(min-width:1024px){.biz-edit-wrap{max-width:1080px}}
    ` }} />
    <div className="biz-edit-wrap">
      <div style={{ background: 'linear-gradient(165deg,var(--az-yellow-hi) 0%,var(--az-yellow) 52%,var(--az-yellow-lo) 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button type="button" aria-label="Kthehu mbrapa" onClick={() => window.location.href = `/biznese/${params.id}`} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 22, color: '#111' }} aria-hidden="true" />
        </button>
        <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: '#111', flex: 1, margin: 0 }}><span aria-hidden="true">🏢</span> Të dhënat e biznesit</h1>
      </div>
      <div style={{ padding: '20px 16px' }}>
        {loading || !initial ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#555', fontSize: 13 }}>Duke ngarkuar…</div>
        ) : (
          <>
            <BusinessForm mode="edit" initial={initial} onSaved={() => { window.location.href = `/biznese/${params.id}` }} />
            {/* Kerkesa per verifikim rri KETU, bashke me te dhenat e biznesit:
                verifikimi krahason pikerisht keto te dhena me regjistrin e QKB-se,
                ndaj nje ekran i vetem i pergjigjet nje pyetjeje te vetme (§6). */}
            <VerificationBox businessId={params.id} nipt={initial.nipt} />
          </>
        )}
      </div>
    </div>
    </>
  )
}
