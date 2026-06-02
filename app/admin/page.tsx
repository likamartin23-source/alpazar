'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlpazar } from '../../lib/context'
import { useRealtimeTable } from '../../hooks/useRealtimeTable'

/* ─── Styles ───────────────────────────────────────────────── */
const CSS = `
*{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,sans-serif;}
.wrap{display:flex;min-height:100vh;background:#f5f5f5;}
.sb{width:190px;background:#111;display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;}
.sb-logo{padding:16px 14px;border-bottom:1px solid #1e1e1e;}
.sb-logo .n{font-size:14px;font-weight:800;color:#F5C842;letter-spacing:.5px;}
.sb-logo .r{font-size:10px;color:#555;margin-top:3px;}
.nl{padding:10px 14px;display:flex;align-items:center;gap:9px;color:#666;border-left:3px solid transparent;cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:inherit;transition:background .15s;}
.nl:hover{background:#1a1a1a;}
.nl.on{background:#1a1a1a;border-left-color:#F5C842;color:#F5C842;}
.nl i{font-size:16px;}
.nl span{font-size:11px;font-weight:600;}
.content{flex:1;padding:22px;overflow:auto;max-width:1000px;}
.ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
.pt{font-size:18px;font-weight:800;color:#111;}
.live-dot{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#1D9E75;background:#EAF3DE;border-radius:20px;padding:4px 10px;}
.live-dot::before{content:'';width:7px;height:7px;background:#1D9E75;border-radius:50%;animation:pulse 1.5s infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;}
@media(max-width:700px){.stats{grid-template-columns:1fr 1fr;}}
.sc{background:#fff;border:1px solid #eee;border-radius:10px;padding:14px;}
.sn{font-size:22px;font-weight:800;color:#111;}
.sl{font-size:10px;color:#888;margin-top:3px;}
.card{background:#fff;border:1px solid #eee;border-radius:10px;padding:18px;margin-bottom:16px;}
.ct{font-size:13px;font-weight:700;color:#111;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;}
table{width:100%;border-collapse:collapse;font-size:11px;}
th{background:#f8f8f8;color:#999;font-weight:700;padding:8px 10px;text-align:left;border-bottom:1px solid #eee;font-size:10px;text-transform:uppercase;letter-spacing:.5px;}
td{padding:9px 10px;border-bottom:1px solid #f5f5f5;color:#333;vertical-align:middle;}
tr:last-child td{border:none;}
.badge{border-radius:5px;padding:2px 7px;font-size:10px;font-weight:700;display:inline-block;}
.ba{background:#EAF3DE;color:#1D9E75;}
.bp{background:#FAEEDA;color:#BA7517;}
.bd{background:#FFF0EE;color:#E63312;}
.btn{border:none;border-radius:5px;padding:5px 10px;font-size:10px;font-weight:700;cursor:pointer;margin-right:4px;font-family:inherit;transition:opacity .15s;}
.btn:hover{opacity:.8;}
.btn-green{background:#EAF3DE;color:#1D9E75;}
.btn-orange{background:#FAEEDA;color:#BA7517;}
.btn-red{background:#FFF0EE;color:#E63312;}
.tgl{width:30px;height:16px;border-radius:10px;position:relative;cursor:pointer;display:inline-block;flex-shrink:0;transition:background .2s;}
.tgl-on{background:#1D9E75;}
.tgl-off{background:#ccc;}
.tdot{width:12px;height:12px;background:#fff;border-radius:50%;position:absolute;top:2px;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.tgl-on .tdot{left:16px;}
.tgl-off .tdot{left:2px;}
.cfg-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f5f5f5;gap:12px;}
.cfg-row:last-child{border:none;}
.cfg-label{font-size:11px;color:#333;flex:1;}
.cfg-desc{font-size:9px;color:#aaa;margin-top:2px;}
.cfg-val{font-size:11px;font-weight:700;color:#111;}
.finput{border:1px solid #e5e5e5;border-radius:7px;padding:7px 10px;font-size:12px;width:100%;font-family:inherit;outline:none;background:#fafafa;transition:border .15s;}
.finput:focus{border-color:#F5C842;background:#fff;}
.section-label{font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.8px;margin:18px 0 10px;}
.save-row{display:flex;gap:8px;align-items:center;margin-top:6px;}
.save-btn{background:#111;color:#fff;border:none;border-radius:7px;padding:8px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s;}
.save-btn:hover{background:#222;}
.save-ok{font-size:11px;color:#1D9E75;font-weight:700;animation:fade-in .3s;}
@keyframes fade-in{from{opacity:0}to{opacity:1}}
.pm-r{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:10px;}
.pm-inf{flex:1;}
.pm-inf strong{font-size:11px;font-weight:700;color:#111;display:block;}
.pm-inf span{font-size:10px;color:#888;}
.maint-banner{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border-radius:10px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;gap:12px;}
.maint-banner i{font-size:22px;}
.maint-banner p{font-size:12px;font-weight:700;flex:1;}
`

