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
  const [listing, setListing]     = useState<any>(null)
  const [seller, setSeller]       = useState<any>(null)
  const [sellerCount, setSellerCount] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [imgIdx, setImgIdx]       = useState(0)
  const [user, setUser]           = useState<any>(null)
  const [liked, setLiked]         = useState(false)
  const [albiTooltip, setAlbiTooltip] = useState(false)
  // Contact box
  const [contactMsg, setContactMsg] = useState('')
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    fetchListing()
  }, [])

  useEffect(() => {
    if (!loading && listing) {
      tooltipTimer.current = setTimeout(() => setAlbiTooltip(true), 4000)
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

  async function sendDirectMessage() {
    if (!user) { window.location.href = '/auth/login'; return }
    if (!contactMsg.trim() || !listing) return
    setSending(true)
    // First message includes listing title as opener so the seller has full context
    const fullContent = `📌 Shpallja: "${listing.title}"\n\n${contactMsg.trim()}`
    const { error } = await supabase.from('messages').insert({
      sender_id:   user.id,
      receiver_id: listing.user_id,
      listing_id:  listing.id,
      content:     fullContent,
    })
    setSending(false)
    if (!error) { setSent(true); setContactMsg('') }
  }

  function goToChat() {
    if (!user) { window.location.href = '/auth/login'; return }
    window.location.href = `/messages?with=${listing.user_id}`
  }

  const fmt = (price: number, cur: string) =>
    !price ? 'Çmim me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString('sq-AL')} €` : `${price.toLocaleString('sq-AL')} L`

  const memberSince = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' })
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{ width: 28, height: 28, border: '3px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 10px' }} />
    </div>
  )

  if (!listing) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: "'Plus Jakarta Sans',system-ui" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
      <h2 style={{ color: '#111', marginBottom: 8 }}>Shpallja nuk u gjet</h2>
      <a href="/" style={{ color: '#E63312', fontSize: 13 }}>← Kthehu</a>
    </div>
  )

  const images    = listing.images?.length ? listing.images : []
  const isOwner   = user?.id === listing.user_id
  const hasShop   = seller?.is_premium && seller?.shop_name
  const shopColor = CATEGORY_COLORS[seller?.shop_category] || '#E63312'
  const initials  = (seller?.shop_name || seller?.full_name || '?').slice(0, 2).toUpperCase()

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#fff;min-height:100vh;padding-bottom:110px;}

        /* Topbar */
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;flex:1;}
        .share-btn{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .share-btn i{font-size:16px;color:#111;}

        /* Gallery */
        .img-wrap{width:100%;height:250px;background:#f9f5e0;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
        .img-wrap img{width:100%;height:100%;object-fit:cover;}
        .img-dots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:5px;}
        .img-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.5);cursor:pointer;}
        .img-dot.on{background:#fff;}
        .img-nav{position:absolute;top:50%;transform:translateY(-50%);width:32px;height:32px;background:rgba(0,0,0,.4);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .img-nav i{color:#fff;font-size:16px;}
        .like-btn{position:absolute;top:12px;right:12px;width:36px;height:36px;background:#fff;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);}

        /* Info */
        .info{padding:14px;}
        .badges{display:flex;gap:5px;margin-bottom:9px;}
        .badge{font-size:10px;padding:3px 8px;border-radius:4px;font-weight:700;}
        .b-new{background:#E63312;color:#fff;}
        .b-used{background:#111;color:#F5C842;}
        .b-prem{background:#F5C842;color:#111;}
        h1{font-size:17px;font-weight:700;color:#111;margin-bottom:7px;line-height:1.35;}
        .price{font-size:22px;font-weight:800;color:#E63312;margin-bottom:12px;}
        .meta{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px;}
        .meta-item{display:flex;align-items:center;gap:4px;font-size:11.5px;color:#666;}
        .meta-item i{font-size:13px;color:#999;}
        .divider{height:1px;background:#f0f0f0;margin:13px 0;}
        .desc-title{font-size:12px;font-weight:700;color:#111;margin-bottom:7px;text-transform:uppercase;letter-spacing:.4px;}
        .desc{font-size:13px;color:#555;line-height:1.75;}

        /* ── SELLER BLOCK (compact header + details) ── */
        .seller-block{margin:14px 0;border:0.5px solid #e8e0cc;border-radius:14px;overflow:hidden;}

        /* Shop variant */
        .shop-header{height:56px;position:relative;display:flex;align-items:flex-end;padding:0 12px;}
        .shop-header-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
        .shop-header-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 20%,rgba(0,0,0,.3));}
        .shop-header-av{position:relative;z-index:1;margin-bottom:-20px;width:46px;height:46px;border-radius:50%;border:3px solid #fff;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.15);flex-shrink:0;}
        .shop-header-av img{width:100%;height:100%;object-fit:cover;}
        .shop-header-av-txt{font-size:16px;font-weight:700;}
        .seller-body{padding:24px 12px 12px;background:#FFFBEA;}
        .seller-name-row{display:flex;align-items:center;gap:6px;margin-bottom:3px;}
        .seller-title{font-size:14px;font-weight:700;color:#111;}
        .prem-badge{background:#F5C842;color:#111;font-size:8.5px;font-weight:700;padding:2px 6px;border-radius:8px;}
        .shop-badge{font-size:8.5px;font-weight:700;padding:2px 7px;border-radius:8px;display:inline-flex;align-items:center;gap:3px;}
        .seller-chips{display:flex;gap:6px;flex-wrap:wrap;margin:7px 0 10px;}
        .chip{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:#555;background:#fff;border:0.5px solid #ddd;padding:3px 9px;border-radius:10px;}
        .chip i{font-size:12px;color:#888;}
        .seller-desc{font-size:12px;color:#555;line-height:1.65;margin-bottom:10px;padding:8px 10px;background:#fff;border-radius:9px;border:0.5px solid #eee;}

        /* Profile variant — no banner */
        .profile-header{background:#FFFBEA;padding:12px;display:flex;align-items:center;gap:10px;}
        .profile-av{width:46px;height:46px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;overflow:hidden;border:2px solid #e0b030;}
        .profile-av img{width:100%;height:100%;object-fit:cover;}
        .profile-info{}
        .profile-name{font-size:14px;font-weight:700;color:#111;}
        .profile-sub{font-size:10.5px;color:#888;margin-top:2px;}
        .profile-body{padding:0 12px 12px;background:#FFFBEA;}

        /* Shared seller action row */
        .seller-actions{display:flex;gap:7px;margin-top:2px;}
        .seller-chat-btn{flex:1;background:#111;color:#F5C842;border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;}
        .seller-chat-btn i{font-size:15px;}
        .seller-call-btn{width:42px;height:42px;background:#EAF7ED;border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .seller-call-btn i{font-size:18px;color:#2E7D32;}
        .shop-link{display:flex;align-items:center;gap:8px;margin-top:9px;background:#fff;border:0.5px solid;border-radius:9px;padding:8px 11px;cursor:pointer;text-decoration:none;}
        .shop-link-txt{font-size:11.5px;font-weight:700;color:#111;}
        .shop-link-sub{font-size:9.5px;color:#aaa;margin-top:1px;}

        /* ── CONTACT BOX ── */
        .contact-box{margin:14px 0;border:1.5px solid #E63312;border-radius:14px;overflow:hidden;}
        .contact-box-hdr{background:linear-gradient(135deg,#E63312,#c42a0e);padding:10px 14px;display:flex;align-items:center;gap:8px;}
        .contact-box-hdr i{font-size:16px;color:#fff;}
        .contact-box-hdr span{font-size:12px;font-weight:700;color:#fff;}
        .contact-box-body{padding:12px;}
        .listing-ref{display:flex;align-items:center;gap:6px;background:#FFF0EE;border:0.5px solid #F5C3BB;border-radius:8px;padding:7px 10px;margin-bottom:10px;}
        .listing-ref i{font-size:13px;color:#E63312;flex-shrink:0;}
        .listing-ref span{font-size:11px;color:#333;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .contact-textarea{width:100%;border:1.5px solid #eee;border-radius:10px;padding:10px 12px;font-size:13px;font-family:inherit;outline:none;resize:none;min-height:80px;color:#111;background:#fafafa;transition:border-color .15s;}
        .contact-textarea:focus{border-color:#E63312;background:#fff;}
        .contact-textarea::placeholder{color:#bbb;}
        .contact-send-btn{width:100%;margin-top:9px;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:11px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 12px rgba(230,51,18,.3);transition:opacity .15s;}
        .contact-send-btn:disabled{opacity:.5;}
        .contact-send-btn i{font-size:18px;}
        /* Sent state */
        .sent-state{padding:16px;text-align:center;}
        .sent-icon{font-size:38px;margin-bottom:8px;}
        .sent-title{font-size:14px;font-weight:700;color:#111;margin-bottom:4px;}
        .sent-sub{font-size:11px;color:#888;margin-bottom:14px;line-height:1.6;}
        .open-chat-btn{background:#111;color:#F5C842;border:none;border-radius:10px;padding:11px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:7px;margin-bottom:8px;}
        .open-chat-btn i{font-size:16px;}
        .send-another{display:block;font-size:11px;color:#E63312;background:none;border:none;cursor:pointer;font-family:inherit;margin-top:4px;}

        /* Bottom bar */
        .bottom-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-top:1px solid #eee;padding:10px 14px;display:flex;gap:8px;z-index:100;}
        .main-chat-btn{flex:1;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 4px 12px rgba(230,51,18,.3);}
        .main-chat-btn i{font-size:17px;}

        /* Albi FAB */
        .albi-fab{position:fixed;bottom:82px;right:14px;z-index:200;display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
        .albi-tooltip{background:#111;color:#fff;font-size:11px;font-weight:600;padding:8px 13px;border-radius:14px;border-bottom-right-radius:4px;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.3);animation:fadeIn .3s ease;line-height:1.5;text-align:right;cursor:pointer;max-width:190px;}
        .albi-tooltip strong{color:#F5C842;display:block;font-size:12px;}
        .albi-btn{width:50px;height:50px;background:linear-gradient(135deg,#F5C842,#e0b030);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(245,200,66,.5);animation:pulse 2s infinite;}
        .albi-btn i{font-size:22px;color:#111;}
        @keyframes pulse{0%,100%{box-shadow:0 4px 14px rgba(245,200,66,.5)}50%{box-shadow:0 4px 22px rgba(245,200,66,.8),0 0 0 7px rgba(245,200,66,.12)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg);}}
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

        {/* Gallery */}
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
            <span style={{ fontSize: 60 }}>📦</span>
          )}
          <button className="like-btn" onClick={() => setLiked(l => !l)}>
            <i className={`ti ti-heart${liked ? '-filled' : ''}`} style={{ fontSize: 18, color: liked ? '#E63312' : '#ddd' }} />
          </button>
        </div>

        <div className="info">
          {/* Badges */}
          <div className="badges">
            {listing.condition === 'i_ri'       && <span className="badge b-new">I ri</span>}
            {listing.condition === 'i_perdorur' && <span className="badge b-used">I përdorur</span>}
            {listing.is_premium                 && <span className="badge b-prem">⭐ Premium</span>}
          </div>

          <h1>{listing.title}</h1>
          <div className="price">{fmt(listing.price, listing.currency)}</div>

          <div className="meta">
            {listing.city   && <div className="meta-item"><i className="ti ti-map-pin" />{listing.city}</div>}
            <div className="meta-item"><i className="ti ti-eye" />{listing.views_count || 0} shikime</div>
            <div className="meta-item"><i className="ti ti-calendar" />{new Date(listing.created_at).toLocaleDateString('sq-AL')}</div>
          </div>

          {listing.description && (
            <>
              <div className="divider" />
              <div className="desc-title">Përshkrimi</div>
              <div className="desc">{listing.description}</div>
            </>
          )}

          {/* ── SELLER BLOCK ── */}
          {seller && !isOwner && (
            <>
              <div className="divider" />

              <div className="seller-block">
                {hasShop ? (
                  /* Shop variant */
                  <>
                    <div className="shop-header" style={{ background: `linear-gradient(135deg,${shopColor}44,${shopColor}77)` }}>
                      {seller.shop_banner_url && (
                        <>
                          <img className="shop-header-bg" src={seller.shop_banner_url} alt="" />
                          <div className="shop-header-overlay" />
                        </>
                      )}
                      <div className="shop-header-av">
                        {seller.avatar_url
                          ? <img src={seller.avatar_url} alt={seller.shop_name} />
                          : <span className="shop-header-av-txt" style={{ color: shopColor }}>{initials}</span>}
                      </div>
                    </div>
                    <div className="seller-body">
                      <div className="seller-name-row">
                        <span className="seller-title">{seller.shop_name}</span>
                        <span className="prem-badge">⭐ Premium</span>
                      </div>
                      {seller.shop_category && (
                        <span className="shop-badge" style={{ background: shopColor + '18', color: shopColor }}>
                          <i className="ti ti-tag" style={{ fontSize: 10 }} />
                          {CATEGORY_LABELS[seller.shop_category] || seller.shop_category}
                        </span>
                      )}
                      <div className="seller-chips">
                        {seller.city     && <span className="chip"><i className="ti ti-map-pin" />{seller.city}</span>}
                        <span className="chip"><i className="ti ti-package" />{sellerCount} shpallje</span>
                        {seller.username && <span className="chip"><i className="ti ti-at" />{seller.username}</span>}
                        {seller.phone    && <span className="chip"><i className="ti ti-phone" />Ka telefon</span>}
                      </div>
                      {(seller.shop_description || seller.bio) && (
                        <div className="seller-desc">{seller.shop_description || seller.bio}</div>
                      )}
                      <div className="seller-actions">
                        <button className="seller-chat-btn" onClick={goToChat}>
                          <i className="ti ti-messages" /> Chat direkt
                        </button>
                        {seller.phone && (
                          <button className="seller-call-btn" onClick={() => window.open(`tel:${seller.phone}`)}>
                            <i className="ti ti-phone" />
                          </button>
                        )}
                      </div>
                      <a className="shop-link" href={`/dyqane/${seller.id}`} style={{ borderColor: shopColor + '44' }}>
                        <span style={{ fontSize: 20 }}>🏪</span>
                        <span>
                          <div className="shop-link-txt">Vizito dyqanin e plotë</div>
                          <div className="shop-link-sub">Shfleto të gjitha produktet</div>
                        </span>
                        <i className="ti ti-chevron-right" style={{ fontSize: 15, color: shopColor, marginLeft: 'auto' }} />
                      </a>
                    </div>
                  </>
                ) : (
                  /* Profile variant */
                  <>
                    <div className="profile-header">
                      <div className="profile-av">
                        {seller.avatar_url ? <img src={seller.avatar_url} alt="" /> : '👤'}
                      </div>
                      <div className="profile-info">
                        <div className="profile-name">{seller.full_name || seller.username || 'Shitës'}</div>
                        <div className="profile-sub">
                          {seller.city && `📍 ${seller.city}`}
                          {seller.city && seller.created_at && ' · '}
                          {seller.created_at && `Anëtar nga ${memberSince(seller.created_at)}`}
                        </div>
                      </div>
                    </div>
                    <div className="profile-body">
                      <div className="seller-chips">
                        <span className="chip"><i className="ti ti-package" />{sellerCount} shpallje aktive</span>
                        {seller.phone && <span className="chip"><i className="ti ti-phone" />Ka telefon</span>}
                        {seller.is_premium && <span className="chip" style={{ color: '#b8860b' }}>👑 Premium</span>}
                      </div>
                      {(seller.bio || seller.shop_description) && (
                        <div className="seller-desc">{seller.bio || seller.shop_description}</div>
                      )}
                      <div className="seller-actions">
                        <button className="seller-chat-btn" onClick={goToChat}>
                          <i className="ti ti-messages" /> Chat direkt
                        </button>
                        {seller.phone && (
                          <button className="seller-call-btn" onClick={() => window.open(`tel:${seller.phone}`)}>
                            <i className="ti ti-phone" />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ── CONTACT BOX ── */}
              <div className="contact-box">
                <div className="contact-box-hdr">
                  <i className="ti ti-send" />
                  <span>Dërgo mesazh te shitësi</span>
                </div>
                <div className="contact-box-body">
                  {sent ? (
                    <div className="sent-state">
                      <div className="sent-icon">✅</div>
                      <div className="sent-title">Mesazhi u dërgua!</div>
                      <div className="sent-sub">
                        Shitësi do të marrë mesazhin dhe do të kontaktojë.<br />
                        Mund ta ndiqni bisedën direkt.
                      </div>
                      <button className="open-chat-btn" onClick={goToChat}>
                        <i className="ti ti-messages" /> Hap bisedën
                      </button>
                      <button className="send-another" onClick={() => setSent(false)}>
                        + Dërgo mesazh tjetër
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Listing reference chip — seller sees which listing */}
                      <div className="listing-ref">
                        <i className="ti ti-bookmark" />
                        <span>Re: {listing.title}</span>
                      </div>

                      <textarea
                        className="contact-textarea"
                        rows={3}
                        placeholder="Shkruaj mesazhin tënd... p.sh. Jam i interesuar, a është ende në shitje?"
                        value={contactMsg}
                        onChange={e => setContactMsg(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) sendDirectMessage() }}
                        maxLength={500}
                      />

                      <button
                        className="contact-send-btn"
                        onClick={sendDirectMessage}
                        disabled={sending || !contactMsg.trim()}
                      >
                        {sending
                          ? <><i className="ti ti-loader-2" style={{ animation: 'spin .7s linear infinite' }} /> Duke dërguar...</>
                          : <><i className="ti ti-send" /> Dërgo Mesazhin</>
                        }
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      {!isOwner && (
        <div className="bottom-bar">
          <button className="main-chat-btn" onClick={goToChat}>
            <i className="ti ti-messages" />
            {hasShop ? `Chat · ${seller?.shop_name || 'dyqani'}` : 'Chat direkt me shitësin'}
          </button>
          {seller?.phone && (
            <button
              onClick={() => window.open(`tel:${seller.phone}`)}
              style={{ width: 50, height: 50, background: '#EAF7ED', border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <i className="ti ti-phone" style={{ fontSize: 19, color: '#2E7D32' }} />
            </button>
          )}
        </div>
      )}

      {/* Albi FAB */}
      <div className="albi-fab">
        {albiTooltip && (
          <div className="albi-tooltip" onClick={() => window.location.href = '/asistent'}>
            <strong>Albi 🤖 — AI Asistent</strong>
            Ke pyetje për këtë produkt?<br />Pyet Albin tani!
          </div>
        )}
        <button className="albi-btn" onClick={() => window.location.href = '/asistent'}>
          <i className="ti ti-robot" />
        </button>
      </div>
    </>
  )
}
