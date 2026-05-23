'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ListingPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<any>(null)
  const [seller, setSeller] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    fetchListing()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function fetchListing() {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('id', params.id)
      .single()
    if (data) {
      setListing(data)
      supabase.from('listings').update({ views_count: (data.views_count || 0) + 1 }).eq('id', data.id)
      if (data.user_id) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user_id).single()
        if (p) setSeller(p)
      }
    }
    setLoading(false)
  }

  async function sendMessage() {
    if (!user) { window.location.href = '/auth/login'; return }
    if (!msg.trim()) return
    setSending(true)
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: listing.user_id,
      listing_id: listing.id,
      content: msg.trim(),
    })
    setSending(false)
    setSent(true)
    setMsg('')
  }

  const fmt = (price: number, cur: string) =>
    !price ? 'Çmim me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString('sq-AL')} €` : `${price.toLocaleString('sq-AL')} L`

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: 'inherit' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 10px' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <p style={{ color: '#888', fontSize: 13 }}>Duke ngarkuar...</p>
    </div>
  )

  if (!listing) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: "'Plus Jakarta Sans', system-ui" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
      <h2 style={{ color: '#111', marginBottom: 8 }}>Shpallja nuk u gjet</h2>
      <a href="/" style={{ color: '#E63312', fontSize: 13 }}>← Kthehu</a>
    </div>
  )

  const images = listing.images?.length ? listing.images : []

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#fff;min-height:100vh;padding-bottom:120px;}
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;flex:1;}
        .share-btn{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .share-btn i{font-size:16px;color:#111;}
        .img-wrap{width:100%;height:260px;background:#f9f5e0;display:flex;align-items:center;justify-content:center;position:relative;}
        .img-wrap img{width:100%;height:100%;object-fit:cover;}
        .img-ph{font-size:60px;}
        .img-dots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:5px;}
        .dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.5);}
        .dot.on{background:#fff;}
        .img-nav{position:absolute;top:50%;transform:translateY(-50%);width:32px;height:32px;background:rgba(0,0,0,.4);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .img-nav i{color:#fff;font-size:16px;}
        .like-btn{position:absolute;top:12px;right:12px;width:36px;height:36px;background:#fff;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);}
        .like-btn i{font-size:18px;color:#E63312;}
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
        .seller-card{margin:14px 0;background:#FFFBEA;border:0.5px solid #e0b030;border-radius:11px;padding:12px;}
        .seller-hdr{font-size:11px;font-weight:700;color:#888;margin-bottom:10px;}
        .seller-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
        .avatar{width:44px;height:44px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
        .seller-name{font-size:14px;font-weight:700;color:#111;}
        .seller-sub{font-size:11px;color:#888;}
        .seller-stats{display:flex;gap:12px;}
        .ss{text-align:center;}
        .ss-n{font-size:14px;font-weight:700;color:#111;}
        .ss-l{font-size:9px;color:#888;}
        .msg-box{border:1.5px solid #e0b030;border-radius:10px;padding:4px 4px 4px 12px;display:flex;align-items:center;gap:6px;margin-top:12px;}
        .msg-inp{flex:1;border:none;background:transparent;font-size:13px;font-family:inherit;outline:none;color:#111;}
        .msg-inp::placeholder{color:#bbb;}
        .msg-send{background:#E63312;color:#fff;border:none;border-radius:7px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;}
        .sent-ok{background:#EAF3DE;border:0.5px solid #97C459;border-radius:8px;padding:10px 14px;font-size:12px;color:#3B6D11;font-weight:600;text-align:center;margin-top:10px;}
        .bottom-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-top:1px solid #eee;padding:10px 14px;display:flex;gap:8px;z-index:100;}
        .chat-btn{flex:1;background:#E63312;color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;}
        .chat-btn i{font-size:18px;}
        .call-btn{width:48px;height:48px;background:#F5C842;border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .call-btn i{font-size:20px;color:#111;}
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <button className="back" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" />
          </button>
          <span className="topbar-title">Shpallja</span>
          <button className="share-btn" onClick={() => navigator.share?.({ title: listing.title, url: window.location.href })}>
            <i className="ti ti-share" />
          </button>
        </div>

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
                      <div key={i} className={`dot ${i === imgIdx ? 'on' : ''}`} onClick={() => setImgIdx(i)} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <span className="img-ph">📦</span>
          )}
          <button className="like-btn" onClick={() => setLiked(!liked)}>
            <i className={`ti ti-heart${liked ? '-filled' : ''}`} style={{ color: liked ? '#E63312' : '#ddd' }} />
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
            {listing.city && (
              <div className="meta-item">
                <i className="ti ti-map-pin" />{listing.city}
              </div>
            )}
            <div className="meta-item">
              <i className="ti ti-eye" />{listing.views_count || 0} shikime
            </div>
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

          {seller && (
            <>
              <div className="divider" />
              <div className="seller-card">
                <div className="seller-hdr">SHITËSI</div>
                <div className="seller-row">
                  <div className="avatar">
                    {seller.avatar_url ? <img src={seller.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : '👤'}
                  </div>
                  <div>
                    <div className="seller-name">{seller.full_name || seller.username || 'Shitës'}</div>
                    <div className="seller-sub">
                      {seller.city && `📍 ${seller.city} · `}
                      {seller.is_premium ? '👑 Premium' : 'Anëtar'}
                    </div>
                  </div>
                </div>

                {!sent ? (
                  <div className="msg-box">
                    <input
                      className="msg-inp"
                      placeholder="Dërgoji mesazh shitësit..."
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <button className="msg-send" onClick={sendMessage} disabled={sending}>
                      {sending ? '⏳' : 'Dërgo'}
                    </button>
                  </div>
                ) : (
                  <div className="sent-ok">✅ Mesazhi u dërgua! Shitësi do të kontaktojë.</div>
                )}
              </div>
            </>
          )}
        </div>

        {listing.user_id !== user?.id && (
          <div className="bottom-bar">
            <button className="chat-btn" onClick={() => {
              if (!user) { window.location.href = '/auth/login'; return }
              window.location.href = '/messages'
            }}>
              <i className="ti ti-message" />
              Kontakto shitësin
            </button>
            {seller?.phone && (
              <button className="call-btn" onClick={() => window.open(`tel:${seller.phone}`)}>
                <i className="ti ti-phone" />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