/* ─── Referral Tab ─────────────────────────────────────────── */
function ReferralTab() {
  const [refs, setRefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('id,username,full_name,referred_by,created_at')
      .not('referred_by', 'is', null).order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { setRefs(data || []); setLoading(false) })
  }, [])

  const byRef = refs.reduce((acc: Record<string, any>, r: any) => {
    const k = r.referred_by
    if (!acc[k]) acc[k] = { code: k, count: 0 }
    acc[k].count++
    return acc
  }, {})
  const ranked = Object.values(byRef).sort((a: any, b: any) => b.count - a.count)

  return (
    <>
      <div className="ph"><div className="pt">🎁 Referalet</div></div>
      <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="sc"><div className="sn">{refs.length}</div><div className="sl">Me referim</div></div>
        <div className="sc"><div className="sn">{ranked.length}</div><div className="sl">Referues aktiv</div></div>
        <div className="sc"><div className="sn">{refs.length * 50}</div><div className="sl">Pikë dhënë</div></div>
      </div>
      <div className="card">
        <div className="ct">Top Referues</div>
        {loading ? <p style={{ color: '#aaa', fontSize: 12, padding: '12px 0' }}>Duke ngarkuar...</p> :
          <table>
            <thead><tr><th>#</th><th>Kodi</th><th>Të ftuar</th><th>Pikë</th></tr></thead>
            <tbody>{ranked.map((r: any, i) => (
              <tr key={r.code}>
                <td style={{ fontWeight: 800, color: '#F5C842' }}>{i + 1}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.code}</td>
                <td>{r.count}</td>
                <td style={{ color: '#1D9E75', fontWeight: 700 }}>+{r.count * 50}</td>
              </tr>
            ))}</tbody>
          </table>
        }
      </div>
    </>
  )
}

/* ─── App Config Tab (real-time) ───────────────────────────── */
const CONFIG_SCHEMA: { key: string; label: string; desc: string; type: 'text' | 'int' | 'float' | 'bool' }[] = [
  { key: 'maintenance_mode',      label: 'Modaliteti i Mirëmbajtjes',   desc: 'Bllokon aksesin për jo-adminët',           type: 'bool'  },
  { key: 'maintenance_message',   label: 'Mesazhi i Mirëmbajtjes',      desc: 'Tekst që shfaqet gjatë mirëmbajtjes',      type: 'text'  },
  { key: 'site_slogan',           label: 'Slogani i Faqes',             desc: 'Shfaqet në krye të hero section',          type: 'text'  },
  { key: 'free_listings_limit',   label: 'Kufiri i Shpalljeve Falas',   desc: 'Shpallje falas për çdo user',              type: 'int'   },
  { key: 'premium_boost_days',    label: 'Ditë Boost me Premium',       desc: 'Ditë boost kredite për premium',           type: 'int'   },
  { key: 'max_images_free',       label: 'Foto Max (Falas)',            desc: 'Imazhe maksimale për shpallje falas',      type: 'int'   },
  { key: 'max_images_premium',    label: 'Foto Max (Premium)',          desc: 'Imazhe maksimale për shpallje premium',    type: 'int'   },
  { key: 'otp_resend_cooldown_s', label: 'Cooldown OTP (sekonda)',      desc: 'Pritje para ri-dërgimit të OTP',           type: 'int'   },
  { key: 'min_listing_price',     label: 'Çmimi Minimal (ALL)',         desc: 'Çmimi minimal i lejuar për shpallje',      type: 'float' },
  { key: 'referral_reward_all',   label: 'Shpërblim Referimi (ALL)',    desc: 'Shuma e shpërblimit për referim',          type: 'float' },
  { key: 'premium_monthly_price', label: 'Çmimi Premium Mujor (€)',     desc: 'Shfaqet në hero dhe faqen premium',        type: 'float' },
  { key: 'show_listing_count',    label: 'Shfaq Nr. Shpalljeve',        desc: 'Hero stats — numri i shpalljeve',          type: 'bool'  },
  { key: 'show_user_count',       label: 'Shfaq Nr. Përdoruesve',       desc: 'Hero stats — numri i përdoruesve',         type: 'bool'  },
]

