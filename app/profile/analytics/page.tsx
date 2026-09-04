'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { SellerPremiumUpsell } from '../../components/PremiumUpsell'
import { dayMonthShort, dateShort } from '../../../lib/format'

const PERIODS = [
  { label: '7 ditë', days: 7 },
  { label: '30 ditë', days: 30 },
]

function fmt(n: number | null | undefined, cur?: string | null) {
  // BLLOKU I PËRMIRËSUAR §10 (rregullim i bug-ut "null ALL"): çmimi bosh/0 → tekst
  // marrëveshjeje; monedha bosh → "L" (jo kodi i papërpunuar "ALL"/"null").
  if (n == null || n === 0) return 'Çmim me marrëveshje'
  const sym = cur === 'EUR' ? '€' : 'L'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K ${sym}` : `${n} ${sym}`
}

function BarChart({ data, color = 'var(--az-red)' }: { data: { date: string; count: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const w = 100 / data.length
  return (
    <svg viewBox={`0 0 ${data.length * 10} 40`} style={{ width: '100%', height: 80, display: 'block' }} aria-hidden="true">
      {data.map((d, i) => {
        const h = (d.count / max) * 36
        return (
          <g key={d.date}>
            <rect x={i * 10 + 1} y={40 - h} width={8} height={h} rx={2} fill={color} opacity={0.85} />
          </g>
        )
      })}
    </svg>
  )
}

function HeatmapChart({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 8 }} aria-hidden="true">
      {data.map(d => {
        const intensity = d.count / max
        const bg = intensity === 0
          ? '#f5f5f5'
          : `rgba(230,51,18,${0.15 + intensity * 0.85})`
        return (
          <div key={d.hour} style={{ textAlign: 'center', flex: '1 0 calc(100%/8 - 3px)' }}>
            <div style={{
              height: 28, borderRadius: 5, background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: intensity > 0.5 ? '#fff' : '#888', fontWeight: 700,
            }}>
              {d.count > 0 ? d.count : ''}
            </div>
            <div style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>{d.hour}h</div>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const [user, setUser]         = useState<any>(null)
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
const [loadError, setLoadError] = useState(false)
  const [period, setPeriod]     = useState(30)
  const [showUpsell, setShowUpsell] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      fetchAnalytics(session.access_token, 30)
    })
    // Upsell 1 herë/sesion te analytics
    if (!sessionStorage.getItem('alpazar_upsell_shown')) {
      sessionStorage.setItem('alpazar_upsell_shown', '1')
      setShowUpsell(true)
    }
  }, [])

  async function fetchAnalytics(token: string, days: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setLoadError(true); return }
      const json = await res.json()
      setData(json)
    } catch {
      setLoadError(true)
    }
    setLoading(false)
  }

  async function changePeriod(days: number) {
    setPeriod(days)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) fetchAnalytics(session.access_token, days)
  }

  if (loadError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ fontSize: 36 }} aria-hidden="true">⚠️</div>
      <div style={{ fontWeight: 700, color: '#111' }}>Gabim gjatë ngarkimit</div>
      <button type="button" onClick={() => { setLoadError(false); changePeriod(period) }} style={{ background: 'var(--az-yellow)', border: 'none', borderRadius: 24, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Rifresko</button>
    </div>
  )

  if (!user || loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--az-red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
      <span style={{ fontSize: 13, color: '#555' }}>Duke ngarkuar analytics...</span>
    </div>
  )

  const hasData = data && data.top_listings?.length > 0

  return (
    <div className="an-wrap">
      <style dangerouslySetInnerHTML={{ __html: `
        .an-wrap{max-width:480px;margin:0 auto;padding:0 0 80px;font-family:'Segoe UI',sans-serif;background:#f8f8f8;min-height:100vh;}
        @media(min-width:768px){.an-wrap{max-width:760px}}
        @media(min-width:1024px){.an-wrap{max-width:100%;padding-left:clamp(32px,4vw,72px);padding-right:clamp(32px,4vw,72px)}}
        .an-card{background:#fff;border-radius:14px;padding:16px;margin:10px 12px;box-shadow:0 1px 4px rgba(0,0,0,.06);}
        .an-title{font-size:13px;font-weight:700;color:#4A4A4A;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;}
        .stat-row{display:flex;gap:10px;}
        .stat-box{flex:1;background:#f8f8f8;border-radius:10px;padding:12px;text-align:center;}
        .stat-num{font-size:24px;font-weight:800;color:#111;}
        .stat-lbl{font-size:11px;color:#555;margin-top:2px;}
        .period-row{display:flex;gap:6px;margin:12px 12px 0;}
        .period-btn{flex:1;padding:8px;min-height:44px;border-radius:9px;border:1.5px solid #eee;background:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
        .period-btn.active{background:var(--az-red);color:#fff;border-color:var(--az-red);}
        .listing-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f0f0;}
        .listing-row:last-child{border-bottom:none;}
        .listing-rank{width:22px;height:22px;border-radius:50%;background:#FFF0EE;color:#C42B0F;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .listing-name{flex:1;font-size:13px;font-weight:600;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .listing-stats{display:flex;gap:8px;font-size:11px;color:#888;flex-shrink:0;}
        .listing-stat{display:flex;align-items:center;gap:3px;}
        .ctr-pill{background:#E8F5E9;color:#2e7d32;border-radius:6px;padding:2px 6px;font-size:10px;font-weight:700;}
        .empty-state{text-align:center;padding:40px 20px;color:#555;}
        .topbar{display:flex;align-items:center;gap:10px;padding:14px 12px 10px;background:#fff;position:sticky;top:0;z-index:10;border-bottom:1px solid #f0f0f0;}
        .back-btn{width:44px;height:44px;border:none;background:#f5f5f5;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
      ` }} />

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      <div className="topbar">
        <button type="button" className="back-btn" aria-label="Kthehu në profil" onClick={() => window.location.href = '/profile'}>
          <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden="true" />
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 'var(--fs-xl)', color: '#111', margin: 0 }}>Statistikat e Shpalljeve</h1>
      </div>

      {/* Period selector */}
      <div className="period-row">
        {PERIODS.map(p => (
          <button key={p.days} type="button" className={`period-btn${period === p.days ? ' active' : ''}`} aria-pressed={period === p.days} onClick={() => changePeriod(p.days)}>
            {p.label}
          </button>
        ))}
      </div>

      {!hasData ? (
        <div className="an-card" style={{ margin: '20px 12px' }}>
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden="true">📊</div>
            <div style={{ fontWeight: 700, color: '#333', marginBottom: 8 }}>Ende nuk ka statistika</div>
            <div style={{ fontSize: 13 }}>Publiko shpallje dhe prit të akumulohen pamjet.</div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="an-card">
            <div className="an-title">Pasqyrë {period} ditë</div>
            <div className="stat-row">
              <div className="stat-box">
                <div className="stat-num">{data.total_views.toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">👁</span> Pamje</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{data.total_contacts}</div>
                <div className="stat-lbl"><span aria-hidden="true">💬</span> Kontaktime</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{data.total_views > 0 ? Math.round((data.total_contacts / data.total_views) * 100) : 0}%</div>
                <div className="stat-lbl"><span aria-hidden="true">🎯</span> CTR</div>
              </div>
            </div>
          </div>

          {/* Shtrirja (BLLOKU I PËRMIRËSUAR — gjurmim i ri): impresione në feed,
              reach (persona/pajisje unike), vizita (hapje shpalljeje). */}
          <div className="an-card">
            <div className="an-title">Shtrirja — {period} ditë</div>
            <div className="stat-row">
              <div className="stat-box">
                <div className="stat-num">{(data.impressions ?? 0).toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">📢</span> Impresione</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{(data.reach ?? 0).toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">👥</span> Arritje</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{data.total_views.toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">🔎</span> Vizita</div>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: '#555', marginTop: 8, lineHeight: 1.5 }}>
              Impresion = karta u pa në feed · Arritje = pajisje/persona unikë · Vizitë = shpallja u hap.
            </div>
          </div>

          {/* Audienca: ndjekës, të ruajtura, ndarje. */}
          <div className="an-card">
            <div className="an-title">Audienca — {period} ditë</div>
            <div className="stat-row">
              <div className="stat-box">
                <div className="stat-num">{(data.followers ?? 0).toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">🫂</span> Ndjekës</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{(data.saves ?? 0).toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">🔖</span> Të ruajtura</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{(data.shares ?? 0).toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">↗️</span> Ndarje</div>
              </div>
            </div>
          </div>

          {/* Kontakt i ndarë sipas kanalit. */}
          <div className="an-card">
            <div className="an-title">Kontakt sipas kanalit — {period} ditë</div>
            <div className="stat-row">
              <div className="stat-box">
                <div className="stat-num">{(data.contacts_whatsapp ?? 0).toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">🟢</span> WhatsApp</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{(data.contacts_viber ?? 0).toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">🟣</span> Viber</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{(data.contacts_phone ?? 0).toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">📞</span> Telefon</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{(data.notify ?? 0).toLocaleString()}</div>
                <div className="stat-lbl"><span aria-hidden="true">🔔</span> Njoftomë</div>
              </div>
            </div>
          </div>

          {/* Views per day chart */}
          {data.views_by_day?.length > 0 && (
            <div className="an-card">
              <div className="an-title">Pamjet për ditë</div>
              <BarChart data={data.views_by_day} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa', marginTop: 4 }}>
                <span>{dayMonthShort(data.views_by_day[0]?.date)}</span>
                <span>{dayMonthShort(data.views_by_day[data.views_by_day.length - 1]?.date)}</span>
              </div>
            </div>
          )}

          {/* Hourly heatmap */}
          {data.hourly?.some((h: any) => h.count > 0) && (
            <div className="an-card">
              <div className="an-title">Orët më aktive</div>
              <HeatmapChart data={data.hourly} />
            </div>
          )}

          {/* Top listings */}
          <div className="an-card">
            <div className="an-title">Shpalljet — Krahasim</div>
            {data.top_listings.slice(0, 10).map((l: any, i: number) => (
              <div key={l.id} className="listing-row" role="link" tabIndex={0} onClick={() => window.location.href = `/listing/${l.id}`} onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/listing/${l.id}` }} style={{ cursor: 'pointer' }} aria-label={`${l.title} — ${l.total_views} pamje, ${l.contacts} kontaktime`}>
                <div className="listing-rank">{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="listing-name">{l.title}</div>
                  <div style={{ fontSize: 11, color: '#C42B0F', fontWeight: 700 }}>{fmt(l.price, l.currency)}</div>
                </div>
                <div className="listing-stats">
                  <div className="listing-stat">
                    <i className="ti ti-eye" style={{ fontSize: 11 }} aria-hidden="true" />
                    {l.total_views}
                  </div>
                  <div className="listing-stat">
                    <i className="ti ti-message" style={{ fontSize: 11 }} aria-hidden="true" />
                    {l.contacts}
                  </div>
                  {l.ctr > 0 && <div className="ctr-pill">{l.ctr}%</div>}
                </div>
              </div>
            ))}
          </div>
          {/* Referral i integruar (BLLOKU I PËRMIRËSUAR §10): CTA te programi ekzistues,
              pa dyfishuar sistemin — thjesht hyrje nga analitika. */}
          <div className="an-card">
            <div className="an-title">Referral</div>
            <button type="button" onClick={() => { window.location.href = '/referral' }}
              style={{ width: '100%', minHeight: 48, background: 'linear-gradient(135deg,var(--az-ink),#000)', color: 'var(--az-yellow)', border: 'none', borderRadius: 11, fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <i className="ti ti-gift" aria-hidden="true" /> Fto miq — fito pikë & Premium →
            </button>
          </div>
        </>
      )}

      {showUpsell && <SellerPremiumUpsell isPremium={false} />}

      {/* Link nga profili */}
      <div style={{ textAlign: 'center', padding: '8px 0 20px', fontSize: 12, color: '#bbb' }}>
        Statistikat e Alpazar — {dateShort(new Date())}
      </div>
    </div>
  )
}
