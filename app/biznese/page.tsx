'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Avatar, { tierNgaProfili } from '../components/Avatar'
import { BackButton } from '../components/BackButton'
import BusinessCard from '../components/BusinessCard'

interface Biz {
  id: string; name: string; type: string; logo_url: string | null
  city: string | null; description: string | null; is_verified: boolean
  listing_count?: number
  // Tier-i i unazes se avatarit vjen nga pronari, jo nga biznesi (Vendimi 1 i
  // planit: identiteti dhe abonimi jane boshte te ndryshem). Join i vetem, jo
  // per-rresht — pa N+1.
  owner?: {
    is_premium?: boolean | null
    premium_expires_at?: string | null
    has_boost?: boolean | null
    boost_expires_at?: string | null
  } | null
}

const TYPE_LABELS: Record<string, string> = {
  sherbime: '🛠️ Shërbime',
  produkte: '📦 Produkte',
  sherbime_produkte: '🔁 Shërbime & Produkte',
}

export default function BiznestPage() {
  const [businesses, setBusinesses] = useState<Biz[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState(false)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  // §1B: krijimi i biznesit eshte vecori Premium (i toggle-ueshem nga app_config).
  // Gate-i i vertete eshte RLS + ridrejtimi te /biznese/new; ky routing CTA eshte per UX.
  const [krijoDest, setKrijoDest]       = useState('/biznese/new')
  const [ftesePremium, setFtesePremium] = useState(false)
  const [kaBiznes, setKaBiznes]         = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return // vizitor: CTA -> /biznese/new (aty vendoset login + gate)
      const [{ data: prof }, { data: cfg }, { data: myBiz }] = await Promise.all([
        supabase.from('profiles')
          .select('is_premium,premium_expires_at,has_boost,boost_expires_at')
          .eq('id', session.user.id).single(),
        supabase.from('app_config').select('value')
          .eq('key', 'business_requires_premium').maybeSingle(),
        // NJË pronar = NJË biznes: nëse KA biznes, CTA-ja çon TE biznesi (jo te krijimi i dytë).
        // Rruga e vetme e krijimit mbetet ajo e panelit /profile (g2). §4-bis: një burim, jo dy.
        supabase.from('businesses').select('id').eq('owner_id', session.user.id).limit(1).maybeSingle(),
      ])
      if (myBiz?.id) { setKrijoDest(`/biznese/${myBiz.id}`); setKaBiznes(true); return }
      const gated = ((cfg?.value ?? 'true') === 'true') && tierNgaProfili(prof) === 'free'
      setFtesePremium(gated)
      setKrijoDest(gated ? '/premium' : '/biznese/new')
    })
  }, [])

  useEffect(() => {
    // KRITIKE (gjetja e terminalit): embed-i `owner:owner_id(...)` kthen 400 PGRST200 sepse
    // `businesses.owner_id` NUK ka çelës të huaj te `profiles.id` → PostgREST s'e ndërton dot
    // embed-in → faqja e biznesit binte tërësisht ("Gabim gjatë ngarkimit"). Arnë pa DB: marr
    // pronarët me një kërkesë të DYTË dhe i bashkoj në klient (një kërkesë për të gjithë → pa N+1).
    // FK-ja e vërtetë shtohet veçmas në DB (gjurmë migrimi), që çdo embed i ardhshëm të punojë.
    (async () => {
      const { data: bizRows, error } = await supabase
        .from('businesses')
        .select('id,name,type,logo_url,cover_url,city,description,is_verified,tagline,followers_count,owner_id')
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) { setLoadError(true); setLoading(false); return }
      const rows = (bizRows ?? []) as any[]
      const ownerIds = Array.from(new Set(rows.map(b => b.owner_id).filter(Boolean)))
      let ownersById: Record<string, any> = {}
      if (ownerIds.length > 0) {
        const { data: owners } = await supabase
          .from('profiles')
          .select('id,is_premium,premium_expires_at,has_boost,boost_expires_at')
          .in('id', ownerIds)
        ownersById = Object.fromEntries((owners ?? []).map(o => [o.id, o]))
      }
      setBusinesses(rows.map(b => ({ ...b, owner: ownersById[b.owner_id] ?? null })) as Biz[])
      setLoading(false)
    })()
  }, [])

  const filtered = businesses.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.city || '').toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || b.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh', paddingBottom: 80, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%)', padding: '14px 16px 16px', boxShadow: '0 4px 16px -8px rgba(190,130,0,.4)' }}>
        <BackButton style={{ marginBottom: 6, marginLeft: -10 }} iconStyle={{ fontSize: 22, color: '#111' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 4px' }}><span aria-hidden="true">🏢</span> Bizneset</h1>
        <p style={{ fontSize: 13, color: '#7B5000', margin: 0 }}>Zbulo bizneset shqiptare në Alpazar</p>
      </div>

      {/* Search + filter */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Kërko biznes ose qytet..."
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e5e5', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {[
            { key: '', icon: '', label: 'Të gjithë' },
            { key: 'sherbime', icon: '🛠️', label: 'Shërbime' },
            { key: 'produkte', icon: '📦', label: 'Produkte' },
            { key: 'sherbime_produkte', icon: '🔁', label: 'Të dyja' },
          ].map(f => (
            <button
              key={f.key}
              type="button"
              aria-pressed={typeFilter === f.key}
              onClick={() => setTypeFilter(f.key)}
              style={{ flexShrink: 0, padding: '6px 14px', background: typeFilter === f.key ? 'linear-gradient(135deg,#1a1a1a,#000)' : '#f0f0f0', color: typeFilter === f.key ? '#F5C842' : '#555', border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'background .15s ease,color .15s ease' }}
            >
              {f.icon && <><span aria-hidden="true">{f.icon}</span>{' '}</>}{f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create business CTA */}
      <div role="link" tabIndex={0} style={{ margin: '12px 16px 4px', background: 'linear-gradient(135deg,#151515,#1c1c1c 60%,#231a0a)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 6px 18px -8px rgba(0,0,0,.4)' }} onClick={() => window.location.href = krijoDest} onKeyDown={e => { if (e.key === 'Enter') window.location.href = krijoDest }}>
        <div>
          <div style={{ color: '#F5C842', fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{kaBiznes ? '🏢 Shiko biznesin tënd' : '+ Krijo Biznesin Tënd'}</div>
          <div style={{ color: '#aaa', fontSize: 11 }}>{kaBiznes
            ? <>Ke tashmë një biznes · hape për ta menaxhuar</>
            : ftesePremium
            ? <><span aria-hidden="true">⭐</span> Veçori Premium · Prezencë profesionale</>
            : <>Prezencë profesionale online</>}</div>
        </div>
        <i className="ti ti-arrow-right" style={{ fontSize: 20, color: '#F5C842' }} aria-hidden="true" />
      </div>

      {/* List */}
      <div style={{ padding: '8px 12px' }}>
        {loadError ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 40 }} aria-hidden="true">⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Gabim gjatë ngarkimit</div>
            <button type="button" onClick={() => window.location.reload()} style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rifresko</button>
          </div>
        ) : loading ? (
          <div role="status" aria-label="Duke ngarkuar bizneset..." style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eee' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, background: '#eee', borderRadius: 6, width: '60%', marginBottom: 7 }} />
                  <div style={{ height: 11, background: '#eee', borderRadius: 5, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#555' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }} aria-hidden="true">🏢</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{search || typeFilter ? 'Asnjë biznes nuk përputhet' : 'Asnjë biznes ende'}</div>
            {(search || typeFilter) && (
              <button type="button" onClick={() => { setSearch(''); setTypeFilter('') }} style={{ marginTop: 12, background: 'linear-gradient(135deg,#F8D24E,#F5C842)', color: '#111', border: 'none', borderRadius: 12, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px -2px rgba(245,200,66,.5)' }}>
                Pastro filtrat
              </button>
            )}
          </div>
        ) : (
          // E njëjta KARTË e njësuar si te "Biznese Online" dhe feed-i (BusinessCard) — "e njëjta
          // kartë kudo" (imazhi C). Më parë ishin rreshta me chevron (paraqitje e tretë).
          <div style={{ padding: '0 16px' }}>
            <div className="listings-grid">
              {filtered.map((b, idx) => (
                <BusinessCard key={b.id} business={b as any} index={idx} />
              ))}
            </div>
            <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: '#6E6E6E' }}>
              {filtered.length} biznes{filtered.length !== 1 ? 'e' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
