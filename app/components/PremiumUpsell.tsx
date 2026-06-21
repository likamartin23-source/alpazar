'use client'

import { useState, useEffect } from 'react'

// ── Premium Upsell Modal ──────────────────────────────────────────────
// Shfaqet kur:
//  - trigger='scroll' → pas 40% scroll (faqja kryesore)
//  - trigger='limit'  → kur përdoruesi arrin kufirin falas
//  - trigger='exit'   → pas 25s inaktiviteti
export function PremiumUpsellModal({
  trigger = 'scroll',
  price = '9.99',
  onClose,
}: {
  trigger?: 'scroll' | 'limit' | 'exit'
  price?: string
  onClose?: () => void
}) {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [countdown, setCountdown] = useState(15 * 60) // 15 min offer countdown

  useEffect(() => {
    if (dismissed) return
    const key = `alpazar_upsell_${trigger}`
    const last = localStorage.getItem(key)
    if (last && Date.now() - parseInt(last) < 24 * 3600 * 1000) return // 1 herë në 24h

    if (trigger === 'scroll') {
      const handler = () => {
        const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight)
        if (scrolled > 0.4) { setShow(true); window.removeEventListener('scroll', handler) }
      }
      window.addEventListener('scroll', handler, { passive: true })
      return () => window.removeEventListener('scroll', handler)
    }
    if (trigger === 'exit') {
      const t = setTimeout(() => setShow(true), 25000)
      return () => clearTimeout(t)
    }
    if (trigger === 'limit') setShow(true)
  }, [trigger, dismissed])

  useEffect(() => {
    if (!show) return
    localStorage.setItem(`alpazar_upsell_${trigger}`, String(Date.now()))
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => { clearInterval(t); document.removeEventListener('keydown', onKey) }
  }, [show])

  function close() { setShow(false); setDismissed(true); onClose?.() }

  if (!show) return null

  const mins = Math.floor(countdown / 60).toString().padStart(2, '0')
  const secs = (countdown % 60).toString().padStart(2, '0')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aktivizo Premium"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 9999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'fadeIn .2s ease',
      }}
      onClick={close}
    >
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:none}}
        .ups-sheet{background:#FFFBEA;border-radius:24px 24px 0 0;padding:28px 20px 36px;width:100%;max-width:480px;animation:slideUp .25s ease;}
        .ups-close{position:absolute;top:14px;right:16px;width:30px;height:30px;background:#eee;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:#555;}
        .ups-crown{font-size:44px;display:block;text-align:center;margin-bottom:10px;}
        .ups-h{font-size:19px;font-weight:800;color:#111;text-align:center;margin-bottom:6px;}
        .ups-sub{font-size:12px;color:#888;text-align:center;margin-bottom:14px;line-height:1.6;}
        .ups-feats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;}
        .ups-feat{background:#fff;border:0.5px solid #eee;border-radius:10px;padding:10px 11px;display:flex;align-items:center;gap:7px;}
        .ups-feat i{font-size:14px;color:#E63312;}
        .ups-feat span{font-size:11px;font-weight:600;color:#333;}
        .ups-offer{background:#111;border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
        .ups-price{color:#F5C842;font-size:22px;font-weight:800;}
        .ups-price span{font-size:11px;color:#888;font-weight:400;display:block;}
        .ups-timer{background:#E63312;border-radius:8px;padding:6px 10px;text-align:center;}
        .ups-timer-n{color:#fff;font-size:18px;font-weight:800;font-variant-numeric:tabular-nums;}
        .ups-timer-l{color:rgba(255,255,255,.7);font-size:9px;}
        .ups-cta{width:100%;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:15px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:10px;box-shadow:0 4px 16px rgba(230,51,18,.4);}
        .ups-skip{width:100%;background:none;border:none;color:#aaa;font-size:12px;cursor:pointer;font-family:inherit;padding:4px;}
      `}</style>
      <div className="ups-sheet" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
        <button type="button" className="ups-close" aria-label="Mbyll" onClick={close}>✕</button>
        <span className="ups-crown" aria-hidden="true">👑</span>
        <div className="ups-h">Bëhu Premium Sot!</div>
        <div className="ups-sub">
          {trigger === 'limit'
            ? 'Ke arritur kufirin falas. Premium të hap mundësi të pakufizuara.'
            : 'Shpallja jote shfaqet e para. Biznes online. Badge verifikimi.'}
        </div>
        <div className="ups-feats">
          {[
            ['building-store', 'Biznes online'],
            ['infinity', 'Shpallje ∞'],
            ['shield-check', 'Badge ✓'],
            ['photo', 'Deri 20 foto'],
            ['star', 'Prioritet listimi'],
            ['chart-bar', 'Statistika live'],
          ].map(([icon, text]) => (
            <div key={icon} className="ups-feat">
              <i className={`ti ti-${icon}`} aria-hidden="true" />
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="ups-offer">
          <div className="ups-price">
            {price}€<span>/ muaj · Anulo kurdo</span>
          </div>
          {countdown > 0 && (
            <div className="ups-timer">
              <div className="ups-timer-n">{mins}:{secs}</div>
              <div className="ups-timer-l">Oferta skadon</div>
            </div>
          )}
        </div>
        <button type="button" className="ups-cta" onClick={() => { window.location.href = '/premium'; close() }}>
          👑 Aktivizo Premium Tani
        </button>
        <button type="button" className="ups-skip" onClick={close}>Tani jo, ndoshta më vonë</button>
      </div>
    </div>
  )
}

// ── Social Proof Bar ─────────────────────────────────────────────────
// Rreshti i vogël "X njerëz po shikojnë këtë shpallje tani"
export function SocialProofBar({ viewsCount, listingId }: { viewsCount: number; listingId: string }) {
  const [liveViewers, setLiveViewers] = useState(Math.floor(Math.random() * 4) + 1)

  useEffect(() => {
    // Simulate live viewers fluctuation every 15-40s
    const randomInterval = () => Math.floor(Math.random() * 25000) + 15000
    let t: ReturnType<typeof setTimeout>
    function tick() {
      setLiveViewers(v => Math.max(1, v + (Math.random() > 0.5 ? 1 : -1)))
      t = setTimeout(tick, randomInterval())
    }
    t = setTimeout(tick, randomInterval())
    return () => clearTimeout(t)
  }, [listingId])

  return (
    <div style={{
      background: '#FFF8EE', border: '0.5px solid #F5C842', borderRadius: 10,
      padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
    }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: Math.min(liveViewers, 4) }).map((_, i) => (
          <div key={i} style={{
            width: 22, height: 22, borderRadius: '50%', background: `hsl(${i * 40 + 20},70%,60%)`,
            border: '2px solid #FFF8EE', marginLeft: i ? -6 : 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
          }} aria-hidden="true">👤</div>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>
          {liveViewers} {liveViewers === 1 ? 'person' : 'persona'} po shikojnë tani
        </span>
        <span style={{ fontSize: 10, color: '#888', display: 'block' }}>
          <><span aria-hidden="true">👁</span> {viewsCount.toLocaleString()} shikime totale</>
        </span>
      </div>
      <span style={{
        background: '#E63312', color: '#fff', fontSize: 9, fontWeight: 700,
        padding: '3px 8px', borderRadius: 6, animation: 'pulse-dot 2s infinite',
      }}>LIVE</span>
      <style>{`@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.6}}`}</style>
    </div>
  )
}

// ── Premium Seller Upsell (në faqen e shpalljes, vetëm për shitësin) ─
export function SellerPremiumUpsell({ isPremium, price = '9.99' }: { isPremium: boolean; price?: string }) {
  const [visible, setVisible] = useState(true)
  if (!visible || isPremium) return null
  return (
    <div style={{
      background: 'linear-gradient(135deg,#111,#1c1c1c)', borderRadius: 14, padding: '14px 16px',
      marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12,
      border: '1px solid #F5C842',
    }}>
      <span style={{ fontSize: 28 }} aria-hidden="true">⚡</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#F5C842', fontSize: 12, fontWeight: 800, marginBottom: 3 }}>
          Shpallja jote shihet 5× më shumë me Premium
        </div>
        <div style={{ color: '#888', fontSize: 10, lineHeight: 1.5 }}>
          Shfaqet e para · Badge verifikimi · Biznes online
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <button
          type="button"
          onClick={() => window.location.href = '/premium'}
          style={{
            background: '#F5C842', color: '#111', border: 'none', borderRadius: 8,
            padding: '7px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <span aria-hidden="true">👑</span> {price}€/muaj
        </button>
        <button type="button" aria-label="Mbyll ofertën" onClick={() => setVisible(false)} style={{
          background: 'none', border: 'none', color: '#555', fontSize: 9, cursor: 'pointer',
        }}><><span aria-hidden="true">✕</span> Tani jo</></button>
      </div>
    </div>
  )
}

// ── Free Tier Limit Banner ───────────────────────────────────────────
export function FreeTierBanner({
  listingCount,
  freeLimit = 5,
  price = '9.99',
}: {
  listingCount: number
  freeLimit?: number
  price?: string
}) {
  const remaining = Math.max(0, freeLimit - listingCount)
  if (remaining > 2) return null
  const pct = ((freeLimit - remaining) / freeLimit) * 100

  return (
    <div style={{
      background: remaining === 0 ? '#FFF0EE' : '#FFF8EE',
      border: `1.5px solid ${remaining === 0 ? '#F09595' : '#F5C842'}`,
      borderRadius: 12, padding: '12px 14px', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: remaining === 0 ? '#E63312' : '#A05000' }}>
          {remaining === 0 ? <><span aria-hidden='true'>🚫</span> Ke arritur kufirin falas</> : <><span aria-hidden='true'>⚠️</span> {remaining} shpallje të mbetura falas</>}
        </span>
        <span style={{ fontSize: 10, color: '#888' }}>{listingCount}/{freeLimit}</span>
      </div>
      <div style={{ background: '#eee', borderRadius: 4, height: 6, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 4,
          background: remaining === 0 ? '#E63312' : '#F5C842', transition: 'width .5s',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: '#888', lineHeight: 1.5 }}>
          Premium → shpallje të pakufizuara + biznes online
        </span>
        <button
          type="button"
          onClick={() => window.location.href = '/premium'}
          style={{
            background: '#E63312', color: '#fff', border: 'none', borderRadius: 8,
            padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, marginLeft: 10,
          }}
        >
          <span aria-hidden="true">👑</span> {price}€/muaj
        </button>
      </div>
    </div>
  )
}
