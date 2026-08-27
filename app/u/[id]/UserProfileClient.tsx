'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAlpazar } from '../../../lib/context'
import Avatar, { tierNgaProfili } from '../../components/Avatar'
import { useIsOnline } from '../../components/OnlinePresence'
import ListingCard from '../../components/ListingCard'
import { TrustBadge } from '../../components/TrustBadge'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'Sot'
  if (d < 30) return `${d} ditë më parë`
  const m = Math.floor(d / 30)
  if (m < 12) return `${m} muaj më parë`
  return `${Math.floor(m / 12)} vite më parë`
}

// `formatPrice` u hoq bashke me grid-in katror: ListingCard e formaton vete
// cmimin me `nf()`, qe jep te njejtin rezultat ne server e ne shfletues.

export default function PublicProfilePage({ params, initialProfile, initialListings, initialBiz, initialIsOwn }: { params: { id: string }; initialProfile?: any; initialListings?: any[]; initialBiz?: any; initialIsOwn?: boolean }) {
  const { user } = useAlpazar()
  const seedListings = Array.isArray(initialListings) ? initialListings : []
  // Seed nga SSR => paraqitja e pare eshte e plote (profil + shpallje), pa spinner
  // mbi ekran e pa flash 0. Refetch-i ne klient eshte vetem rifreskim i heshtur.
  const [profile, setProfile] = useState<any>(initialProfile ?? null)
  const ownerOnline = useIsOnline(profile?.id) // prania LIVE (BLLOKU Imazhi 5)
  const [listings, setListings] = useState<any[]>(seedListings)
  const [loading, setLoading] = useState(!initialProfile)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'listings' | 'about'>('listings')
  const [biz, setBiz] = useState<any>(initialBiz ?? null)
  // Shitjet personale te kryera — social proof (Faza 6). Funksioni
  // user_sold_count numeron vetem status='sold' me business_id null.
  const [soldCount, setSoldCount] = useState(0)
  // Ndjekesit e personit (tabela `follows`, following_id = ky profil) —
  // kutia e 4-te e matrices se ngrire (BLLOKU Imazhi 5), identike me biznesin.
  const [followers, setFollowers] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from('profiles')
        .select('id,full_name,username,avatar_url,cover_url,bio,city,is_premium,premium_expires_at,has_boost,boost_expires_at,is_verified,trust_score,trust_score_visible,created_at,shop_name,seller_rating,reviews_count,gamification_points,gamification_level')
        .eq('id', params.id)
        .single()

      if (!p) { setNotFound(true); setLoading(false); return }
      setProfile(p)

      // `condition` dhe `rank_tier` u shtuan per ListingCard (shenjat
      // "I ri"/"I perdorur" dhe VIP).
      const { data: ls } = await supabase
        .from('listings')
        .select('id,title,price,currency,images,city,created_at,is_premium,condition,rank_tier,views_count')
        .eq('user_id', params.id)
        .is('business_id', null)   // vetem shpallje personale — ato te biznesit rrine te faqja e biznesit (Vendimi 7, pa dyfishim)
        .eq('is_active', true)
        .order('rank_tier', { ascending: false })
        .order('last_bumped_at', { ascending: false })
        .limit(60)

      // Rifreskim i heshtur: zevendeso VETEM kur kthehen te dhena reale; nese bosh
      // (race/rrjet), mbaj seed-in SSR => kurre flash 0. Bosh legjitim vjen nga SSR.
      if (ls && ls.length) setListings(ls)

      // Biznesi i ketij personi — lidhja person → dyqan (§4.5). Merret nga
      // tabela `businesses`, jo nga `profiles.shop_name`: ai i fundit tregon
      // vetem qe dikur eshte shkruar nje emer dyqani, jo qe ekziston nje
      // faqe biznesi per te.
      const { data: bz } = await supabase
        .from('businesses')
        .select('id,name,logo_url,is_verified')
        .eq('owner_id', params.id)
        .maybeSingle()
      setBiz(bz || null)

      // Shitjet personale — funksioni kthen skalar integer (Faza 6).
      supabase.rpc('user_sold_count', { p_user: params.id }).then(({ data }) => {
        const n = Number(Array.isArray(data) ? data[0] : data)
        if (Number.isFinite(n)) setSoldCount(n)
      })

      // Ndjekesit — count pa rreshta (head:true), fail-soft ne 0.
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', params.id)
        .then(({ count }) => { if (typeof count === 'number') setFollowers(count) }, () => {})

      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFBEA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #F5C842', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#FFFBEA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ fontSize: 48 }} aria-hidden="true">👤</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Profili nuk u gjet</div>
      <button type="button" onClick={() => window.location.href = '/'} style={{ marginTop: 8, padding: '10px 24px', background: '#F5C842', border: 'none', borderRadius: 24, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>← Kthehu</button>
    </div>
  )

  const name = profile.full_name || profile.username || 'Përdorues'
  const memberSince = new Date(profile.created_at).getFullYear()
  // FIX-3: para se konteksti të zgjidhë `user`, përdor vlerën nga serveri (initialIsOwn)
  // => paraqitja e parë s'kërcen vizitor↔pronar. Kur `user` vjen, përputhet.
  const isOwnProfile = user ? user.id === profile.id : !!initialIsOwn
  // Nje faqe biznesi e vertete peshon me shume se nje `shop_name` i mbetur.
  const isBusiness = !!biz || !!profile.shop_name

  const tabs = [
    { key: 'listings', label: `Shpalljet (${listings.length})` },
    { key: 'about', label: 'Rreth & Vlerësime' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBEA', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", paddingBottom: 80 }}>
      {/* Back button */}
      <button
        type="button"
        onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 100, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}
        aria-label="Kthehu"
      >←</button>

      {/* Cover */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/7', background: 'linear-gradient(135deg,#F5C842 0%,#E63312 100%)', overflow: 'hidden', maxHeight: 260 }}>
        {profile.cover_url && (
          <img
            src={profile.cover_url}
            alt={`Foto kopertinë e ${profile.full_name || profile.username || 'profilit'}`}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </div>

      {/* Identity card */}
      <div style={{ background: '#fff', paddingBottom: 16, marginBottom: 8, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
        {/* Avatar overlapping cover */}
        <div style={{ position: 'relative', marginTop: -48, marginLeft: 16, marginBottom: 10 }}>
          <Avatar
            src={profile.avatar_url}
            name={name}
            type={isBusiness ? 'business' : 'person'}
            tier={tierNgaProfili(profile)}
            verified={profile.is_verified || (profile.trust_score ?? 0) >= 60}
            online={ownerOnline}
            size={96}
          />
        </div>

        <div style={{ padding: '0 16px' }}>
          {/* Name + badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0, lineHeight: 1.2 }}>{name}</h1>
            {(() => { const t = tierNgaProfili(profile); return t !== 'free' && <span title={t === 'vip' ? 'VIP Ekstra Boost' : 'Premium'} role="img" aria-label={t === 'vip' ? 'VIP Ekstra Boost' : 'Premium'} style={{ fontSize: 16 }}>👑</span> })()}
            {profile.is_verified && <span title="Verifikuar" role="img" aria-label="Verifikuar" style={{ fontSize: 16 }}>✅</span>}
            {isBusiness && <span style={{ background: '#111', color: '#F5C842', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}><span aria-hidden="true">🏢</span> BIZNES</span>}
          </div>

          {profile.username && (
            <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>@{profile.username}</div>
          )}

          {profile.city && (
            <div style={{ color: '#666', fontSize: 13, marginBottom: 6 }}><span aria-hidden="true">📍</span> {profile.city}</div>
          )}

          {/* Stats row — matrica e ngrire (BLLOKU Imazhi 5): Shpallje / Të shitura /
              Ndjekës / Anëtar, IDENTIKE me kutine e biznesit. Rating u zhvendos
              te vlerësimet (seksioni "Rreth"), Besueshmëria te "Informacion". */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111' }}>{listings.length}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Shpallje</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: soldCount > 0 ? '#0E7A35' : '#111' }}>{soldCount}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Të shitura</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111' }}>{followers}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Ndjekës</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111' }}>{memberSince}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Anëtar</div>
            </div>
          </div>

          {/* Reputacioni (GAP 3+4 — mbyllja e lakut): TrustBadge i plotë (unazë "X/100") +
              "⚡ N pikë" reale. Pikët fitohen e njoftohen por s'shfaqeshin te profili — tani po.
              Respekton opt-out-in `trust_score_visible` (Ligji 124/2024). */}
          {profile.trust_score_visible !== false && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <TrustBadge
                createdAt={profile.created_at}
                listingsActive={listings.length}
                gamificationPoints={profile.gamification_points || 0}
              />
              {(profile.gamification_points || 0) > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: '#7A4A00', background: '#FFF8E1', border: '1px solid #F5C84255', borderRadius: 9, padding: '4px 10px' }}>
                  <span aria-hidden="true">⚡</span> {profile.gamification_points} pikë
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  if (!user) { window.location.href = '/auth/login'; return }
                  window.location.href = `/messages?with=${profile.id}`
                }}
                style={{ flex: 1, minWidth: 120, padding: '10px 16px', background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 24, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <><span aria-hidden="true">💬</span> Dërgo Mesazh</>
              </button>
            )}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => window.location.href = '/profile'}
                style={{ flex: 1, minWidth: 120, padding: '10px 16px', background: '#F5C842', color: '#111', border: 'none', borderRadius: 24, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                <><span aria-hidden="true">✏️</span> Edito Profilin</>
              </button>
            )}
            {/* Lidhja del nga rreshti real i biznesit; me pare perdorej
                id-ja e profilit dhe faqja e biznesit e shpetonte me nje
                rrugedalje `owner_id`. */}
            {biz && (
              <button
                type="button"
                onClick={() => window.location.href = `/biznese/${biz.id}`}
                style={{ padding: '10px 16px', background: '#111', color: '#F5C842', border: 'none', borderRadius: 24, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                <><span aria-hidden="true">🏢</span> Shiko Biznesin</>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rasti i paparashikuar në dizajn — "vizitori i profilit të vet": kur pronari sheh
          profilin e tij nga jashtë (nga "Shiko publik" te /profile, ose "profili yt →" te
          faqja e biznesit), njihet qartë + i jepet rrugë kthimi. Simetrike me banderolën e
          biznesit (BiznesPageClient: "Po e shikon faqen publike ← Kthehu te menaxhimi"). */}
      {isOwnProfile && (
        <div style={{ background: '#111', color: '#F5C842', margin: '0 0 8px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: 700 }}>
          <span><span aria-hidden="true">👁</span> Po e shikon profilin tënd publik — kështu e shohin vizitorët</span>
          <button
            type="button"
            onClick={() => window.location.href = '/profile'}
            aria-label="Kthehu te profili im"
            style={{ background: '#F5C842', color: '#111', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            ← Kthehu te profili
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div role="tablist" aria-label="Seksionet e profilit" style={{ background: '#fff', display: 'flex', borderBottom: '1px solid #eee', marginBottom: 8, position: 'sticky', top: 0, zIndex: 10 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            aria-controls={`tabpanel-${t.key}`}
            onClick={() => setActiveTab(t.key as any)}
            style={{ flex: 1, padding: '14px 8px', border: 'none', background: 'transparent', fontWeight: activeTab === t.key ? 800 : 500, fontSize: 13, color: activeTab === t.key ? '#C42305' : '#666', borderBottom: activeTab === t.key ? '2px solid #C42305' : '2px solid transparent', cursor: 'pointer', transition: 'all .15s' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Listings grid tab */}
      {activeTab === 'listings' && (
        <div id="tabpanel-listings" role="tabpanel" aria-labelledby="tab-listings" style={{ padding: '0 2px' }}>
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#888', fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }} aria-hidden="true">📭</div>
              Nuk ka shpallje aktive
            </div>
          ) : (
            // I njejti ListingCard si te kryefaqja dhe te faqja e biznesit.
            // Me pare ky ishte nje grid katror 1/1 me titullin e mbivendosur
            // mbi foto — i lexueshem me veshtiresi dhe i ndryshem nga cdo
            // siperfaqe tjeter.
            <div className="listings-grid" style={{ padding: '0 12px' }}>
              {listings.map((l, idx) => (
                <ListingCard key={l.id} listing={l as any} index={idx} showSeller={false} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* About tab */}
      {activeTab === 'about' && (
        <div id="tabpanel-about" role="tabpanel" aria-labelledby="tab-about" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profile.bio && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Për Mua</div>
              <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>{profile.bio}</div>
            </div>
          )}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Informacion</div>
            {profile.city && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: '#333' }}>
                <span aria-hidden="true">📍</span><span>{profile.city}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: '#333' }}>
              <span aria-hidden="true">📅</span><span>Anëtar që nga {memberSince}</span>
            </div>
            {profile.reviews_count > 0 && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: '#333' }}>
                <span aria-hidden="true">⭐</span><span>{profile.reviews_count} vlerësime · mesatare {Number(profile.seller_rating).toFixed(1)}</span>
              </div>
            )}
            {/* Besueshmëria u zhvendos ketu nga stats-row (matrica 4-kuti e bllokut);
                respekton opt-out-in `trust_score_visible` (Ligji 124/2024). */}
            {(profile.trust_score_visible !== false) && (profile.trust_score ?? 0) > 0 && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: '#333' }}>
                <span aria-hidden="true">🛡️</span><span>Besueshmëri {profile.trust_score}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
