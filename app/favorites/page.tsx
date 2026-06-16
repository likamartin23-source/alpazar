'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { SkeletonGrid } from '../components/Skeleton'
import { FavoriteButton } from '../components/FavoriteButton'

export default function FavoritesPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      const { data } = await supabase
        .from('favorites')
        .select('listing_id, created_at, listings(id,title,price,currency,city,images,condition,is_active,is_premium)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setListings((data || []).map((f: any) => f.listings).filter(Boolean))
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 0 80px' }}>
      <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: 0 }}>Të preferuarat ❤️</h1>
      </div>

      {loading ? (
        <div style={{ padding: '16px' }}><SkeletonGrid count={4} /></div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❤️</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 8 }}>Ende s'ke ruajtur asgjë</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Shfleto shpalljet dhe ruaj ato që të pëlqejnë</div>
          <button
            onClick={() => { window.location.href = '/search' }}
            style={{ background: '#E63312', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            🔍 Eksploro shpalljet
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px' }}>
          {listings.map(l => {
            const img = Array.isArray(l.images) && l.images.length ? l.images[0] : null
            const price = l.currency === 'EUR'
              ? `€${Number(l.price).toLocaleString('sq-AL')}`
              : `${Number(l.price).toLocaleString('sq-AL')} L`
            return (
              <div
                key={l.id}
                onClick={() => { window.location.href = `/listing/${l.id}` }}
                style={{ borderRadius: 14, overflow: 'hidden', background: '#fff', border: '1px solid #F0F0F0', boxShadow: '0 1px 8px rgba(0,0,0,.06)', cursor: 'pointer', position: 'relative' }}
              >
                <div style={{ width: '100%', aspectRatio: '4/3', background: '#F6F6F6', position: 'relative', overflow: 'hidden' }}>
                  {img
                    ? <img src={img} alt={l.title} loading="lazy" width={400} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><i className="ti ti-photo" style={{ fontSize: 28, color: '#ccc' }} /></div>
                  }
                  <div style={{ position: 'absolute', top: 6, right: 6 }}>
                    <FavoriteButton listingId={l.id} size={28} />
                  </div>
                  {l.is_premium && (
                    <div style={{ position: 'absolute', top: 6, left: 6, background: 'linear-gradient(90deg,#FFD700,#FFA500)', color: '#7B5000', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5 }}>GOLD</div>
                  )}
                </div>
                <div style={{ padding: '8px 10px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4, marginBottom: 4 }}>{l.title}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#E63312' }}>{price}</div>
                  {l.city && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}><i className="ti ti-map-pin" style={{ fontSize: 10 }} /> {l.city}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
