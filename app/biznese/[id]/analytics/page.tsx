'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

// Analitika e VET e biznesit (spec: paneli i biznesit → "Analitika (pa referral)").
// Ana e biznesit, e ndarë nga paneli i përdoruesit. Vetëm-pronar. Të dhënat vijnë nga
// /api/analytics?biz=<id> (i verifikuar server-side; shpalljet sipas business_id; PA
// analytics_extra/referral — ato janë ekskluzivitet i llogarisë personale).

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <svg viewBox={`0 0 ${Math.max(data.length, 1) * 10} 40`} style={{ width: '100%', height: 80, display: 'block' }} aria-hidden="true">
      {data.map((d, i) => {
        const h = (d.count / max) * 36
        return <rect key={d.date} x={i * 10 + 1} y={40 - h} width={8} height={h} rx={2} fill="var(--az-red)" opacity={0.85} />
      })}
    </svg>
  )
}

function Heatmap({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 8 }} aria-hidden="true">
      {data.map(d => {
        const intensity = d.count / max
        const bg = intensity === 0 ? '#f5f5f5' : `rgba(230,51,18,${0.15 + intensity * 0.85})`
        return (
          <div key={d.hour} style={{ textAlign: 'center', flex: '1 0 calc(100%/8 - 3px)' }}>
            <div style={{ height: 28, borderRadius: 5, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: intensity > 0.5 ? '#fff' : '#888', fontWeight: 700 }}>
              {d.count > 0 ? d.count : ''}
            </div>
            <div style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>{d.hour}h</div>
          </div>
        )
      })}
    </div>
  )
}

export default function BiznesAnalyticsPage() {
  const params = useParams() as { id: string }
  const [ok, setOk] = useState(false)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      // Vetëm-pronar: kontroll para ngarkimit (gate-i i vërtetë është edhe në API).
      const { data: b } = await supabase.from('businesses').select('owner_id').eq('id', params.id).maybeSingle()
      if (!b) { window.location.href = '/profile'; return }
      if (b.owner_id !== session.user.id) { window.location.href = `/biznese/${params.id}`; return }
      setOk(true)
      fetchAnalytics(session.access_token, 30)
    })
  }, [params.id])

  async function fetchAnalytics(token: string, days: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?biz=${params.id}&days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { setLoadError(true); return }
      setData(await res.json())
    } catch { setLoadError(true) }
    setLoading(false)
  }

  async function changePeriod(days: number) {
    setPeriod(days)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) fetchAnalytics(session.access_token, days)
  }

  if (loadError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <div style={{ fontSize: 36 }} aria-hidden="true">⚠️</div>
      <div style={{ fontWeight: 700, color: '#111' }}>Gabim gjatë ngarkimit</div>
      <button type="button" onClick={() => { setLoadError(false); changePeriod(period) }} style={{ background: 'var(--az-yellow)', border: 'none', borderRadius: 24, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Rifresko</button>
    </div>
  )

  if (!ok || loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--az-red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
      <span style={{ fontSize: 13, color: '#555' }}>Duke ngarkuar analitikën…</span>
    </div>
  )

  const hasData = data && data.top_listings?.length > 0

  return (
    <div className="an-wrap">
      <style dangerouslySetInnerHTML={{ __html: `
        .an-wrap{max-width:480px;margin:0 auto;padding:0 0 80px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#f8f8f8;min-height:100vh;}
        @media(min-width:768px){.an-wrap{max-width:760px}}
        @media(min-width:1024px){.an-wrap{max-width:1080px}}
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
        .ctr-pill{background:#E8F5E9;color:#2e7d32;border-radius:6px;padding:2px 6px;font-size:10px;font-weight:700;}
        .topbar{display:flex;align-items:center;gap:10px;padding:14px 12px 10px;background:#fff;position:sticky;top:0;z-index:10;border-bottom:1px solid #f0f0f0;}
        .back-btn{width:44px;height:44px;border:none;background:#f5f5f5;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
      ` }} />

      <div className="topbar">
        <button type="button" className="back-btn" aria-label="Kthehu te biznesi" onClick={() => window.location.href = `/biznese/${params.id}`}>
          <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden="true" />
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 'var(--fs-xl)', color: '#111', margin: 0 }}>Analitika e biznesit</h1>
      </div>

      <div className="period-row">
        {[7, 30].map(d => (
          <button key={d} type="button" className={`period-btn ${period === d ? 'active' : ''}`} onClick={() => changePeriod(d)}>{d} ditë</button>
        ))}
      </div>

      {!hasData ? (
        <div className="an-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }} aria-hidden="true">📊</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#666', marginBottom: 4 }}>Ende pa të dhëna</div>
          <div style={{ fontSize: 12 }}>Statistikat shfaqen kur shpalljet e biznesit të marrin pamje dhe kontakte.</div>
        </div>
      ) : (
        <>
          <div className="an-card">
            <div className="an-title">Pasqyrë {period} ditë</div>
            <div className="stat-row">
              <div className="stat-box"><div style={{ fontSize: 16, marginBottom: 2 }} aria-hidden="true">👁</div><div className="stat-num" style={{ color: 'var(--az-red)' }}>{data.total_views}</div><div className="stat-lbl">Pamje</div></div>
              <div className="stat-box"><div style={{ fontSize: 16, marginBottom: 2 }} aria-hidden="true">✉️</div><div className="stat-num" style={{ color: '#0E7A35' }}>{data.total_contacts}</div><div className="stat-lbl">Kontakte</div></div>
              <div className="stat-box"><div style={{ fontSize: 16, marginBottom: 2 }} aria-hidden="true">🏷️</div><div className="stat-num">{data.top_listings.length}</div><div className="stat-lbl">Shpallje</div></div>
            </div>
          </div>

          {data.views_by_day?.length > 0 && (
            <div className="an-card">
              <div className="an-title">Pamjet për ditë</div>
              <BarChart data={data.views_by_day} />
            </div>
          )}

          {data.hourly?.length > 0 && (
            <div className="an-card">
              <div className="an-title">Orët më aktive</div>
              <Heatmap data={data.hourly} />
            </div>
          )}

          <div className="an-card">
            <div className="an-title">Shpalljet — Krahasim</div>
            {data.top_listings.map((l: any, i: number) => (
              <div key={l.id} className="listing-row">
                <div className="listing-rank">{i + 1}</div>
                <div className="listing-name">{l.title}</div>
                <div className="listing-stats">
                  <span>👁 {l.views}</span>
                  <span>✉ {l.contacts}</span>
                  {l.ctr > 0 && <span className="ctr-pill">{l.ctr}%</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
