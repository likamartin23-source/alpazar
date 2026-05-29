'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { saveRefFromUrl, buildShareUrl } from '../../../lib/referral'

const CATEGORY_COLORS: Record<string, string> = {
  elektronike: '#3B82F6', makina: '#EF4444', shtepi: '#10B981',
  veshje: '#8B5CF6', sport: '#F59E0B', sherbime: '#06B6D4',
  femije: '#EC4899', bukuri: '#F97316',
}

export default function ShopDetailPage() {
  const params = useParams()
  const shopId = params?.id as string
  const [shop, setShop] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [myRefCode, setMyRefCode] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  useEffect(() => {
    saveRefFromUrl()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('referral_code,username').eq('id', session.user.id).single()
          .then(({ data: p }) => { if (p) setMyRefCode(p.referral_code || p.username || null) })
      }
    })
    if (shopId) fetchShop()
  }, [shopId])

  useEffect(() => {
    if (shop) fetchListings()
  }, [activeFilter, shop])

  async function fetchShop() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', shopId)
      .eq('is_premium', true)
      .single()
    if (data) setShop(data)
    setLoading(false)
  }

  async function fetchListings() {
    if (!shop) return
    let query = supabase
      .from('listings')
      .select('id,title,price,currency,condition,city,is_premium,images,created_at,category_id')
      .eq('user_id', shop.id)
      .eq('is_active', true)
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false })

    if (activeFilter === 'new') query = query.eq('condition', 'i_ri')
    if (activeFilter === 'used') query = query.eq('condition', 'i_perdorur')

    const { data } = await query
    if (data) setListings(data)
  }

  function goToChat() {
    if (!user) { window.location.href = '/auth/login'; return }
    window.location.href = `/messages?with=${shop.id}`
  }

  const fmt = (price: number, cur: string) =>
    !price ? 'Me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString('sq-AL')} €` : `${price.toLocaleString('sq-AL')} L`

  const color = CATEGORY_COLORS[shop?.shop_category] || '#E63312'
  const initials = (shop?.shop_name || shop?.full_name || '?').slice(0, 2).toUpperCase()

  if (loading) return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{font-family:system-ui,sans-serif;background:#FFFBEA;}`}</style>
      <div style={{ textAlign: 'center', padding: 60, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 10px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    </>
  )

  if (!shop) return (
    <>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{font-family:system-ui,sans-serif;background:#FFFBEA;}`}</style>
      <div style={{ textAlign: 'center', padding: 60, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
        <h2 style={{ color: '#555', marginBottom: 8 }}>Dyqani nuk u gjet</h2>
        <button onClick={() => window.location.href = '/dyqane'} style={{ background: '#E63312', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ← Kthehu te dyqanet
        </button>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:30px;}
        .back-bar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back-btn{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back-btn i{font-size:18px;color:#111;}
        .back-title{font-size:14px;font-weight:700;color:#111;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .banner{height:120px;background:linear-gradient(135deg,${color}33,${color}55);position:relative;display:flex;align-items:flex-end;padding:12px 14px;}
        .shop-avatar{width:64px;height:64px;border-radius:50%;background:#fff;border:3px solid ${color};display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.15);}
        .shop-avatar img{width:100%;height:100%;object-fit:cover;}
        .avatar-text{font-size:22px;font-weight:700;color:${color};}
        .prem-seal{position:absolute;top:10px;right:10px;background:#F5C842;color:#111;font-size:10px;padding:4px 10px;border-radius:12px;font-weight:700;display:flex;align-items:center;gap:4px;}
        .shop-info{padding:12px 14px;background:#fff;border-bottom:0.5px solid #eee;}
        .shop-name{font-size:18px;font-weight:700;color:#111;margin-bottom:3px;}
        .shop-handle{font-size:12px;color:#aaa;margin-bottom:6px;}
        .shop-desc{font-size:12px;color:#666;line-height:1.6;margin-bottom:10px;}
        .meta-row{display:flex;gap:10px;flex-wrap:wrap;}
        .meta-chip{display:flex;align-items:center;gap:5px;font-size:10px;color:#666;background:#f5f5f0;padding:4px 10px;border-radius:10px;}
        .meta-chip i{font-size:12px;}
        .action-row{padding:12px 14px;display:flex;gap:8px;background:#fff;border-bottom:0.5px solid #eee;}
        .msg-btn{flex:1;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;box-shadow:0 4px 12px rgba(230,51,18,.25);}
        .msg-btn i{font-size:16px;}
        .share-btn{width:44px;background:#f5f5f0;border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .share-btn i{font-size:18px;color:#555;}
        .body{padding:12px 10px;}
        .filter-row{display:flex;gap:6px;margin-bottom:12px;overflow-x:auto;}
        .filter-row::-webkit-scrollbar{display:none;}
        .flt{background:#fff;border:0.5px solid #ddd;border-radius:20px;padding:6px 14px;font-size:11px;color:#666;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .12s;}
        .flt.active{background:#111;border-color:#111;color:#F5C842;font-weight:700;}
        .section-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
        .section-hdr h3{font-size:13px;font-weight:700;color:#111;}
        .section-hdr span{font-size:11px;color:#E63312;}
        .listings-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
        .listing-card{background:#fff;border:0.5px solid #eee;border-radius:12px;overflow:hidden;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.04);transition:transform .12s;}
        .listing-card:active{transform:scale(.98);}
        .card-img{height:100px;display:flex;align-items:center;justify-content:center;background:#f9f5e0;position:relative;}
        .card-img img{width:100%;height:100%;object-fit:cover;}
        .card-img i{font-size:32px;color:#ccc;}
        .badge{position:absolute;top:5px;left:5px;font-size:8.5px;padding:2px 6px;border-radius:4px;font-weight:700;}
        .badge-new{background:#E63312;color:#fff;}
        .badge-used{background:#111;color:#F5C842;}
        .badge-prem{position:absolute;top:5px;right:5px;background:#F5C842;color:#111;font-size:8.5px;padding:2px 6px;border-radius:4px;font-weight:700;}
        .card-body{padding:9px 10px;}
        .card-title{font-size:12px;font-weight:700;color:#222;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .card-price{font-size:14px;font-weight:700;color:#E63312;margin-bottom:5px;}
        .card-loc{font-size:10px;color:#aaa;display:flex;align-items:center;gap:3px;}
        .card-loc i{font-size:11px;}
        .empty-shop{text-align:center;padding:40px;background:#f9f5e0;border-radius:12px;grid-column:1/-1;}
        .empty-shop i{font-size:36px;color:#F5C842;display:block;margin-bottom:8px;}
        .empty-shop p{font-size:12px;color:#aaa;line-height:1.6;}
        @keyframes ai-fade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="wrap">
        <div className="back-bar">
          <button className="back-btn" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" />
          </button>
          <span className="back-title">{shop.shop_name || shop.full_name}</span>
        </div>

        <div className="banner">
          {shop.shop_banner_url && (
            <img src={shop.shop_banner_url} alt="banner" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div className="shop-avatar">
            {shop.avatar_url
              ? <img src={shop.avatar_url} alt={shop.full_name} />
              : <span className="avatar-text">{initials}</span>
            }
          </div>
          <div className="prem-seal">⭐ Dyqan Premium</div>
        </div>

        <div className="shop-info">
          <div className="shop-name">{shop.shop_name || shop.full_name}</div>
          <div className="shop-handle">@{shop.username || 'dyqan'}</div>
          {shop.shop_description || shop.bio ? (
            <div className="shop-desc">{shop.shop_description || shop.bio}</div>
          ) : null}
          <div className="meta-row">
            {shop.city && (
              <span className="meta-chip">
                <i className="ti ti-map-pin" /> {shop.city}
              </span>
            )}
            <span className="meta-chip" style={{ background: color + '15', color }}>
              <i className="ti ti-package" /> {listings.length} shpallje
            </span>
            {shop.shop_category && (
              <span className="meta-chip" style={{ background: color + '15', color }}>
                <i className="ti ti-tag" /> {shop.shop_category}
              </span>
            )}
          </div>
        </div>

        {user?.id !== shop.id && (
          <div className="action-row">
            <button className="msg-btn" onClick={goToChat}>
              <i className="ti ti-message-circle" /> Chat me dyqanin
            </button>
            <button className="share-btn" onClick={() => setShareOpen(o => !o)} style={{ position: 'relative' }}>
              <i className={`ti ti-${shareOpen ? 'x' : 'share'}`} />
            </button>
          </div>
        )}

        {/* Share sheet */}
        {shareOpen && (() => {
          const shareUrl = buildShareUrl(`/dyqane/${shopId}`, myRefCode)
          const shareText = `Shiko dyqanin "${shop.shop_name}" në Alpazar!${myRefCode ? ' 🔗' : ''}`
          function copyShareLink() {
            navigator.clipboard.writeText(shareUrl).catch(() => {
              const el = document.createElement('textarea')
              el.value = shareUrl; document.body.appendChild(el); el.select()
              document.execCommand('copy'); document.body.removeChild(el)
            })
            setLinkCopied(true)
            setTimeout(() => { setLinkCopied(false); setShareOpen(false) }, 1800)
          }
          return (
            <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, animation: 'ai-fade .2s ease' }}>
              {myRefCode && (
                <div style={{ background: '#FFFBEA', border: '1px dashed #F5C842', borderRadius: 9, padding: '8px 12px', fontSize: 11, color: '#856404', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <i className="ti ti-gift" style={{ fontSize: 14, color: '#E63312', flexShrink: 0 }} />
                  <span>Duke ndarë me kodin tënd — nëse miku regjistrohet <strong>fiton 50 pikë!</strong></span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank')}
                  style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 6px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-brand-whatsapp" style={{ fontSize: 20 }} />WhatsApp
                </button>
                <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
                  style={{ background: '#1877F2', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 6px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-brand-facebook" style={{ fontSize: 20 }} />Facebook
                </button>
                <button onClick={copyShareLink}
                  style={{ background: linkCopied ? '#EAF3DE' : '#111', color: linkCopied ? '#3B6D11' : '#F5C842', border: 'none', borderRadius: 10, padding: '10px 6px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <i className={`ti ti-${linkCopied ? 'check' : 'copy'}`} style={{ fontSize: 20 }} />
                  {linkCopied ? 'U kopjua!' : 'Kopjo'}
                </button>
              </div>
            </div>
          )
        })()}

        <div className="body">
          <div className="filter-row">
            {[
              { id: 'all', label: 'Të gjitha' },
              { id: 'new', label: '🆕 I ri' },
              { id: 'used', label: 'I përdorur' },
            ].map(f => (
              <button key={f.id} className={`flt ${activeFilter === f.id ? 'active' : ''}`} onClick={() => setActiveFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="section-hdr">
            <h3>🏷️ Shpalljet e dyqanit</h3>
            <span>{listings.length} produkte</span>
          </div>

          <div className="listings-grid">
            {listings.length === 0 ? (
              <div className="empty-shop">
                <i className="ti ti-package" />
                <p>Ky dyqan nuk ka shpallje aktive<br />momentalisht.</p>
              </div>
            ) : (
              listings.map(l => (
                <div key={l.id} className="listing-card" onClick={() => window.location.href = `/listing/${l.id}`}>
                  <div className="card-img">
                    {l.images?.[0] ? <img src={l.images[0]} alt={l.title} /> : <i className="ti ti-photo" />}
                    {l.condition === 'i_ri' && <span className="badge badge-new">I ri</span>}
                    {l.condition === 'i_perdorur' && <span className="badge badge-used">I përdorur</span>}
                    {l.is_premium && <span className="badge-prem">⭐</span>}
                  </div>
                  <div className="card-body">
                    <div className="card-title">{l.title}</div>
                    <div className="card-price">{fmt(l.price, l.currency)}</div>
                    <div className="card-loc"><i className="ti ti-map-pin" />{l.city || 'Shqipëri'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </>
  )
}