function AppConfigTab() {
  const { config } = useAlpazar()
  const [localVals, setLocalVals] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  // sync from context
  useEffect(() => {
    setLocalVals(prev => ({ ...config, ...prev }))
  }, [config])

  const save = async (key: string) => {
    const val = localVals[key] ?? ''
    const { error } = await supabase.from('app_config').upsert(
      { key, value: val, type: CONFIG_SCHEMA.find(s => s.key === key)?.type ?? 'string' },
      { onConflict: 'key' }
    )
    if (!error) {
      setSaved(prev => ({ ...prev, [key]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 2000)
    }
  }

  const toggleBool = async (key: string) => {
    const cur = (localVals[key] ?? config[key] ?? 'false') === 'true'
    const next = cur ? 'false' : 'true'
    setLocalVals(prev => ({ ...prev, [key]: next }))
    const { error } = await supabase.from('app_config').upsert(
      { key, value: next, type: 'bool' },
      { onConflict: 'key' }
    )
    if (error) {
      // Rollback — DB write failed, restore previous value
      setLocalVals(prev => ({ ...prev, [key]: cur ? 'true' : 'false' }))
    }
  }

  const boolKeys  = CONFIG_SCHEMA.filter(s => s.type === 'bool')
  const otherKeys = CONFIG_SCHEMA.filter(s => s.type !== 'bool')
  const isMaint   = (localVals['maintenance_mode'] ?? config['maintenance_mode'] ?? 'false') === 'true'

  return (
    <>
      <div className="ph">
        <div className="pt">⚙️ Konfigurimet Live</div>
        <div className="live-dot">● Transmetim Real-Time</div>
      </div>

      {isMaint && (
        <div className="maint-banner">
          <i className="ti ti-alert-triangle" />
          <p>Modaliteti i mirëmbajtjes është AKTIV — platforma është bllokuar për përdorues.</p>
          <button className="btn btn-red" onClick={() => toggleBool('maintenance_mode')}>Çaktivizo</button>
        </div>
      )}

      <div className="card">
        <div className="ct">Çelësat Boolean — klik për ndrysho</div>
        {boolKeys.map(s => {
          const val = (localVals[s.key] ?? config[s.key] ?? 'false') === 'true'
          return (
            <div key={s.key} className="cfg-row">
              <div className="cfg-label">
                {s.label}
                <div className="cfg-desc">{s.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="cfg-val" style={{ color: val ? '#1D9E75' : '#999' }}>
                  {val ? 'Po' : 'Jo'}
                </span>
                <span
                  className={`tgl ${val ? 'tgl-on' : 'tgl-off'}`}
                  onClick={() => toggleBool(s.key)}
                ><span className="tdot" /></span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="ct">Vlerat e Tekstit / Numrave</div>
        {otherKeys.map(s => (
          <div key={s.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>
              {s.label} <span style={{ color: '#ccc' }}>— {s.desc}</span>
            </label>
            <div className="save-row">
              <input
                className="finput"
                type={s.type === 'int' || s.type === 'float' ? 'number' : 'text'}
                value={localVals[s.key] ?? config[s.key] ?? ''}
                onChange={e => setLocalVals(prev => ({ ...prev, [s.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && save(s.key)}
              />
              <button className="save-btn" onClick={() => save(s.key)} style={{ whiteSpace: 'nowrap' }}>
                {saved[s.key] ? '✓ Ruajtur' : 'Ruaj'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: '#f9f9f9', border: '1px dashed #ddd' }}>
        <div className="ct" style={{ color: '#888' }}>ℹ️ Si funksionon?</div>
        <p style={{ fontSize: 11, color: '#888', lineHeight: 1.7 }}>
          Çdo ndryshim ruhet direkt në tabelën <code style={{ background: '#eee', padding: '1px 4px', borderRadius: 3 }}>app_config</code> të Supabase.
          Falë <strong>Supabase Realtime</strong>, të gjithë klientët e lidhur e marrin ndryshimin
          <strong> brenda 1 sekonde</strong> — pa rikodifikim, pa redeploy.
        </p>
      </div>
    </>
  )
}

/* ─── Moderation Tab ─────────────────────────────────────────── */
function ModerationTab() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('reports')
      .select('*,listings(title),profiles!reporter_id(username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => { setReports(data || []); setLoading(false) })

    const ch = supabase.channel('mod_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        supabase.from('reports')
          .select('*,listings(title),profiles!reporter_id(username)')
          .eq('status', 'pending').order('created_at', { ascending: true }).limit(50)
          .then(({ data }) => setReports(data || []))
      }).subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  const resolve = async (id: string, action: 'resolved' | 'dismissed') => {
    const { error } = await supabase.from('reports').update({ status: action }).eq('id', id)
    if (error) { alert('Gabim: ' + error.message); return }
    setReports(prev => prev.filter(r => r.id !== id))
  }

  return (
    <>
      <div className="ph">
        <div className="pt">🛡️ Moderimi</div>
        <div className="live-dot">● Live</div>
      </div>
      <div className="card">
        <div className="ct">Raporte të hapura ({reports.length})</div>
        {loading ? <p style={{ color: '#aaa', fontSize: 12, padding: '12px 0' }}>Duke ngarkuar...</p> :
          reports.length === 0 ? (
            <p style={{ color: '#1D9E75', fontSize: 12, padding: '12px 0', fontWeight: 700 }}>✓ Asnjë raport i hapur</p>
          ) : (
            <table>
              <thead><tr><th>Shpallja</th><th>Raportuar nga</th><th>Arsyeja</th><th>Data</th><th>Veprime</th></tr></thead>
              <tbody>{reports.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>{r.listings?.title || '—'}</td>
                  <td>{r.profiles?.username || '—'}</td>
                  <td>{r.reason}</td>
                  <td style={{ color: '#888' }}>{new Date(r.created_at).toLocaleDateString('sq-AL')}</td>
                  <td>
                    <button className="btn btn-green" onClick={() => resolve(r.id, 'resolved')}>Zgjidh</button>
                    <button className="btn btn-orange" onClick={() => resolve(r.id, 'dismissed')}>Inoro</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )
        }
      </div>
    </>
  )
}

/* ─── Main Admin Page ────────────────────────────────────────── */
export default function Admin() {
  const { config } = useAlpazar()
  const [tab, setTab] = useState('dash')
  const [stats, setStats] = useState({ users: 0, premium: 0, revenue: 0, listings: 0, messages: 0, reports: 0 })
  const [payments, setPayments] = useState<any[]>([])
  const [methods, setMethods] = useState<any[]>([])
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [liveStats, setLiveStats] = useState({ newListings: 0, newReports: 0 })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      const { data: p } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!p?.is_admin) { window.location.href = '/'; return }
      setAuthChecked(true)
      fetchAll()
    })
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [
      { count: u }, { count: pr }, { count: l },
      { count: msgs }, { count: reps },
      { data: pm }, { data: mt },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('messages').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('premium_subscriptions')
        .select('*,profiles(full_name,username)').order('created_at', { ascending: false }).limit(50),
      supabase.from('payment_methods').select('*').order('sort_order'),
    ])
    const rev = (pm || []).filter((p: any) => p.status === 'active')
      .reduce((s: number, p: any) => s + (p.amount_eur || 0), 0)
    setStats({ users: u||0, premium: pr||0, revenue: rev, listings: l||0, messages: msgs||0, reports: reps||0 })
    setPayments(pm || [])
    setMethods(mt || [])
    setLoading(false)
  }, [])

  async function updateStatus(id: string, status: string, userId?: string) {
    const { error: e1 } = await supabase.from('premium_subscriptions').update({ status }).eq('id', id)
    if (e1) { alert('Gabim ndryshim abonimi: ' + e1.message); return }
    if (status === 'active' && userId) {
      const sub = payments.find(p => p.id === id)
      const { error: e2 } = await supabase.from('profiles').update({ is_premium: true, premium_expires_at: sub?.end_date }).eq('id', userId)
      if (e2) alert('Abonimi u ndryshua por profili nuk u përditësua: ' + e2.message)
    }
    if ((status === 'cancelled' || status === 'suspended') && userId) {
      const { error: e2 } = await supabase.from('profiles').update({ is_premium: false }).eq('id', userId)
      if (e2) alert('Abonimi u ndryshua por profili nuk u përditësua: ' + e2.message)
    }
    fetchAll()
  }

  async function toggleMethod(id: string, cur: boolean) {
    const { error } = await supabase.from('payment_methods').update({ is_active: !cur }).eq('id', id)
    if (error) alert('Gabim: ' + error.message)
    fetchAll()
  }

  // Realtime — listingje të reja
  useRealtimeTable(
    'listings',
    null,
    () => {
      setLiveStats(s => ({ ...s, newListings: s.newListings + 1 }))
      setLastUpdated(new Date())
    },
    undefined, undefined, 'INSERT'
  )

  // Realtime — raporte të reja
  useRealtimeTable(
    'reports',
    null,
    () => {
      setLiveStats(s => ({ ...s, newReports: s.newReports + 1 }))
      setLastUpdated(new Date())
    },
    undefined, undefined, 'INSERT'
  )

  // Auto-refresh stats çdo 5 minuta
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAll()
      setLastUpdated(new Date())
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const isMaint = (config['maintenance_mode'] ?? 'false') === 'true'

  const tabs: [string, string, string][] = [
    ['dash',       'layout-dashboard', 'Dashboard'],
    ['payments',   'credit-card',      'Pagesat'],
    ['methods',    'wallet',           'Metodat'],
    ['config',     'settings-2',       'Konfigurime'],
    ['moderation', 'shield-check',     'Moderimi'],
    ['referrals',  'gift',             'Referalet'],
  ]

  if (!authChecked) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#111', color:'#F5C842', fontFamily:'system-ui', gap:12 }}>
      <span style={{ fontSize:24 }}>🔐</span> Duke verifikuar aksesin...
    </div>
  )

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <style>{CSS}</style>
      <div className="wrap">

        {/* ── Sidebar ── */}
        <div className="sb">
          <div className="sb-logo">
            <div className="n">🦅 ALPAZAR</div>
            <div className="r">Admin Panel</div>
            {isMaint && (
              <div style={{ marginTop: 8, background: '#E63312', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 700 }}>
                🔧 MIRËMBAJTJE
              </div>
            )}
          </div>

          {tabs.map(([id, icon, label]) => (
            <button key={id} className={`nl ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
              <i className={`ti ti-${icon}`} />
              <span>{label}</span>
              {id === 'moderation' && stats.reports > 0 && (
                <span style={{ marginLeft: 'auto', background: '#E63312', color: '#fff', borderRadius: 10, fontSize: 9, fontWeight: 800, padding: '1px 5px' }}>
                  {stats.reports}
                </span>
              )}
            </button>
          ))}

          <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid #1e1e1e' }}>
            <a href="/" style={{ color: '#666', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 13 }} />Kthehu
            </a>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="content">
          {loading && tab !== 'config' ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 13 }}>Duke ngarkuar...</div>
          ) : (
            <>
              {/* DASHBOARD */}
              {tab === 'dash' && (
                <>
                  <div className="ph">
                    <div className="pt">📊 Dashboard</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <div className="live-dot">● Live</div>
                      <span style={{ fontSize: 9, color: '#aaa' }}>
                        {lastUpdated.toLocaleTimeString('sq-AL')}
                        {liveStats.newListings > 0 && ` · +${liveStats.newListings} listingje`}
                        {liveStats.newReports > 0 && ` · +${liveStats.newReports} raporte`}
                      </span>
                    </div>
                  </div>
                  <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                    <div className="sc"><div className="sn">{stats.users.toLocaleString()}</div><div className="sl">Përdorues total</div></div>
                    <div className="sc"><div className="sn">{stats.premium}</div><div className="sl">Premium aktiv</div></div>
                    <div className="sc"><div className="sn">{stats.revenue.toFixed(0)}€</div><div className="sl">Të ardhura</div></div>
                    <div className="sc"><div className="sn">{stats.listings.toLocaleString()}</div><div className="sl">Shpallje aktive</div></div>
                    <div className="sc"><div className="sn">{stats.messages.toLocaleString()}</div><div className="sl">Mesazhe total</div></div>
                    <div className="sc" style={{ border: stats.reports > 0 ? '1px solid #E63312' : undefined }}>
                      <div className="sn" style={{ color: stats.reports > 0 ? '#E63312' : '#111' }}>{stats.reports}</div>
                      <div className="sl">Raporte të hapura</div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="ct">Pagesat e fundit</div>
                    <table>
                      <thead><tr><th>Përdoruesi</th><th>Plan</th><th>Shuma</th><th>Statusi</th><th>Veprime</th></tr></thead>
                      <tbody>
                        {payments.length === 0
                          ? <tr><td colSpan={5} style={{ textAlign:'center', color:'#aaa', padding:20 }}>Nuk ka pagesa</td></tr>
                          : payments.slice(0, 10).map((p: any) => (
                            <tr key={p.id}>
                              <td>{p.profiles?.full_name || p.profiles?.username || '—'}</td>
                              <td>{p.plan === 'monthly' ? 'Mujor' : 'Vjetor'}</td>
                              <td style={{ fontWeight:700, color:'#1D9E75' }}>{p.amount_eur}€</td>
                              <td><span className={`badge ${p.status==='active'?'ba':p.status==='pending'?'bp':'bd'}`}>{p.status}</span></td>
                              <td>
                                {p.status !== 'active'   && <button className="btn btn-green"  onClick={() => updateStatus(p.id,'active',p.user_id)}>Aktivizo</button>}
                                {p.status === 'active'   && <button className="btn btn-orange" onClick={() => updateStatus(p.id,'suspended',p.user_id)}>Pezullo</button>}
                                <button className="btn btn-red" onClick={() => updateStatus(p.id,'cancelled',p.user_id)}>Anulo</button>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* PAYMENTS */}
              {tab === 'payments' && (
                <>
                  <div className="ph"><div className="pt">💳 Pagesat ({payments.length})</div></div>
                  <div className="card">
                    <table>
                      <thead><tr><th>Përdoruesi</th><th>Plan</th><th>Shuma</th><th>Metoda</th><th>Statusi</th><th>Data</th><th>Veprime</th></tr></thead>
                      <tbody>
                        {payments.length === 0
                          ? <tr><td colSpan={7} style={{ textAlign:'center', color:'#aaa', padding:20 }}>Nuk ka kërkesa</td></tr>
                          : payments.map((p: any) => (
                            <tr key={p.id}>
                              <td>{p.profiles?.full_name || p.profiles?.username || '—'}</td>
                              <td>{p.plan}</td>
                              <td style={{ fontWeight:700, color:'#1D9E75' }}>{p.amount_eur}€</td>
                              <td>{p.payment_method || '—'}</td>
                              <td><span className={`badge ${p.status==='active'?'ba':p.status==='pending'?'bp':'bd'}`}>{p.status}</span></td>
                              <td style={{ color:'#888' }}>{new Date(p.created_at).toLocaleDateString('sq-AL')}</td>
                              <td>
                                {p.status!=='active' && <button className="btn btn-green" onClick={() => updateStatus(p.id,'active',p.user_id)}>✓</button>}
                                {p.status==='active' && <button className="btn btn-orange" onClick={() => updateStatus(p.id,'suspended',p.user_id)}>⏸</button>}
                                <button className="btn btn-red" onClick={() => updateStatus(p.id,'cancelled',p.user_id)}>✕</button>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* PAYMENT METHODS */}
              {tab === 'methods' && (
                <>
                  <div className="ph"><div className="pt">💳 Metodat e Pagesës</div></div>
                  <div className="card">
                    <div className="ct">Aktivizo / Çaktivizo</div>
                    {methods.map((m: any) => (
                      <div key={m.id} className="pm-r">
                        <div className="pm-inf">
                          <strong>{m.name}</strong>
                          <span>{m.type}</span>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span className={`tgl ${m.is_active ? 'tgl-on' : 'tgl-off'}`} onClick={() => toggleMethod(m.id, m.is_active)}>
                            <span className="tdot" />
                          </span>
                          <button className="btn btn-red" onClick={async () => { const { error } = await supabase.from('payment_methods').delete().eq('id',m.id); if (error) alert('Gabim: ' + error.message); fetchAll() }}>Fshi</button>
                        </div>
                      </div>
                    ))}
                    {methods.length === 0 && <p style={{ color:'#aaa', fontSize:12 }}>Nuk ka metoda pagese</p>}
                  </div>
                </>
              )}

              {/* APP CONFIG - REAL-TIME */}
              {tab === 'config' && <AppConfigTab />}

              {/* MODERATION */}
              {tab === 'moderation' && <ModerationTab />}

              {/* REFERRALS */}
              {tab === 'referrals' && <ReferralTab />}
            </>
          )}
        </div>
      </div>
    </>
  )
}
