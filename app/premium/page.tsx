'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const REFERRAL_TARGET = 50

export default function PremiumPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [payMethod, setPayMethod] = useState('')
  const [payMethods, setPayMethods] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [referralCount, setReferralCount] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data: p }) => {
          setProfile(p)
          const codes = [...new Set([p.referral_code, p.username].filter(Boolean))] as string[]
          if (codes.length) {
            supabase.from('profiles').select('id', { count: 'exact', head: true })
              .in('referred_by', codes)
              .then(({ count }) => setReferralCount(count || 0))
          }
        })
      }
    })
    supabase.from('payment_methods').select('*').eq('is_active', true).then(({ data }) => {
      if (data) { setPayMethods(data); if (data[0]) setPayMethod(data[0].id) }
    })
  }, [])

  async function onPaymentSuccess(userId: string) {
    const { error } = await supabase.from('profiles').update({ is_premium: true }).eq('id', userId)
    if (error) {
      setMsg('err:Gabim gjatë aktivizimit. Kontakto support.')
      return
    }
    await supabase.auth.refreshSession()
    window.location.href = '/?premium=activated'
  }

  async function subscribe() {
    if (!user) { window.location.href = '/auth/login'; return }
    if (!payMethod) { setMsg('err:Zgjidh metodën e pagesës!'); return }
    setSubmitting(true); setMsg('')
    const amount = plan === 'monthly' ? 9.99 : 7.99
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + (plan === 'monthly' ? 1 : 12))

    const [{ error }, { error: reqErr }] = await Promise.all([
      supabase.from('premium_subscriptions').insert({
        user_id: user.id,
        plan,
        amount_eur: amount,
        period: plan === 'monthly' ? 1 : 12,
        end_date: endDate.toISOString(),
        payment_method: payMethod,
        status: 'pending',
      }),
      supabase.from('premium_requests').insert(
        { user_id: user.id, plan, status: 'pending' }
      ),
    ])
    if (error) { setMsg(`err:${error.message}`); setSubmitting(false); return }
    await supabase.auth.refreshSession()
    setMsg('ok:Kërkesa u dërgua! Admini do ta konfirmojë brenda 24 orësh.')
    setSubmitting(false)
  }

  const [mt, mm] = msg.split(/:(.+)/)

  const features = [
    { icon: 'building-store', text: 'Biznes online' },
    { icon: 'shield-check', text: 'Badge verifikimi ✓' },
    { icon: 'infinity', text: 'Shpallje të pakufizuara' },
    { icon: 'photo', text: 'Deri 20 foto për shpallje' },
    { icon: 'chart-bar', text: 'Statistika të avancuara' },
    { icon: 'star', text: 'Prioritet në listim' },
    { icon: 'crown', text: 'Badge Premium i dukshëm' },
    { icon: 'headset', text: 'Mbështetje prioritare' },
  ]

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:40px;}
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;}
        .hero{background:#111;padding:28px 20px;text-align:center;}
        .crown{font-size:52px;display:block;margin-bottom:10px;}
        .hero h1{color:#F5C842;font-size:22px;font-weight:700;margin-bottom:6px;}
        .hero p{color:#888;font-size:13px;line-height:1.6;}
        .body{padding:16px 12px;}
        .msg-box{border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:12px;font-weight:600;}
        .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
        .err{background:#FFF0EE;color:#E63312;border:0.5px solid #F09595;}
        .plan-row{display:flex;gap:10px;margin-bottom:16px;}
        .plan-card{flex:1;border:2px solid #ddd;border-radius:12px;padding:14px 10px;text-align:center;cursor:pointer;transition:all .15s;}
        .plan-card.active{border-color:#F5C842;background:#FFFBEA;}
        .plan-label{font-size:11px;font-weight:700;color:#888;margin-bottom:4px;}
        .plan-price{font-size:24px;font-weight:700;color:#111;}
        .plan-sub{font-size:10px;color:#aaa;margin-top:2px;}
        .plan-badge{background:#E63312;color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;display:inline-block;margin-top:5px;}
        .features{background:#fff;border-radius:12px;padding:16px;margin-bottom:14px;border:0.5px solid #eee;}
        .feat-title{font-size:13px;font-weight:700;color:#111;margin-bottom:12px;}
        .feat-row{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:0.5px solid #f5f5f5;}
        .feat-row:last-child{border:none;}
        .feat-row i{font-size:16px;color:#E63312;width:20px;}
        .feat-row span{font-size:12px;color:#333;}
        .payment-card{background:#fff;border-radius:12px;padding:16px;margin-bottom:14px;border:0.5px solid #eee;}
        .payment-title{font-size:13px;font-weight:700;color:#111;margin-bottom:12px;}
        .pm-opt{display:flex;align-items:center;gap:10px;padding:10px;border:1.5px solid #ddd;border-radius:9px;cursor:pointer;margin-bottom:8px;}
        .pm-opt.active{border-color:#F5C842;background:#FFFBEA;}
        .pm-opt i{font-size:20px;color:#888;}
        .pm-opt.active i{color:#E63312;}
        .pm-opt span{font-size:13px;color:#111;font-weight:500;}
        .pm-icon-map{font-size:20px;}
        .sub-btn{width:100%;background:#E63312;color:#fff;border:none;border-radius:12px;padding:15px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .15s;}
        .sub-btn:disabled{opacity:.6;cursor:not-allowed;}
        .note{font-size:11px;color:#aaa;text-align:center;margin-top:10px;line-height:1.6;}
        .already{background:#EAF3DE;border:0.5px solid #97C459;border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;}
        .already i{font-size:36px;color:#1D9E75;display:block;margin-bottom:8px;}
        .already strong{font-size:15px;font-weight:700;color:#1D9E75;display:block;margin-bottom:4px;}
        .already span{font-size:12px;color:#555;}
        .ref-milestone{background:linear-gradient(135deg,#1a0a00,#2d1400);border:1px solid #F5C84255;border-radius:12px;padding:16px;margin-bottom:14px;}
        .ref-m-title{color:#F5C842;font-size:13px;font-weight:700;margin-bottom:4px;}
        .ref-m-sub{color:#888;font-size:11px;margin-bottom:10px;}
        .ref-m-bar-bg{background:#333;border-radius:6px;height:8px;overflow:hidden;margin-bottom:6px;}
        .ref-m-bar-fill{height:100%;background:linear-gradient(90deg,#F5C842,#E63312);border-radius:6px;transition:width .5s;}
        .ref-m-meta{display:flex;justify-content:space-between;font-size:10px;color:#888;}
        .ref-m-cta{display:block;background:#F5C842;color:#111;border:none;border-radius:9px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;width:100%;margin-top:10px;text-align:center;text-decoration:none;font-family:inherit;}
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu mbrapa" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <span className="topbar-title"><span aria-hidden="true">👑</span> Premium</span>
        </div>

        <div className="hero">
          <span className="crown" aria-hidden="true">👑</span>
          <h1>Alpazar Premium</h1>
          <p>Shit më shumë, më shpejt.<br />Platforma e plotë profesionale në dorën tënde.</p>
        </div>

        <div className="body">
          {profile?.is_premium && (
            <div className="already">
              <i className="ti ti-crown" aria-hidden="true" />
              <strong>Je tashmë Premium! <span aria-hidden="true">👑</span></strong>
              <span>Gëzon të gjitha privilegjet e anëtarësisë Premium</span>
            </div>
          )}

          {msg && <div className={`msg-box ${mt}`} role="alert">{mm}</div>}

          <div role="radiogroup" aria-label="Zgjidhni planin" className="plan-row">
            <div role="radio" aria-checked={plan === 'monthly'} tabIndex={0} className={`plan-card ${plan === 'monthly' ? 'active' : ''}`} onClick={() => setPlan('monthly')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPlan('monthly') }}>
              <div className="plan-label">MUJOR</div>
              <div className="plan-price">9.99€</div>
              <div className="plan-sub">/ muaj</div>
            </div>
            <div role="radio" aria-checked={plan === 'yearly'} tabIndex={0} className={`plan-card ${plan === 'yearly' ? 'active' : ''}`} onClick={() => setPlan('yearly')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPlan('yearly') }}>
              <div className="plan-label">VJETOR</div>
              <div className="plan-price">7.99€</div>
              <div className="plan-sub">/ muaj · 95.88€/vit</div>
              <div className="plan-badge">Kurseni 20%</div>
            </div>
          </div>

          <div className="features">
            <h2 className="feat-title"><span aria-hidden="true">✅</span> Çfarë përfshihet</h2>
            {features.map((f, i) => (
              <div key={i} className="feat-row">
                <i className={`ti ti-${f.icon}`} aria-hidden="true" />
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {payMethods.length > 0 && (
            <div role="radiogroup" aria-labelledby="pm-label" className="payment-card">
              <div className="payment-title" id="pm-label">Metoda e pagesës</div>
              {payMethods.map(m => {
                const icons: Record<string, string> = { card: 'ti ti-credit-card', paypal: 'ti ti-brand-paypal', bank: 'ti ti-building-bank', mobile: 'ti ti-device-mobile' }
                return (
                  <div key={m.id} role="radio" aria-checked={payMethod === m.id} tabIndex={0} className={`pm-opt ${payMethod === m.id ? 'active' : ''}`} onClick={() => setPayMethod(m.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPayMethod(m.id) }}>
                    <i className={icons[m.type] || 'ti ti-wallet'} aria-hidden="true" />
                    <span>{m.name}</span>
                    {payMethod === m.id && <i className="ti ti-circle-check" style={{ marginLeft: 'auto', color: '#E63312' }} aria-hidden="true" />}
                  </div>
                )
              })}
            </div>
          )}

          <button type="button" className="sub-btn" onClick={subscribe} disabled={submitting || (profile?.is_premium || false)}>
            {profile?.is_premium ? '✅ Tashmë Premium' : submitting ? '⏳ Duke dërguar...' : `🚀 Abonohem — ${plan === 'monthly' ? '9.99€/muaj' : '95.88€/vit'}`}
          </button>

          <p className="note">
            Pagesa procesohet manualisht nga admini brenda 24 orësh.<br />
            Do të njoftoheni sapo llogaria juaj aktivizohet.
          </p>

          {/* Referral milestone CTA */}
          {user && !profile?.is_premium && (
            <div className="ref-milestone">
              <h2 className="ref-m-title"><span aria-hidden="true">🎁</span> Merr Premium FALAS!</h2>
              <div className="ref-m-sub">Fto {REFERRAL_TARGET} miq dhe fiton 1 muaj Premium pa pagesë.</div>
              <div className="ref-m-bar-bg">
                <div className="ref-m-bar-fill" style={{
                  width: `${Math.min(100, Math.round((referralCount / REFERRAL_TARGET) * 100))}%`
                }} />
              </div>
              <div className="ref-m-meta">
                <span>{referralCount} / {REFERRAL_TARGET} referalë</span>
                <span>{Math.max(0, REFERRAL_TARGET - referralCount)} mbetur</span>
              </div>
              <a href="/referral" className="ref-m-cta">
                🔗 Fto miq tani →
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
