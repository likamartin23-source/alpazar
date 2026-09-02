'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Avatar, { tierNgaProfili, avatarVerified } from './Avatar'
import { timeAgo } from '../../lib/format'

// KARTA E BIZNESIT — e njëjta KORNIZË vizuale si `ListingCard` (të njëjtat klasa `.listing-card`/
// `.card-img`/`.card-body`… nga ui-refine.css), që "e njëjta kartë të notojë te të dyja vendet"
// (§3-MODELI / imazhi 03_Gjendja_Cak §C). Biznesi ka MË SHUMË rëndësi se shpallja (urdhër pronari):
// mban foto/emër/kategori/vula (🏢 · ✓ · 👑/⭐) DHE veprimin "Ruaj" (ndiq biznesin).
// Klik mbi kartë → /biznese/{id}.

export type BusinessCardItem = {
  id: string
  name: string
  logo_url?: string | null
  cover_url?: string | null
  type?: string | null
  city?: string | null
  is_verified?: boolean | null
  tagline?: string | null
  followers_count?: number | null
  created_at?: string | null
  owner?: { is_premium?: boolean | null; has_boost?: boolean | null; premium_expires_at?: string | null; boost_expires_at?: string | null } | null
}

const TIPI: Record<string, string> = {
  produkte: '📦 Produkte',
  sherbime: '🛠 Shërbime',
  sherbime_produkte: '🛠 Shërbime · 📦 Produkte',
}

export default function BusinessCard({ business, index = 0 }: { business: BusinessCardItem; index?: number }) {
  const b = business
  const go = (p: string) => { window.location.href = p }
  const open = () => go(`/biznese/${b.id}`)
  const tier = tierNgaProfili(b.owner || undefined)
  const cover = b.cover_url || b.logo_url || null
  const tipLabel = (b.type && TIPI[b.type]) || 'Biznes'

  const [uid, setUid] = useState<string | null>(null)
  const [following, setFollowing] = useState(false)
  const [busy, setBusy] = useState(false)
  // Foto qe deshton (404/CORS): shfaq vend-mbajtesin, mos e fshih ne kuti bosh (F5).
  const [imgFailed, setImgFailed] = useState(false)
  // timeAgo varet nga Date.now() → vetem pas mount-it (pa mospershtatje hidratimi), si ListingCard.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.id || null
      if (!alive) return
      setUid(id)
      if (!id) return
      supabase.from('business_followers').select('business_id').eq('business_id', b.id).eq('user_id', id).maybeSingle()
        .then(({ data }) => { if (alive) setFollowing(!!data) })
    })
    return () => { alive = false }
  }, [b.id])

  async function toggleRuaj(e: React.MouseEvent) {
    e.stopPropagation(); e.preventDefault()
    if (!uid) { go('/auth/login'); return }
    if (busy) return
    setBusy(true)
    const was = following
    setFollowing(!was)
    const { error } = was
      ? await supabase.from('business_followers').delete().eq('business_id', b.id).eq('user_id', uid)
      : await supabase.from('business_followers').insert({ business_id: b.id, user_id: uid })
    if (error) setFollowing(was)
    setBusy(false)
  }

  return (
    <div
      className="listing-card"
      style={{ ['--i' as string]: String(Math.min(index, 8)) } as React.CSSProperties}
      role="link"
      tabIndex={0}
      aria-label={`Biznesi ${b.name}`}
      onClick={open}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') open() }}
    >
      <div className="card-img">
        {cover && !imgFailed
          ? <img src={cover} alt={b.name} loading={index < 3 ? 'eager' : 'lazy'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setImgFailed(true)} />
          : <i className="ti ti-building-store" style={{ fontSize: 30, color: '#c9b47a' }} aria-hidden="true" />
        }
        {/* Vula e tier-it (lart-djathtas) — i njëjti sistem si te ListingCard. */}
        {tier === 'vip'
          ? <span className="badge-premium" role="img" aria-label="VIP" style={{ background: 'linear-gradient(135deg,#D4AF37,#E63312)', color: '#fff' }}><span aria-hidden="true">👑</span> VIP</span>
          : tier === 'premium' && <span className="badge-premium" role="img" aria-label="Premium"><span aria-hidden="true">★</span></span>}
        {/* Identiteti (poshtë-majtas) — [A2] përmes <Avatar> të njësuar (unazë tier + vula 🏢/✓),
            jo më vulë e rivizatuar me dorë. I njëjti Avatar si te overlay-i i shitësit te ListingCard. */}
        <span className="card-seller-ov" style={{ cursor: 'default' }} aria-label={avatarVerified(b, 'business') ? 'Biznes i verifikuar' : 'Biznes'}>
          <Avatar src={b.logo_url} name={b.name} type="business" tier={tier} verified={avatarVerified(b, 'business')} size={18} />
          <span>{avatarVerified(b, 'business') ? 'Biznes ✓' : 'Biznes'}</span>
        </span>
        {/* "Ruaj" = ndiq biznesin (poshtë-djathtas, si zemra e shpalljes). Biznesi ruhet. */}
        <button
          type="button"
          onClick={toggleRuaj}
          aria-pressed={following}
          aria-label={following ? 'Mos e ruaj më këtë biznes' : 'Ruaj këtë biznes'}
          style={{ position: 'absolute', right: 6, bottom: 6, zIndex: 3, width: 44, height: 44, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          {/* I njejti rreth si `FavoriteButton` (zemra e shpalljes): bg .95 · hije .28 · unaza .08 —
              me pare ndryshonte (.92/.12/pa unaze). Ikona mbetet bookmark: "ndiq biznesin" ≠
              "ruaj shpalljen" (zemer) — dallim semantik i qellimshem, e njejta kornize vizuale. */}
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,.28)', border: '1px solid rgba(0,0,0,.08)' }}>
            <i className={`ti ti-bookmark${following ? '-filled' : ''}`} style={{ fontSize: 16, color: following ? '#E63312' : '#888' }} aria-hidden="true" />
          </span>
        </button>
      </div>
      <div className="card-body">
        <div className="card-title">{b.name}</div>
        {/* Slogani i biznesit (tagline) — identitet, si "përshkrimi" te karta e shpalljes. */}
        {b.tagline && (
          <div style={{ fontSize: 11, color: '#6B6B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{b.tagline}</div>
        )}
        {/* Në vend të çmimit → kategoria/tipi i biznesit. */}
        <div className="card-subtype">{tipLabel}</div>
        <div className="card-meta">
          <span className="card-loc">
            <i className="ti ti-map-pin" aria-hidden="true" />
            {b.city || 'Shqipëri'}
          </span>
          {/* Mosha relative — simetri me ListingCard (qytet + kohë). */}
          <span style={{ fontSize: 11, color: '#6B6B6B', flexShrink: 0 }}>
            {mounted && b.created_at ? timeAgo(b.created_at) : ''}
          </span>
        </div>
        {/* Prova sociale (analoge me 👁 te karta e shpalljes): 👥 ndjekës. [O50] Roja `!= null` si
            ListingCard (jo `>0`) — rreshti ekziston edhe me 0, që karta të mos mbetet me hapësirë
            boshe poshtë (card-body ka lartësi të ngurtë). Simetri e plotë me ListingCard. */}
        {b.followers_count != null && (
          <div className="card-stats">
            <span className="cs-eye" aria-label={`${b.followers_count} ndjekës`}>
              <span aria-hidden="true">👥</span> {b.followers_count}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
