'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getLevel } from '../components/Badges'
import { SharePanel } from '../components/SharePanel'
import { SITE_URL as SITE } from '../../lib/siteConfig'

const LEVELS = [
  { name: 'Fillestar', icon: '🌱', min: 0,   max: 99,  color: '#555',    bg: '#f5f5f5' },
  { name: 'Tregtar',   icon: '⚡', min: 100, max: 399, color: '#185FA5', bg: '#EEF4FF' },
  { name: 'Ekspert',   icon: '🏆', min: 400, max: 999, color: '#856404', bg: '#FFF4E5' },
  { name: 'Master',    icon: '💎', min: 1000, max: Infinity, color: '#7C3AED', bg: '#F5F3FF' },
]

function getLevelProgress(pts: number) {
  const idx = LEVELS.findIndex((l, i) => pts >= l.min && (i === LEVELS.length - 1 || pts < LEVELS[i + 1].min))
  const current = LEVELS[idx]
  const next = LEVELS[idx + 1]
  if (!next) return { current, next: null, pct: 100, remaining: 0 }
  const pct = Math.round(((pts - current.min) / (next.min - current.min)) * 100)
  return { current, next, pct, remaining: next.min - pts }
}

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
  body{background:#FFFBEA;}
  .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:60px;}
  .topbar{background:linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%);padding:10px 12px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;box-shadow:0 4px 16px -8px rgba(190,130,0,.4);}
  .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
  .back i{font-size:18px;color:#111;}
  .topbar-title{font-size:15px;font-weight:700;color:#111;}
  .hero{background:linear-gradient(135deg,#E63312,#c42a0e);padding:28px 20px 32px;text-align:center;}
  .hero-emoji{font-size:52px;display:block;margin-bottom:12px;}
  .hero h1{color:#fff;font-size:21px;font-weight:800;margin-bottom:8px;}
  .hero p{color:rgba(255,255,255,.85);font-size:13px;line-height:1.7;}
  .body{padding:16px 12px;}
  .card{background:#fff;border-radius:12px;border:0.5px solid #ececec;padding:18px;margin-bottom:14px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 6px 16px -10px rgba(0,0,0,.14);}
  .card-title{font-size:13px;font-weight:700;color:#111;margin-bottom:12px;display:flex;align-items:center;gap:7px;}
  .card-title i{font-size:16px;color:#C42B0F;}
  .stats-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:4px;}
  .stat{background:#FFFBEA;border-radius:12px;padding:14px 10px;text-align:center;}
  .stat-n{font-size:22px;font-weight:700;color:#C42B0F;}
  .stat-l{font-size:10px;color:#555;margin-top:3px;}
  .ref-box{background:#f9f5e0;border:1.5px dashed #F5C842;border-radius:12px;padding:16px;margin-bottom:12px;text-align:center;}
  .ref-code{font-size:22px;font-weight:700;color:#111;letter-spacing:3px;margin-bottom:6px;font-family:monospace;}
  .ref-url{font-size:11px;color:#555;word-break:break-all;margin-bottom:12px;}
  .share-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
  .share-btn{border:none;border-radius:12px;padding:11px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;transition:transform .15s ease,box-shadow .15s ease;}
  .share-btn:hover{transform:translateY(-1px);}
  .copy-btn{background:linear-gradient(135deg,#1a1a1a,#000);color:#F5C842;box-shadow:0 2px 8px -2px rgba(0,0,0,.35);}
  .whatsapp-btn{background:#25D366;color:#fff;}
  .step{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:0.5px solid #f5f5f5;}
  .step:last-child{border:none;}
  .step-num{width:26px;height:26px;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;box-shadow:0 1px 4px rgba(230,51,18,.35);}
  .step-text strong{font-size:12px;font-weight:700;color:#111;display:block;margin-bottom:3px;}
  .step-text span{font-size:11px;color:#666;line-height:1.6;}
  .reward-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:0.5px solid #f5f5f5;}
  .reward-item:last-child{border:none;}
  .reward-badge{width:38px;height:38px;border-radius:50%;background:#FFF0EE;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
  .reward-info{flex:1;}
  .reward-info strong{font-size:12px;font-weight:700;color:#111;display:block;}
  .reward-info span{font-size:11px;color:#555;}
  .reward-done{font-size:16px;flex-shrink:0;}
  .referral-list{display:flex;flex-direction:column;gap:8px;}
  .ref-row{display:flex;align-items:center;gap:10px;background:#f9f5e0;border-radius:12px;padding:10px 12px;}
  .ref-avatar{width:34px;height:34px;background:#F5C842;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#111;flex-shrink:0;}
  .ref-info{flex:1;}
  .ref-info strong{font-size:12px;font-weight:700;color:#111;display:block;}
  .ref-info span{font-size:10px;color:#555;}
  .ref-pts{font-size:11px;font-weight:700;color:#3B6D11;background:#EAF3DE;padding:3px 8px;border-radius:6px;}
  .empty-ref{text-align:center;padding:24px;color:#555;font-size:12px;}
  .login-cta{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;width:100%;font-family:inherit;margin-top:8px;box-shadow:0 4px 14px -3px rgba(230,51,18,.45);transition:transform .15s ease,box-shadow .15s ease;}
  .login-cta:hover{transform:translateY(-1px);box-shadow:0 7px 20px -4px rgba(230,51,18,.55);}
  .msg{padding:10px 14px;border-radius:12px;font-size:12px;font-weight:500;margin-bottom:10px;text-align:center;}
  .ok{background:#EAF3DE;color:#3B6D11;}
  .info{background:#EEF4FF;color:#185FA5;}
  .spinner{width:24px;height:24px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:spin .7s linear infinite;margin:40px auto;}
  @keyframes spin{to{transform:rotate(360deg);}}
  /* Level progress */
  .level-card{background:linear-gradient(135deg,#151515,#1c1c1c 60%,#231a0a);border-radius:12px;padding:16px;margin-bottom:14px;}
  .level-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
  .level-badge{font-size:13px;font-weight:700;padding:5px 12px;border-radius:999px;}
  .level-pts{font-size:12px;color:#888;}
  .level-bar-bg{background:#333;border-radius:6px;height:8px;overflow:hidden;margin-bottom:6px;}
  .level-bar-fill{height:100%;border-radius:6px;transition:width .5s ease;}
  .level-hint{font-size:10px;color:#666;text-align:right;}
  /* Premium milestone */
  .milestone-card{background:linear-gradient(135deg,#1a0a00,#2d1400);border:1px solid #F5C84255;border-radius:14px;padding:16px;margin-bottom:14px;}
  .milestone-title{color:#F5C842;font-size:13px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:7px;}
  .milestone-bar-bg{background:#333;border-radius:6px;height:10px;overflow:hidden;margin-bottom:8px;}
  .milestone-bar-fill{height:100%;background:linear-gradient(90deg,#F5C842,#E63312);border-radius:6px;transition:width .5s ease;}
  .milestone-meta{display:flex;justify-content:space-between;font-size:10px;color:#888;}
`

export default function ReferralPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [shareCount, setShareCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let ch: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session) { if (!cancelled) setLoading(false); return }
      setUser(session.user)
      fetchData(session.user.id)

      // Realtime: shares table — kanal unik për user që të mos përplaset në remount
      supabase.getChannels().filter(c => c.topic === 'realtime:ref-shares-rt').forEach(c => supabase.removeChannel(c))
      ch = supabase.channel('ref-shares-rt')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'shares',
          filter: `user_id=eq.${session.user.id}`,
        }, () => {
          setShareCount(c => c + 1)
        })
        .subscribe()
    })
    // Cleanup i regjistruar te useEffect (jo brenda .then) — çregjistron gjithmonë
    return () => { cancelled = true; if (ch) supabase.removeChannel(ch) }
  }, [])

  async function fetchData(uid: string) {
    try {
      const [{ data: p }, { count: sc }] = await Promise.all([
        supabase.from('profiles')
          .select('id,username,full_name,gamification_points,gamification_level,referral_code')
          .eq('id', uid).single(),
        supabase.from('shares').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      ])
      if (p) {
        setProfile(p)
        const code = p.referral_code || p.username || uid.replace(/-/g,'').slice(0,8).toUpperCase()
        const codes = [...new Set([p.referral_code, p.username, code].filter(Boolean))] as string[]
        const { data: refs } = await supabase.from('profiles')
          .select('id,full_name,username,created_at')
          .in('referred_by', codes)
          .order('created_at', { ascending: false }).limit(20)
        if (refs) setReferrals(refs)
      }
      if (sc !== null) setShareCount(sc)
    } catch { /* network error — show empty state */ } finally {
      setLoading(false)
    }
  }

  const refCode = profile?.referral_code || profile?.username || user?.id?.replace(/-/g,'').slice(0,8).toUpperCase() || ''
  const refUrl  = `${SITE}?ref=${refCode}`

  const totalPts = referrals.length * 50
  const pts = profile?.gamification_points || 0
  const lp = getLevelProgress(pts)

  // Premium milestone: 50 referrals = 1 free month
  const MILESTONES = [
    { at: 5,  label: '🥉 Anëtar Bronzi', pts: 250 },
    { at: 20, label: '🥈 Anëtar Argjendi', pts: 1000 },
    { at: 50, label: '🥇 Anëtar Ari + 1 muaj Premium FALAS', pts: 2500 },
  ]
  const nextMilestone = MILESTONES.find(m => referrals.length < m.at)
  const prevMilestone = [...MILESTONES].reverse().find(m => referrals.length >= m.at)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu mbrapa" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <span className="topbar-title"><span aria-hidden="true">🎁</span> Programi i Referimit</span>
        </div>

        <div className="hero">
          <span className="hero-emoji" aria-hidden="true">🎁</span>
          <h1>Fto Miqtë, Fito Pikë!</h1>
          <p>Për çdo mik që regjistron në Alpazar<br />përmes linkut tënd, fiton <strong>50 pikë</strong> gamifikimi.<br />Pa kosto. Pa limit.</p>
        </div>

        <div className="body">
          {loading ? (
            <div className="spinner" />
          ) : !user ? (
            <div className="card">
              <div className="card-title"><i className="ti ti-lock" aria-hidden="true" />Hyr për të parë referalet</div>
              <p style={{ fontSize: 12, color: '#555', marginBottom: 14 }}>Krijo llogari falas dhe fillo të fitosh pikë duke ftuar miqtë.</p>
              <button type="button" className="login-cta" onClick={() => window.location.href = '/auth/login'}>
                <span aria-hidden="true">🔑</span> Hyr / Regjistrohu
              </button>
            </div>
          ) : (
            <>
              {/* Level progress */}
              <div className="level-card">
                <div className="level-top">
                  <span className="level-badge" style={{ background: lp.current.bg, color: lp.current.color }}>
                    <span aria-hidden="true">{lp.current.icon}</span> {lp.current.name}
                  </span>
                  <span className="level-pts">{pts} pikë</span>
                </div>
                <div className="level-bar-bg">
                  <div className="level-bar-fill" style={{
                    width: `${lp.pct}%`,
                    background: lp.next ? `linear-gradient(90deg,${lp.current.color},${lp.next.color})` : '#F5C842',
                  }} />
                </div>
                {lp.next
                  ? <div className="level-hint">{lp.remaining} pikë deri në <span aria-hidden="true">{lp.next.icon}</span> {lp.next.name}</div>
                  : <div className="level-hint" style={{ color: '#F5C842' }}><span aria-hidden="true">💎</span> Nivel maksimal i arritur!</div>
                }
              </div>

              {/* Premium milestone progress */}
              {nextMilestone && (
                <div className="milestone-card">
                  <div className="milestone-title">
                    <i className="ti ti-crown" style={{ fontSize: 14 }} aria-hidden="true" />
                    Progresi drejt {nextMilestone.label}
                  </div>
                  <div className="milestone-bar-bg">
                    <div className="milestone-bar-fill" style={{
                      width: `${Math.round((referrals.length / nextMilestone.at) * 100)}%`,
                    }} />
                  </div>
                  <div className="milestone-meta">
                    <span>{referrals.length} / {nextMilestone.at} referalë</span>
                    <span>{nextMilestone.at - referrals.length} mbetur</span>
                  </div>
                  {prevMilestone && (
                    <div style={{ fontSize: 10, color: '#F5C84299', marginTop: 6, textAlign: 'center' }}>
                      <><span aria-hidden="true">✅</span> Ke arritur: {prevMilestone.label}</>
                    </div>
                  )}
                </div>
              )}
              {!nextMilestone && (
                <div className="milestone-card">
                  <div className="milestone-title">
                    <i className="ti ti-crown" style={{ fontSize: 14 }} aria-hidden="true" />
                    <span aria-hidden="true">🥇</span> Ke arritur të gjitha milestones!
                  </div>
                  <div style={{ fontSize: 12, color: '#F5C842', textAlign: 'center', padding: '8px 0' }}>
                    Urime! 50+ referalë & 1 muaj Premium FALAS fituar! <span aria-hidden="true">🎉</span>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="card">
                <div className="card-title"><i className="ti ti-chart-bar" aria-hidden="true" />Statistikat e Tua</div>
                <div className="stats-row">
                  <div className="stat">
                    <div className="stat-n">{referrals.length}</div>
                    <div className="stat-l">Të ftuar</div>
                  </div>
                  <div className="stat">
                    <div className="stat-n">{shareCount}</div>
                    <div className="stat-l">Shpërndarje</div>
                  </div>
                  <div className="stat">
                    <div className="stat-n">{profile?.gamification_points || 0}</div>
                    <div className="stat-l">Pikë totale</div>
                  </div>
                </div>
              </div>

              {/* Referral link + SharePanel */}
              <div className="card">
                <div className="card-title"><i className="ti ti-link" aria-hidden="true" />Linku yt i Referimit</div>
                <div className="ref-box" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ref-code">{refCode.toUpperCase()}</div>
                    <div className="ref-url" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{refUrl}</div>
                  </div>
                  <button
                    type="button"
                    aria-label="Kopjo linkun e referimit"
                    onClick={() => { navigator.clipboard.writeText(refUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    style={{ flexShrink: 0, background: copied ? '#1D9E75' : '#F5C842', color: copied ? '#fff' : '#111', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', whiteSpace: 'nowrap' }}
                  >
                    {copied ? <><span aria-hidden='true'>✓</span> Kopjuar!</> : <><span aria-hidden='true'>📋</span> Kopjo</>}
                  </button>
                </div>
                <SharePanel
                  shareUrl={refUrl}
                  shareText={`Bashkohu me mua në ALPAZAR — marketplace #1 shqiptar! Regjistrohu falas:`}
                  refCode={refCode}
                  listingId={null}
                  userId={user?.id ?? null}
                />
              </div>

              {/* How it works */}
              <div className="card">
                <div className="card-title"><i className="ti ti-help-circle" aria-hidden="true" />Si Funksionon</div>
                <div className="step">
                  <div className="step-num">1</div>
                  <div className="step-text">
                    <strong>Ndaj linkun tënd</strong>
                    <span>Dërgo tek miqtë, nëpër WhatsApp, Facebook ose Instagram</span>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">2</div>
                  <div className="step-text">
                    <strong>Miku regjistrohet</strong>
                    <span>Miku klikon linkun dhe krijon llogari falas në Alpazar</span>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">3</div>
                  <div className="step-text">
                    <strong>Ti fiton 50 pikë</strong>
                    <span>Pikët shtohen automatikisht — mund t'i shohësh këtu</span>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              <div className="card">
                <div className="card-title"><i className="ti ti-trophy" aria-hidden="true" />Shpërblimet</div>
                {[
                  { at: 5,  badge: '🥉', label: '5 referalë → Anëtar Bronzi',   sub: '250 pikë · Badge special në profil' },
                  { at: 20, badge: '🥈', label: '20 referalë → Anëtar Argjendi', sub: '1000 pikë · Prioritet në lista' },
                  { at: 50, badge: '🥇', label: '50 referalë → Anëtar Ari',      sub: '2500 pikë · 1 muaj Premium FALAS' },
                ].map(r => {
                  const done = referrals.length >= r.at
                  return (
                    <div key={r.at} className="reward-item" style={{ opacity: done ? 1 : 0.7 }}>
                      <div className="reward-badge" style={{ background: done ? '#EAF3DE' : '#FFF0EE' }} aria-hidden="true">{r.badge}</div>
                      <div className="reward-info">
                        <strong style={{ color: done ? '#3B6D11' : '#111' }}>{r.label}</strong>
                        <span>{r.sub}</span>
                      </div>
                      <div className="reward-done" aria-hidden="true">{done ? '✅' : '🔒'}</div>
                    </div>
                  )
                })}
              </div>

              {/* Referral list */}
              <div className="card">
                <div className="card-title"><i className="ti ti-users" aria-hidden="true" />Të Ftuar ({referrals.length})</div>
                {referrals.length === 0 ? (
                  <div className="empty-ref">
                    <div style={{ fontSize: 36, marginBottom: 8 }} aria-hidden="true">👥</div>
                    <div>Ende nuk ke ftuar askënd.<br />Ndaj linkun dhe fillo të fitosh pikë!</div>
                  </div>
                ) : (
                  <div className="referral-list">
                    {referrals.map(r => (
                      <div key={r.id} className="ref-row">
                        <div className="ref-avatar">
                          {(r.full_name || r.username || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="ref-info">
                          <strong>{r.full_name || r.username || 'Përdorues'}</strong>
                          <span>U regjistrua {new Date(r.created_at).toLocaleDateString('sq-AL')}</span>
                        </div>
                        <div className="ref-pts">+50 pts</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
