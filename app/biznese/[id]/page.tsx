'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import dynamicImport from 'next/dynamic'

const MapDisplay = dynamicImport(() => import('../../components/MapDisplay').then(m => ({ default: m.MapDisplay })), { ssr: false })

interface Biz {
  id: string; owner_id: string; name: string; slug: string; type: string
  logo_url: string | null; cover_url: string | null; description: string | null
  address: string | null; latitude: number | null; longitude: number | null
  phone: string | null; website: string | null; hours: any; is_verified: boolean
  created_at: string
}

export default function BiznesPage({ params }: { params: { id: string } }) {
  const [biz, setBiz]           = useState<Biz | null>(null)
  const [subcats, setSubcats]   = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<'about' | 'listings' | 'reviews'>('listings')
  const [userId, setUserId]     = useState<string | null>(null)
  const [isOwner, setIsOwner]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id)
    })
    fetchBiz()
  }, [])

  async function fetchBiz() {
    // Kërko sipas id (UUID biznesi) OSE owner_id (UUID profilit) — mbështet të dy lidhjet
    let { data: b } = await supabase.from('businesses').select('*').eq('id', params.id).maybeSingle()
    if (!b) {
      const res = await supabase.from('businesses').select('*').eq('owner_id', params.id).maybeSingle()
      b = res.data
    }
    if (!b) { setLoading(false); return }
    setBiz(b)
    setIsOwner((await supabase.auth.getSession()).data.session?.user.id === b.owner_id)

    // Subcategories
    const { data: mapRows } = await supabase
      .from('business_subcategory_map')
      .select('subcategory_id, business_subcategories(name, icon)')
      .eq('business_id', b.id)
    if (mapRows) setSubcats(mapRows.map((r: any) => r.business_subcategories).filter(Boolean))

    // Listings (no limit for businesses)
    const { data: ls } = await supabase
      .from('listings')
      .select('id,title,price,currency,images,condition,city,is_premium,views_count')
      .eq('business_id', b.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (ls) setListings(ls)

    setLoading(false)
  }

  function fmt(price: number, cur: string) {
    if (!price) return 'Me marrëveshje'
    return cur === 'EUR' ? `€${Number(price).toLocaleString('sq-AL')}` : `${Number(price).toLocaleString('sq-AL')} L`
  }

  if (loading) return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#F5C842,#E63312)', aspectRatio: '16/6' }} />
      <div style={{ padding: 16 }}><div style={{ height: 20, background: '#eee', borderRadius: 8, marginBottom: 10 }} /></div>
    </div>
  )

  if (!biz) return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
      <div style={{ fontWeight: 700, color: '#111' }}>Biznesi nuk u gjet</div>
      <button onClick={() => window.history.back()} style={{ marginTop: 16, background: '#E63312', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Kthehu</button>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh', paddingBottom: 80 }}>
      <style>{`
        .biz-tab{flex:1;padding:12px 0;font-size:13px;font-weight:700;border:none;background:none;cursor:pointer;border-bottom:2.5px solid transparent;color:#888;font-family:inherit;transition:all .15s;}
        .biz-tab.active{color:#E63312;border-bottom-color:#E63312;}
        .biz-btn{padding:9px 18px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid #ddd;background:#fff;color:#111;transition:all .15s;}
        .biz-btn:hover{background:#f5f5f5;}
        .listing-card{borderRadius:12px;overflow:hidden;background:#fff;border:1px solid #F0F0F0;boxShadow:0 1px 6px rgba(0,0,0,.06);cursor:pointer;}
      `}</style>

      {/* Back */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 20 }}>
        <button onClick={() => window.history.back()} style={{ background: 'rgba(0,0,0,.45)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 18, color: '#fff' }} />
        </button>
      </div>

      {/* Cover 16:6 */}
      <div style={{ position: 'relative', aspectRatio: '16/6', overflow: 'hidden', marginBottom: 48 }}>
        {biz.cover_url
          ? <img src={biz.cover_url} alt="Kopertina" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#F5C842,#E63312)' }} />
        }
        {/* Logo */}
        <div style={{ position: 'absolute', bottom: -36, left: 16, width: 72, height: 72, borderRadius: '50%', background: '#fff', border: '4px solid #fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 2px 12px rgba(0,0,0,.15)' }}>
          {biz.logo_url ? <img src={biz.logo_url} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{biz.name}</div>
            {biz.is_verified && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 6, marginTop: 4, display: 'inline-block' }}>✓ Biznes i verifikuar</span>
            )}
          </div>
          {isOwner && (
            <button onClick={() => window.location.href = `/biznese/${biz.id}/edit`} style={{ background: '#111', color: '#F5C842', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>✏️ Ndrysho</button>
          )}
        </div>

        {/* Subcategories as chips */}
        {subcats.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {subcats.map((s, i) => (
              <span key={i} style={{ fontSize: 11, background: '#F5F5F5', color: '#555', padding: '3px 9px', borderRadius: 12, fontWeight: 600 }}>{s.icon} {s.name}</span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {biz.phone && (
            <a href={`tel:${biz.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 0', borderRadius: 10, background: '#E63312', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              ☎ Telefono
            </a>
          )}
          <button
            onClick={() => { if (!userId) { window.location.href = '/auth/login'; return } window.location.href = `/messages?biz=${biz.id}` }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 0', borderRadius: 10, background: '#111', color: '#F5C842', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            💬 Mesazh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: 4, padding: '0 4px' }}>
        {([['about', 'ℹ️ Rreth'], ['listings', '🛍️ Shpalljet'], ['reviews', '⭐ Vlerësime']] as const).map(([t, label]) => (
          <button key={t} className={`biz-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{label}</button>
        ))}
      </div>

      {/* About tab */}
      {activeTab === 'about' && (
        <div style={{ padding: '16px' }}>
          {biz.description && (
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6 }}>{biz.description}</div>
            </div>
          )}
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #f0f0f0' }}>
            {biz.address && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12, fontSize: 13, color: '#333' }}>
                <span style={{ fontSize: 15 }}>📍</span>{biz.address}
              </div>
            )}
            {biz.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: '#333' }}>
                <span>☎</span><a href={`tel:${biz.phone}`} style={{ color: '#E63312', fontWeight: 700, textDecoration: 'none' }}>{biz.phone}</a>
              </div>
            )}
            {biz.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: '#333' }}>
                <span>🌐</span><a href={biz.website} target="_blank" rel="noopener noreferrer" style={{ color: '#E63312', textDecoration: 'none', fontWeight: 700, wordBreak: 'break-all' }}>{biz.website.replace(/^https?:\/\//, '')}</a>
              </div>
            )}
            {biz.hours?.schedule && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#333' }}>
                <span>🕐</span>{biz.hours.schedule}
              </div>
            )}
          </div>
          {biz.latitude && biz.longitude && (
            <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
              <MapDisplay lat={biz.latitude} lng={biz.longitude} address={biz.address || biz.name} />
            </div>
          )}
        </div>
      )}

      {/* Listings tab */}
      {activeTab === 'listings' && (
        <div style={{ padding: '12px 16px' }}>
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Nuk ka shpallje ende</div>
              {isOwner && (
                <button onClick={() => window.location.href = '/listing/new'} style={{ marginTop: 12, background: '#E63312', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>+ Shto shpallje</button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {listings.map(l => {
                const img = Array.isArray(l.images) && l.images.length ? l.images[0] : null
                return (
                  <div key={l.id} onClick={() => window.location.href = `/listing/${l.id}`} style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', border: '1px solid #F0F0F0', boxShadow: '0 1px 6px rgba(0,0,0,.06)', cursor: 'pointer', position: 'relative' }}>
                    <div style={{ width: '100%', aspectRatio: '4/3', background: '#F6F6F6', overflow: 'hidden', position: 'relative' }}>
                      {img
                        ? <img src={img} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><i className="ti ti-photo" style={{ fontSize: 24, color: '#ccc' }} /></div>
                      }
                      {l.is_premium && <div style={{ position: 'absolute', top: 5, left: 5, background: 'linear-gradient(90deg,#FFD700,#FFA500)', color: '#7B5000', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5 }}>GOLD</div>}
                    </div>
                    <div style={{ padding: '8px 10px 10px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4, marginBottom: 4 }}>{l.title}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#E63312' }}>{fmt(l.price, l.currency)}</div>
                      {l.city && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}><i className="ti ti-map-pin" style={{ fontSize: 10 }} /> {l.city}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#bbb' }}>
            {listings.length} shpallje aktive · Biznes pa limit ♾️
          </div>
        </div>
      )}

      {/* Reviews tab */}
      {activeTab === 'reviews' && (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: '#aaa' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 6 }}>Vlerësimet vijnë së shpejti</div>
          <div style={{ fontSize: 12, color: '#888' }}>Klientët do të mund të vlerësonin biznesin tënd.</div>
        </div>
      )}
    </div>
  )
}
