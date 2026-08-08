'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAlpazar } from '../../../lib/context'
import Avatar from '../../components/Avatar'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'Sot'
  if (d < 30) return `${d} ditë më parë`
  const m = Math.floor(d / 30)
  if (m < 12) return `${m} muaj më parë`
  return `${Math.floor(m / 12)} vite më parë`
}

function formatPrice(price: number | null | undefined, currency: string) {
  if (!price) return 'Me marrëveshje'
  return `${price.toLocaleString('sq-AL')} ${currency || 'L'}`
}

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const { user } = useAlpazar()
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'listings' | 'about'>('listings')

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase
        .from('profiles')
        .select('id,full_name,username,avatar_url,cover_url,bio,city,is_premium,is_verified,trust_score,trust_score_visible,created_at,shop_name,seller_rating,reviews_count')
        .eq('id', params.id)
        .single()

      if (!p) { setNotFound(true); setLoading(false); return }
      setProfile(p)

      const { data: ls } = await supabase
        .from('listings')
        .select('id,title,price,currency,images,city,created_at,is_premium')
        .eq('user_id', params.id)
        .eq('is_active', true)
        .order('is_premium', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(60)

      setListings(ls || [])
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
  const isOwnProfile = user?.id === profile.id
  const isBusiness = !!profile.shop_name

  const tabs = [
    { key: 'listings', label: `Shpalljet (${listings.length})` },
    { key: 'about', label: 'Rreth' },
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
            type={isBusiness ? 'business' : profile.is_premium ? 'premium' : 'user'}
            verified={profile.is_verified || (profile.trust_score ?? 0) >= 60}
            size={96}
          />
        </div>

        <div style={{ padding: '0 16px' }}>
          {/* Name + badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0, lineHeight: 1.2 }}>{name}</h1>
            {profile.is_premium && <span title="Premium" role="img" aria-label="Premium" style={{ fontSize: 16 }}>👑</span>}
            {profile.is_verified && <span title="Verifikuar" role="img" aria-label="Verifikuar" style={{ fontSize: 16 }}>✅</span>}
            {isBusiness && <span style={{ background: '#111', color: '#F5C842', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}><span aria-hidden="true">🏢</span> BIZNES</span>}
          </div>

          {profile.username && (
            <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>@{profile.username}</div>
          )}

          {profile.city && (
            <div style={{ color: '#666', fontSize: 13, marginBottom: 6 }}><span aria-hidden="true">📍</span> {profile.city}</div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111' }}>{listings.length}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Shpallje</div>
            </div>
            {(profile.trust_score_visible !== false) && (profile.trust_score ?? 0) > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#111' }}>{profile.trust_score}%</div>
                <div style={{ fontSize: 11, color: '#888' }}>Besueshmëri</div>
              </div>
            )}
            {profile.seller_rating > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#111' }}><span aria-hidden="true">⭐</span> {Number(profile.seller_rating).toFixed(1)}</div>
                <div style={{ fontSize: 11, color: '#888' }}>Vlerësim</div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#111' }}>{memberSince}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Anëtar</div>
            </div>
          </div>

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
            {isBusiness && (
              <button
                type="button"
                onClick={() => window.location.href = `/biznese/${profile.id}`}
                style={{ padding: '10px 16px', background: '#111', color: '#F5C842', border: 'none', borderRadius: 24, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                <><span aria-hidden="true">🏢</span> Shiko Biznesin</>
              </button>
            )}
          </div>
        </div>
      </div>

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
            style={{ flex: 1, padding: '14px 8px', border: 'none', background: 'transparent', fontWeight: activeTab === t.key ? 800 : 500, fontSize: 13, color: activeTab === t.key ? '#E63312' : '#666', borderBottom: activeTab === t.key ? '2px solid #E63312' : '2px solid transparent', cursor: 'pointer', transition: 'all .15s' }}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              {listings.map(l => {
                const img = Array.isArray(l.images) ? l.images[0] : null
                return (
                  <div
                    key={l.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`${l.title} — ${l.price ? `${l.price.toLocaleString('sq-AL')} ${l.currency || 'L'}` : 'Falas'}`}
                    onClick={() => window.location.href = `/listing/${l.id}`}
                    onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/listing/${l.id}` }}
                    style={{ position: 'relative', aspectRatio: '1/1', background: '#eee', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={l.title}
                        loading="lazy"
                        width={400}
                        height={400}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#F5C842,#E63312)', color: '#fff', fontSize: 28 }} aria-hidden="true">📦</div>
                    )}
                    {/* Price overlay */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding: '20px 6px 6px', color: '#fff' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{l.title}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#F5C842' }}>{formatPrice(l.price, l.currency)}</div>
                    </div>
                    {l.is_premium && (
                      <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 12 }} role="img" aria-label="Premium">⭐</div>
                    )}
                  </div>
                )
              })}
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
          </div>
        </div>
      )}
    </div>
  )
}
