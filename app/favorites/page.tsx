'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRealtimeTable } from '../../hooks/useRealtimeTable'
import { SkeletonGrid } from '../components/Skeleton'
import ListingCard from '../components/ListingCard'
import { LISTING_SELECT } from '../../lib/listingSelect'

export default function FavoritesPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(false)
  // `timeAgo` te ListingCard varet nga Date.now(); jepet vetem pas montimit
  // per te shmangur mospershtatje hidratimi.
  const [mounted, setMounted]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function load(silent = false) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/auth/login'; return }
    try {
      // Join biznesi/personi + rank_tier + status: karta e njesuar shfaq
      // identitetin (biznes/person), unazen VIP dhe overlay-n "SHITUR".
      const { data } = await supabase
        .from('favorites')
        .select(`listing_id, created_at, listings(${LISTING_SELECT},is_active)`)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      // Mbaj të shiturat (Vendimi 3: "Shitur" = social proof me overlay, jo fshehje); largo vetëm
      // ato të pauzuara (joaktive dhe JO të shitura).
      setListings((data || []).map((f: any) => f.listings).filter((l: any) => l && (l.is_active !== false || l.status === 'sold')))
    } catch {
      if (!silent) setLoadError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Realtime: një të preferuar që i ulet çmimi, shitet, ose hiqet përditësohet LIVE. Patch/heqje
  // vetëm për shpalljet që janë tashmë në listë (filtri null → handler-i injoron të tjerat).
  useRealtimeTable<any>(
    'listings',
    null,
    undefined,
    (row) => setListings(prev => prev.some(l => l.id === row.id)
      // "Shitur" (is_active=false + status='sold') MBETET me overlay (Vendimi 3); vetëm pauzimi (joaktive
      // e jo e shitur) e heq. Përndryshe patch në vend.
      ? ((row.is_active === false && row.status !== 'sold') ? prev.filter(l => l.id !== row.id) : prev.map(l => l.id === row.id ? { ...l, ...row } : l))
      : prev),
    (row) => setListings(prev => prev.filter(l => l.id !== row.id)),
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 0 80px' }}>
      <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" aria-label="Kthehu mbrapa" onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: 0 }}>Të preferuarat <span aria-hidden="true">❤️</span></h1>
      </div>

      {loadError ? (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }} aria-hidden="true">⚠️</div>
          <div style={{ fontSize: 14, color: '#C42B0F', marginBottom: 16 }}>Nuk u ngarkuan të dhënat. Kontrollo lidhjen dhe provo sërish.</div>
          <button type="button" onClick={() => window.location.reload()} style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rifresko</button>
        </div>
      ) : loading ? (
        <div style={{ padding: '16px' }}><SkeletonGrid count={4} /></div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">❤️</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 8 }}>Ende s'ke ruajtur asgjë</div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>Shfleto shpalljet dhe ruaj ato që të pëlqejnë</div>
          <button
            type="button"
            onClick={() => { window.location.href = '/search' }}
            style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', minHeight: 44, boxSizing: 'border-box', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span aria-hidden="true">🔍</span> Eksploro shpalljet
          </button>
        </div>
      ) : (
        <div className="listings-grid" style={{ padding: '16px' }}>
          {listings.map((l, i) => (
            <ListingCard
              key={l.id}
              listing={l}
              index={i}
              mounted={mounted}
              onUnfavorite={() => setListings(prev => prev.filter(x => x.id !== l.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
