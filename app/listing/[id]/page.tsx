'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

const CATEGORY_COLORS: Record<string, string> = {
  elektronike: '#3B82F6', makina: '#EF4444', shtepi: '#10B981',
  veshje: '#8B5CF6', sport: '#F59E0B', sherbime: '#06B6D4',
  femije: '#EC4899', bukuri: '#F97316',
}

const CATEGORY_LABELS: Record<string, string> = {
  elektronike: 'Elektronikë', makina: 'Makina', shtepi: 'Shtëpi & Mobilje',
  veshje: 'Veshje & Aksesore', sport: 'Sport & Hobi', sherbime: 'Shërbime',
  femije: 'Fëmijë', bukuri: 'Bukuri & Kujdes',
}

export default function ListingPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<any>(null)
  const [seller, setSeller] = useState<any>(null)
  const [sellerCount, setSellerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [albiTooltip, setAlbiTooltip] = useState(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    fetchListing()
  }, [])

  useEffect(() => {
    if (!loading && listing) {
      tooltipTimer.current = setTimeout(() => setAlbiTooltip(true), 3000)
      return () => clearTimeout(tooltipTimer.current)
    }
  }, [loading, listing])

  async function fetchListing() {
    const { data } = await supabase.from('listings').select('*').eq('id', params.id).single()
    if (data) {
      setListing(data)
      supabase.rpc('increment_listing_views', { lid: data.id })
      if (data.user_id) {
        const [{ data: p }, { count }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', data.user_id).single(),
          supabase.from('listings').select('*', { count: 'exact', head: true })
            .eq('user_id', data.user_id).eq('is_active', true),
        ])
        if (p) setSeller(p)
        if (count !== null) setSellerCount(count)
      }
    }
    setLoading(false)
  }

  function goToChat() {
    if (!user) { window.location.href = '/auth/login'; return }
    window.location.href = `/messages?with=${listing.user_id}`
  }

  const fmt = (price: number, cur: string) =>
    !price ? 'Çmim me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString('sq-AL')} €` : `${price.toLocaleString('sq-AL')} L`

  const memberSince = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `Anëtar që nga ${d.toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' })}`
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: 'inherit' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 10px' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )

  if (!listing) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: "'Plus Jakarta Sans',system-ui" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
      <h2 style={{ color: '#111', marginBottom: 8 }}>Shpallja nuk u gjet</h2>
      <a href="/" style={{ color: '#E63312', fontSize: 13 }}>← Kthehu</a>
    </div>
  )

  const images = listing.images?.length ? listing.images : []
  const isOwner = user?.id === listing.user_id
  const hasShop = seller?.is_premium && seller?.shop_name
  const shopColor = CATEGORY_COLORS[seller?.shop_category] || '#E63312'
  const initials = (seller?.shop_name || seller?.full_name || '?').slice(0, 2).toUpperCase()

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#fff;min-height:100vh;padding-bottom:100px;}

        /* Topbar */
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;flex:1;}
        .share-btn{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .share-btn i{font-size:16px;color:#111;}

        /* Gallery */
        .img-wrap{width:100%;height:260px;background:#f9f5e0;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
        .img-wrap img{width:100%;height:100%;object-fit:cover;}
        .img-ph{font-size:60px;}
        .img-dots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:5px;}
        .img-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.5);cursor:pointer;}
        .img-dot.on{background:#fff;}
        .img-nav{position:absolute;top:50%;transform:translateY(-50%);width:32px;height:32px;background:rgba(0,0,0,.4);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .img-nav i{color:#fff;font-size:16px;}
        .like-btn{position:absolute;top:12px;right:12px;width:36px;height:36px;background:#fff;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);}

        /* Info */
        .info{padding:16px;}
        .badges{display:flex;gap:5px;margin-bottom:10px;}
        .badge{font-size:10px;padding:3px 8px;border-radius:4px;font-weight:700;}
        .b-new{background:#E63312;color:#fff;}
        .b-used{background:#111;color:#F5C842;}
        .b-prem{background:#F5C842;color:#111;}
        h1{font-size:18px;font-weight:700;color:#111;margin-bottom:8px;line-height:1.3;}
        .price{font-size:24px;font-weight:700;color:#E63312;margin-bottom:14px;}
        .meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}
        .meta-item{display:flex;align-items:center;gap:5px;font-size:12px;color:#666;}
        .meta-item i{font-size:14px;color:#888;}
        .divider{height:1px;background:#f0f0f0;margin:14px 0;}
        .desc-title{font-size:13px;font-weight:700;color:#111;margin-bottom:8px;}
        .desc{font-size:13px;color:#555;line-height:1.7;}

        /* ── SHOP SELLER CARD ── */
        .shop-card{margin:14px 0;border-radius:14px;overflow:hidden;border:0.5px solid #e8e0cc;}
        .shop-banner{height:70px;position:relative;display:flex;align-items:flex-end;padding:0 12px 0;}
        .shop-banner-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
        .shop-banner-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,rgba(0,0,0,.35));}
        .shop-avatar-wrap{position:relative;z-index:1;margin-bottom:-22px;}
        .shop-av{width:52px;height:52px;border-radius:50%;border:3px solid #fff;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.15);}
        .shop-av img{width:100%;height:100%;object-fit:cover;}
        .shop-av-txt{font-size:18px;font-weight:700;}
        .shop-body{padding:26px 12px 12px;background:#FFFBEA;}
        .shop-name-row{display:flex;align-items:center;gap:7px;margin-bottom:4px;}
        .shop-title{font-size:15px;font-weight:700;color:#111;}
        .prem-badge{background:#F5C842;color:#111;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;}
        .shop-cat{font-size:11px;font-weight:600;padding:3px 9px;border-radius:10px;margin-bottom:8px;display:inline-flex;align-items:center;gap:4px;}
        .shop-desc-txt{font-size:12px;color:#555;line-height:1.65;margin-bottom:10px;}
        .shop-stats{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;}
        .stat-chip{display:flex;align-items:center;gap:5px;font-size:11px;color:#666;background:#fff;border:0.5px solid #e8e0cc;padding:4px 10px;border-radius:10px;}
        .stat-chip i{font-size:13px;}

        /* ── PROFILE SELLER CARD ── */
        .profile-card{margin:14px 0;background:#FFFBEA;border:0.5px solid #e0b030;border-radius:14px;padding:14px;}
        .profile-hdr-row{display:flex;align-items:center;gap:11px;margin-bottom:12px;}
        .profile-av{width:52px;height:52px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;overflow:hidden;border:2px solid #e0b030;}
        .profile-av img{width:100%;height:100%;object-fit:cover;}
        .profile-name{font-size:15px;font-weight:700;color:#111;}
        .profile-sub{font-size:11px;color:#888;margin-top:3px;line-height:1.5;}
        .profile-bio{font-size:12px;color:#555;line-height:1.65;margin-bottom:10px;padding:9px 11px;background:#fff;border-radius:9px;border:0.5px solid #eee;}
        .profile-stats{display:flex;gap:8px;margin-bottom:12px;}
        .stat-chip-profile{display:flex;align-items:center;gap:5px;font-size:11px;color:#666;background:#fff;border:0.5px solid #eee;padding:4px 10px;border-radius:10px;}
        .stat-chip-profile i{font-size:13px;}

        /* Shared contact buttons */
        .contact-btns{display:flex;gap:8px;}
        .chat-btn-main{flex:1;background:linear-gradient(135deg,#111,#222);color:#F5C842;border:none;border-radius:11px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;font-family:inherit;}
        .chat-btn-main i{font-size:17px;}
        .call-btn-sm{width:46px;height:46px;background:#EAF7ED;border:none;border-radius:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .call-btn-sm i{font-size:19px;color:#2E7D32;}
        .shop-visit-btn{display:flex;align-items:center;gap:9px;margin-top:10px;background:#fff;border:0.5px solid;border-radius:10px;padding:10px 13px;cursor:pointer;text-decoration:none;transition:background .12s;}
        .shop-visit-btn:active{background:#f9f5e0;}
        .shop-visit-txt .name{font-size:12px;font-weight:700;color:#111;}
        .shop-visit-txt .sub{font-size:10px;color:#aaa;margin-top:1px;}

        /* Bottom bar */
        .bottom-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-top:1px solid #eee;padding:10px 14px;display:flex;gap:8px;z-index:100;}
        .main-chat-btn{flex:1;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 12px rgba(230,51,18,.3);}
        .main-chat-btn i{font-size:18px;}

        /* Albi FAB */
        .albi-fab{position:fixed;bottom:80px;right:14px;z-index:200;display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
        .albi-tooltip{background:#111;color:#fff;font-size:11px;font-weight:600;padding:8px 13px;border-radius:14px;border-bottom-right-radius:4px;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.3);animation:fadeIn .3s ease;line-height:1.5;text-align:right;cursor:pointer;max-width:190px;}
        .albi-tooltip strong{color:#F5C842;display:block;font-size:12px;}
        .albi-btn{width:52px;height:52px;background:linear-gradient(135deg,#F5C842,#e0b030);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(245,200,66,.5);animation:pulse 2s infinite;}
        .albi-btn i{font-size:24px;color:#111;}
        @keyframes pulse{0%,100%{box-shadow:0 4px 16px rgba(245,200,66,.5)}50%{box-shadow:0 4px 24px rgba(245,200,66,.8),0 0 0 8px rgba(245,200,66,.15)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <button className="back" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" />
          </button>
          <span className="topbar-title">Shpallja</span>
          <button className="share-btn" onClick={() => navigator.share?.({ title: listing.title, url: window.location.href }).catch(() => {})}>
            <i className="ti ti-share" />
          </button>
        </div>

        {/* Image gallery */}
        <div className="img-wrap">
          {images.length > 0 ? (
            <>
              <img src={images[imgIdx]} alt={listing.title} />
              {images.length > 1 && (
                <>
                  <button className="img-nav" style={{ left: 10 }} onClick={() => setImgIdx(i => Math.max(0, i - 1))}>
                    <i className="ti ti-chevron-left" />
                  </button>
                  <button className="img-nav" style={{ right: 10 }} onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}>
                    <i className="ti ti-chevron-right" />
                  </button>
                  <div className="img-dots">
                    {images.map((_: any, i: number) => (
                      <div key={i} className={`img-dot ${i === imgIdx ? 'on' : ''}`} onClick={() => setImgIdx(i)} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <span className="img-ph">📦</span>
          )}
          <button className="like-btn" onClick={() => setLiked(l => !l)}>
            <i className={`ti ti-heart${liked ? '-filled' : ''}`} style={{ fontSize: 18, color: liked ? '#E63312' : '#ddd' }} />
          </button>
        </div>

        <div className="info">
          <div className="badges">
            {listing.condition === 'i_ri' && <span className="badge b-new">I ri</span>}
            {listing.condition === 'i_perdorur' && <span className="badge b-used">I përdorur</span>}
            {listing.is_premium && <span className="badge b-prem">⭐ Premium</span>}
          </div>

          <h1>{listing.title}</h1>
          <div className="price">{fmt(listing.price, listing.currency)}</div>

          <div className="meta">
            {listing.city && <div className="meta-item"><i className="ti ti-map-pin" />{listing.city}</div>}
            <div className="meta-item"><i className="ti ti-eye" />{listing.views_count || 0} shikime</div>
            <div className="meta-item">
              <i className="ti ti-calendar" />
              {new Date(listing.created_at).toLocaleDateString('sq-AL')}
            </div>
          </div>

          {listing.description && (
            <>
              <div className="divider" />
              <div className="desc-title">Përshkrimi</div>
              <div className="desc">{listing.description}</div>
            </>
          )}

          {/* ── SELLER / SHOP BLOCK ── */}
          {seller && !isOwner && (
            <>
              <div className="divider" />

              {hasShop ? (
                /* ── SHOP CARD for premium sellers with shop ── */
                <div className="shop-card">
                  {/* Banner */}
                  <div className="shop-banner" style={{ background: `linear-gradient(135deg, ${shopColor}44, ${shopColor}77)` }}>
                    {seller.shop_banner_url && (
                      <>
                        <img className="shop-banner-img" src={seller.shop_banner_url} alt="" />
                        <div className="shop-banner-overlay" />
                      </>
                    )}
                    <div className="shop-avatar-wrap">
                      <div className="shop-av">
                        {seller.avatar_url
                          ? <img src={seller.avatar_url} alt={seller.shop_name} />
                          : <span className="shop-av-txt" style={{ color: shopColor }}>{initials}</span>
                        }
                      </div>
                    </div>
                  </div>

                  <div className="shop-body">
                    {/* Shop name + premium badge */}
                    <div className="shop-name-row">
                      <span className="shop-title">{seller.shop_name}</span>
                      <span className="prem-badge">⭐ Premium</span>
                    </div>

                    {/* Category */}
                    {seller.shop_category && (
                      <span className="shop-cat" style={{ background: shopColor + '18', color: shopColor }}>
                        <i className="ti ti-tag" />
                        {CATEGORY_LABELS[seller.shop_category] || seller.shop_category}
                      </span>
                    )}

                    {/* Description */}
                    {(seller.shop_description || seller.bio) && (
                      <p className="shop-desc-txt">{seller.shop_description || seller.bio}</p>
                    )}

                    {/* Stats chips */}
                    <div className="shop-stats">
                      {seller.city && (
                        <span className="stat-chip"><i className="ti ti-map-pin" />{seller.city}</span>
                      )}
                      <span className="stat-chip"><i className="ti ti-package" />{sellerCount} shpallje</span>
                      {seller.username && (
                        <span className="stat-chip"><i className="ti ti-at" />{seller.username}</span>
                      )}
                    </div>

                    {/* Contact buttons */}
                    <div className="contact-btns">
                      <button className="chat-btn-main" onClick={goToChat}>
                        <i className="ti ti-message-circle" /> Chat me dyqanin
                      </button>
                      {seller.phone && (
                        <button className="call-btn-sm" onClick={() => window.open(`tel:${seller.phone}`)}>
                          <i className="ti ti-phone" />
                        </button>
                      )}
                    </div>

                    {/* Visit shop link */}
                    <a className="shop-visit-btn" href={`/dyqane/${seller.id}`} style={{ borderColor: shopColor + '55' }}>
                      <span style={{ fontSize: 22 }}>🏪</span>
                      <span className="shop-visit-txt">
                        <div className="name">Vizito dyqanin e plotë</div>
                        <div className="sub">Shfleto të gjitha produktet</div>
                      </span>
                      <i className="ti ti-chevron-right" style={{ fontSize: 16, color: shopColor, marginLeft: 'auto' }} />
                    </a>
                  </div>
                </div>

              ) : (
                /* ── PROFILE CARD for regular sellers ── */
                <div className="profile-card">
                  <div className="profile-hdr-row">
                    <div className="profile-av">
                      {seller.avatar_url
                        ? <img src={seller.avatar_url} alt={seller.full_name} />
                        : '👤'}
                    </div>
                    <div>
                      <div className="profile-name">{seller.full_name || seller.username || 'Shitës'}</div>
                      <div className="profile-sub">
                        {seller.city && `📍 ${seller.city}`}
                        {seller.city && seller.created_at && ' · '}
                        {seller.created_at && memberSince(seller.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {(seller.bio || seller.shop_description) && (
                    <div className="profile-bio">{seller.bio || seller.shop_description}</div>
                  )}

                  {/* Stats */}
                  <div className="profile-stats">
                    <span className="stat-chip-profile">
                      <i className="ti ti-package" />{sellerCount} shpallje aktive
                    </span>
                    {seller.phone && (
                      <span className="stat-chip-profile">
                        <i className="ti ti-device-mobile" />Ka numër telefoni
                      </span>
                    )}
                  </div>

                  {/* Contact buttons */}
                  <div className="contact-btns">
                    <button className="chat-btn-main" onClick={goToChat}>
                      <i className="ti ti-message-circle" /> Chat direkt me shitësin
                    </button>
                    {seller.phone && (
                      <button className="call-btn-sm" onClick={() => window.open(`tel:${seller.phone}`)}>
                        <i className="ti ti-phone" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      {!isOwner && (
        <div className="bottom-bar">
          <button className="main-chat-btn" onClick={goToChat}>
            <i className="ti ti-message-circle" />
            {hasShop ? `Chat me ${seller?.shop_name || 'dyqanin'}` : 'Kontakto shitësin'}
          </button>
          {seller?.phone && (
            <button
              onClick={() => window.open(`tel:${seller.phone}`)}
              style={{ width: 52, height: 52, background: '#EAF7ED', border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <i className="ti ti-phone" style={{ fontSize: 20, color: '#2E7D32' }} />
            </button>
          )}
        </div>
      )}

      {/* Albi AI floating assistant */}
      <div className="albi-fab">
        {albiTooltip && (
          <div className="albi-tooltip" onClick={() => window.location.href = '/asistent'}>
            <strong>Albi 🤖 — AI Asistent</strong>
            Ke pyetje për këtë produkt?<br />Pyet Albin tani!
          </div>
        )}
        <button className="albi-btn" onClick={() => window.location.href = '/asistent'} title="Pyet Albin — AI Asistent">
          <i className="ti ti-robot" />
        </button>
      </div>
    </>
  )
}
