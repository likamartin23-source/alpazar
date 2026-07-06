'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const REFERRAL_TARGET = 50
const AMOUNT_MONTHLY = 500
const AMOUNT_YEARLY = 5000
const DAYS_MONTHLY = 30
const DAYS_YEARLY = 365

export default function PremiumPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [payMethod, setPayMethod] = useState('')
  const [payMethods, setPayMethods] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [hasPending, setHasPending] = useState(false)

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
        supabase.from('premium_requests')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('status', 'pending')
          .then(({ count }) => setHasPending((count || 0) > 0))
      }
    })
    supabase.from('payment_methods').select('*').eq('is_active', true).then(({ data }) => {
      if (data) { setPayMethods(data); if (data[0]) setPayMethod(data[0].id) }
    })
  }, [])

  async function subscribe() {
    if (!user) { window.location.href = '/auth/login'; return }
    if (!payMethod) { setMsg('err:Zgjidh metodën e pagesës!'); return }
    if (hasPending) { setMsg('err:Keni tashmë një kërkesë në pritje.'); return }
    setSubmitting(true); setMsg('')

    const amount = plan === 'monthly' ? AMOUNT_MONTHLY : AMOUNT_YEARLY
    const days_requested = plan === 'monthly' ? DAYS_MONTHLY : DAYS_YEARLY

    const { error } = await supabase.from('premium_requests').insert({
      user_id: user.id,
      plan,
      payment_method_id: payMethod,
      amount,
      days_requested,
      status: 'pending',
    })

    if (error) { setMsg(`err:${error.message}`); setSubmitting(false); return }
    setHasPending(true)
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
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:40px;}
        .topbar{background:linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%);padding:10px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 16px -8px rgba(190,130,0,.4);}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;}
        .hero{background:linear-gradient(135deg,#151515 0%,#1c1c1c 60%,#231a0a 100%);padding:28px 20px;text-align:center;position:relative;overflow:hidden;}
        .hero::before{content:'';position:absolute;top:-30%;left:50%;transform:translateX(-50%);width:240px;height:240px;background:radial-gradient(circle,rgba(245,200,66,.18),transparent 68%);pointer-events:none;}
        .crown{font-size:52px;display:block;margin-bottom:10px;position:relative;}
        .hero h1{color:#F5C842;font-size:22px;font-weight:800;margin-bottom:6px;position:relative;}
        .hero p{color:#888;font-size:13px;line-height:1.6;}
        .body{padding:16px 12px;}
        .msg-box{border-radius:12px;padding:10px 14px;margin-bottom:14px;font-size:12px;font-weight:600;}
        .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
        .err{background:#FFF0EE;color:#E63312;border:0.5px solid #F09595;}
        .plan-row{display:flex;gap:10px;margin-bottom:16px;}
        .plan-card{flex:1;border:2px solid #ddd;border-radius:12px;padding:14px 10px;text-align:center;cursor:pointer;transition:all .15s;}
        .plan-card.active{border-color:#F5C842;background:#FFFBEA;}
        .plan-label{font-size:11px;font-weight:700;color:#888;margin-bottom:4px;}
        .plan-price{font-size:24px;font-weight:700;color:#111;}
        .plan-sub{font-size:10px;color:#aaa;margin-top:2px;}
        .plan-badge{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;display:inline-block;margin-top:5px;box-shadow:0 1px 4px rgba(230,51,18,.4);}
        .features{background:#fff;border-radius:12px;padding:16px;margin-bottom:14px;border:0.5px solid #ececec;box-shadow:0 1px 2px rgba(0,0,0,.04),0 6px 16px -10px rgba(0,0,0,.12);}
        .feat-title{font-size:13px;font-weight:700;color:#111;margin-bottom:12px;}
        .feat-row{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:0.5px solid #f5f5f5;}
        .feat-row:last-child{border:none;}
        .feat-row i{font-size:16px;color:#E63312;width:20px;}
        .feat-row span{font-size:12px;color:#333;}
        .payment-card{background:#fff;border-radius:12px;padding:16px;margin-bottom:14px;border:0.5px solid #ececec;box-shadow:0 1px 2px rgba(0,0,0,.04),0 6px 16px -10px rgba(0,0,0,.12);}
        .payment-title{font-size:13px;font-weight:700;color:#111;margin-bottom:12px;}
        .pm-opt{display:flex;align-items:center;gap:10px;padding:11px;border:1.5px solid #e0e0e0;border-radius:12px;cursor:pointer;margin-bottom:8px;transition:border-color .15s ease,background .15s ease;}
        .pm-opt.active{border-color:#F5C842;background:#FFFBEA;}
        .pm-opt i{font-size:20px;color:#888;}
        .pm-opt.active i{color:#E63312;}
        .pm-opt span{font-size:13px;color:#111;font-weight:500;}
        .sub-btn{width:100%;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:15px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px -3px rgba(230,51,18,.45);transition:transform .15s ease,box-shadow .15s ease;}
        .sub-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 7px 20px -4px rgba(230,51,18,.55);}
        .sub-btn:disabled{opacity:.6;cursor:not-allowed;box-shadow:none;}
        .note{font-size:11px;color:#aaa;text-align:center;margin-top:10px;line-height:1.6;}
        .already{background:#EAF3DE;border:0.5px solid #97C459;border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;}
        .already i{font-size:36px;color:#1D9E75;display:block;margin-bottom:8px;}
        .already strong{font-size:15px;font-weight:700;color:#1D9E75;display:block;margin-bottom:4px;}
        .already span{font-size:12px;color:#555;}
        .pending-box{background:#FAEEDA;border:0.5px solid #F5C842;border-radius:12px;padding:16px;text-align:center;margin-bottom:16px;}
        .pending-box strong{font-size:14px;font-weight:700;color:#BA7517;display:block;margin-bottom:4px;}
        .pending-box span{font-size:12px;color:#7a5a1a;}
        .ref-milestone{background:linear-gradient(135deg,#1a0a00,#2d1400);border:1px solid #F5C84255;border-radius:12px;padding:16px;margin-bottom:14px;}
        .ref-m-title{color:#F5C842;font-size:13px;font-weight:700;margin-bottom:4px;}
        .ref-m-sub{color:#888;font-size:11px;margin-bottom:10px;}
        .ref-m-bar-bg{background:#333;border-radius:6px;height:8px;overflow:hidden;margin-bottom:6px;}
        .ref-m-bar-fill{height:100%;background:linear-gradient(90deg,#F5C842,#E63312);border-radius:6px;transition:width .5s;}
        .ref-m-meta{display:flex;justify-content:space-between;font-size:10px;color:#888;}
        .ref-m-cta{display:block;background:linear-gradient(135deg,#F8D24E,#F5C842);color:#111;border:none;border-radius:12px;padding:11px;font-size:12px;font-weight:700;cursor:pointer;width:100%;margin-top:10px;text-align:center;text-decoration:none;font-family:inherit;box-shadow:0 2px 8px -2px rgba(245,200,66,.5);}
      ` }} />

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

          {hasPending && !profile?.is_premium && (
            <div className="pending-box">
              <strong><span aria-hidden="true">⏳</span> Kërkesa juaj është në pritje</strong>
              <span>Admini do ta konfirmojë brenda 24 orësh. Do të njoftoheni kur llogaria aktivizohet.</span>
            </div>
          )}

          {msg && <div className={`msg-box ${mt}`} role="alert">{mm}</div>}

          <div role="radiogroup" aria-label="Zgjidhni planin" className="plan-row">
            <div role="radio" aria-checked={plan === 'monthly'} tabIndex={0} className={`plan-card ${plan === 'monthly' ? 'active' : ''}`} onClick={() => setPlan('monthly')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPlan('monthly') }}>
              <div className="plan-label">MUJOR</div>
              <div className="plan-price">{AMOUNT_MONTHLY} ALL</div>
              <div className="plan-sub">/ muaj · {DAYS_MONTHLY} ditë</div>
            </div>
            <div role="radio" aria-checked={plan === 'yearly'} tabIndex={0} className={`plan-card ${plan === 'yearly' ? 'active' : ''}`} onClick={() => setPlan('yearly')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setPlan('yearly') }}>
              <div className="plan-label">VJETOR</div>
              <div className="plan-price">{AMOUNT_YEARLY} ALL</div>
              <div className="plan-sub">/ vit · {DAYS_YEARLY} ditë</div>
              <div className="plan-badge">Kurseni 17%</div>
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

          {!profile?.is_premium && !hasPending && (
            <>
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

              <button type="button" className="sub-btn" onClick={subscribe} disabled={submitting}>
                {submitting ? <><span aria-hidden="true">⏳</span> Duke dërguar...</> : <><span aria-hidden="true">🚀</span> Kërko Premium — {plan === 'monthly' ? `${AMOUNT_MONTHLY} ALL/muaj` : `${AMOUNT_YEARLY} ALL/vit`}</>}
              </button>

              <p className="note">
                Pagesa procesohet manualisht nga admini brenda 24 orësh.<br />
                Do të njoftoheni sapo llogaria juaj aktivizohet.
              </p>
            </>
          )}

          {profile?.is_premium && (
            <button type="button" className="sub-btn" disabled style={{ opacity: 0.6 }}>
              <span aria-hidden="true">✅</span> Tashmë Premium
            </button>
          )}

          {/* Referral milestone CTA */}
          {user && !profile?.is_premium && (
            <div className="ref-milestone" style={{ marginTop: 16 }}>
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
                <><span aria-hidden="true">🔗</span> Fto miq tani →</>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
