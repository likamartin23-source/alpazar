'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const CSS = `*{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,sans-serif;} .wrap{display:flex;min-height:100vh;background:#f5f5f5;} .sb{width:180px;background:#111;display:flex;flex-direction:column;flex-shrink:0;} .sb-logo{padding:14px;border-bottom:0.5px solid #222;} .sb-logo .n{font-size:13px;font-weight:700;color:#F5C842;} .sb-logo .r{font-size:10px;color:#888;margin-top:2px;} .nl{padding:9px 14px;display:flex;align-items:center;gap:8px;text-decoration:none;color:#666;border-left:3px solid transparent;cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:inherit;} .nl:hover{background:#1a1a1a;} .nl.on{background:#1a1a1a;border-left-color:#F5C842;color:#F5C842;} .nl i{font-size:15px;} .nl span{font-size:11px;} .nl.on span{font-weight:700;} .content{flex:1;padding:20px;overflow:auto;} .ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;} .pt{font-size:17px;font-weight:700;color:#111;} .lb{background:#1D9E75;color:#fff;border-radius:4px;padding:3px 9px;font-size:11px;font-weight:700;} .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;} .sc{background:#fff;border:0.5px solid #eee;border-radius:9px;padding:12px;} .sn{font-size:20px;font-weight:700;color:#111;} .sl{font-size:10px;color:#888;margin-top:2px;} .card{background:#fff;border:0.5px solid #eee;border-radius:9px;padding:16px;margin-bottom:14px;} .ct{font-size:13px;font-weight:700;color:#111;margin-bottom:10px;} table{width:100%;border-collapse:collapse;font-size:11px;} th{background:#f5f5f5;color:#888;font-weight:700;padding:7px 9px;text-align:left;border-bottom:0.5px solid #eee;font-size:10px;text-transform:uppercase;} td{padding:8px 9px;border-bottom:0.5px solid #f5f5f5;color:#333;vertical-align:middle;} tr:last-child td{border:none;} .sb_{border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;display:inline-block;} .sa{background:#EAF3DE;color:#1D9E75;} .sp_{background:#FAEEDA;color:#BA7517;} .ss{background:#FFF0EE;color:#E63312;} .ab{border:none;border-radius:4px;padding:4px 8px;font-size:10px;font-weight:700;cursor:pointer;margin-right:3px;font-family:inherit;} .ba{background:#EAF3DE;color:#1D9E75;} .bp{background:#FAEEDA;color:#BA7517;} .bd_{background:#FFF0EE;color:#E63312;} .pm-r{background:#f9f9f9;border:0.5px solid #eee;border-radius:7px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px;} .pm-inf{flex:1;} .pm-inf strong{font-size:11px;font-weight:700;color:#111;display:block;} .pm-inf span{font-size:10px;color:#888;} .tgl{width:26px;height:13px;border-radius:8px;position:relative;cursor:pointer;display:inline-block;flex-shrink:0;} .ton{background:#1D9E75;} .tof{background:#ccc;} .tdot{width:9px;height:9px;background:#fff;border-radius:50%;position:absolute;top:2px;} .ton .tdot{right:2px;} .tof .tdot{left:2px;} .cfg-r{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:0.5px solid #f0f0f0;} .cfg-r:last-child{border:none;} .cfg-r span{font-size:11px;color:#333;} .finput{border:0.5px solid #ddd;border-radius:6px;padding:6px 10px;font-size:12px;width:100%;margin-bottom:8px;font-family:inherit;outline:none;} .finput:focus{border-color:#F5C842;} .save-btn{background:#E63312;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;} .loading{text-align:center;padding:60px;color:#888;}`

function ReferralAdminTab() {
  const [refs, setRefs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id,username,full_name,referred_by,created_at')
      .not('referred_by', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => { setRefs(data || []); setLoading(false) })
  }, [])

  const byReferrer = refs.reduce((acc: Record<string, any>, r: any) => {
    const key = r.referred_by
    if (!acc[key]) acc[key] = { code: key, count: 0, pts: 0 }
    acc[key].count++; acc[key].pts += 50
    return acc
  }, {})
  const ranked = Object.values(byReferrer).sort((a: any, b: any) => b.count - a.count)

  return (
    <>
      <div className="ph"><div className="pt">🎁 Referalet</div><div className="lb">{refs.length} total</div></div>
      <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="sc"><div className="sn">{refs.length}</div><div className="sl">Regjistrime me referim</div></div>
        <div className="sc"><div className="sn">{ranked.length}</div><div className="sl">Referues aktiv</div></div>
        <div className="sc"><div className="sn">{refs.length * 50}</div><div className="sl">Pikë totale dhënë</div></div>
      </div>
      <div className="card"><div className="ct">Top Referues</div>
        {loading ? <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Duke ngarkuar...</div> :
         ranked.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: '#aaa', fontSize: 12 }}>Ende nuk ka referale</div> :
          <table>
            <thead><tr><th>#</th><th>Kodi / Username</th><th>Të ftuar</th><th>Pikë dhënë</th></tr></thead>
            <tbody>
              {ranked.map((r: any, i: number) => (
                <tr key={r.code}>
                  <td style={{ fontWeight: 700, color: '#F5C842' }}>{i + 1}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.code}</td>
                  <td>{r.count}</td>
                  <td style={{ color: '#3B6D11', fontWeight: 700 }}>+{r.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
      <div className="card"><div className="ct">Regjistrime të fundit me referim</div>
        {loading ? null :
          <table>
            <thead><tr><th>Përdoruesi</th><th>Referuar nga</th><th>Data</th></tr></thead>
            <tbody>
              {refs.slice(0, 20).map((r: any) => (
                <tr key={r.id}>
                  <td>{r.full_name || r.username || r.id.slice(0, 8)}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#E63312' }}>{r.referred_by}</td>
                  <td style={{ color: '#888' }}>{new Date(r.created_at).toLocaleDateString('sq-AL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </>
  )
}

export default function Admin() {
  const [tab, setTab] = useState('dash')
  const [stats, setStats] = useState({ users: 0, premium: 0, revenue: 0, listings: 0 })
  const [payments, setPayments] = useState<any[]>([])
  const [methods, setMethods] = useState<any[]>([])
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Client-side admin check (middleware is first line, this is backup)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      const { data: p } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!p?.is_admin) { window.location.href = '/'; return }
      setAuthChecked(true)
      fetchAll()
    })
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ count: u }, { count: pr }, { count: l }, { data: pm }, { data: mt }, { data: cfg }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('premium_subscriptions').select('*,profiles(full_name,username,email:id)').order('created_at', { ascending: false }).limit(30),
      supabase.from('payment_methods').select('*').order('created_at'),
      supabase.from('admin_settings').select('*').order('key'),
    ])
    const rev = (pm || []).filter((p: any) => p.status === 'active').reduce((s: number, p: any) => s + (p.amount_eur || 0), 0)
    setStats({ users: u || 0, premium: pr || 0, revenue: rev, listings: l || 0 })
    setPayments(pm || []); setMethods(mt || []); setSettings(cfg || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string, userId?: string) {
    await supabase.from('premium_subscriptions').update({ status }).eq('id', id)
    if (status === 'active' && userId) {
      const sub = payments.find(p => p.id === id)
      await supabase.from('profiles').update({ is_premium: true, premium_expires_at: sub?.end_date }).eq('id', userId)
    }
    if (status === 'cancelled' && userId) {
      await supabase.from('profiles').update({ is_premium: false }).eq('id', userId)
    }
    fetchAll()
  }

  async function toggleMethod(id: string, cur: boolean) {
    await supabase.from('payment_methods').update({ is_active: !cur }).eq('id', id); fetchAll()
  }

  async function updateSetting(id: string, value: string) {
    await supabase.from('admin_settings').update({ value }).eq('id', id)
  }

  const tabs: [string, string, string][] = [
    ['dash', 'layout-dashboard', 'Dashboard'],
    ['payments', 'credit-card', 'Pagesat'],
    ['methods', 'wallet', 'Metodat'],
    ['settings', 'settings', 'Konfigurime'],
    ['referrals', 'gift', 'Referalet'],
  ]

  if (!authChecked) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111', color: '#F5C842', fontFamily: 'system-ui' }}>Duke verifikuar aksesin...</div>

  return (
    <>
      <style>{CSS}</style>
      <div className="wrap">
        <div className="sb">
          <div className="sb-logo">
            <div className="n">🦅 ALPAZAR</div>
            <div className="r">Admin Panel</div>
          </div>
          {tabs.map(([id, icon, label]) => (
            <button key={id} className={`nl ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
              <i className={`ti ti-${icon}`} /><span>{label}</span>
            </button>
          ))}
          <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '0.5px solid #222' }}>
            <a href="/" style={{ color: '#888', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 12 }} />Kthehu
            </a>
          </div>
        </div>

        <div className="content">
          {loading ? <div className="loading">Duke ngarkuar...</div> : (
            <>
              {tab === 'dash' && (
                <>
                  <div className="ph"><div className="pt">📊 Dashboard</div><div className="lb">● Live</div></div>
                  <div className="stats">
                    <div className="sc"><div className="sn">{stats.users}</div><div className="sl">Përdorues total</div></div>
                    <div className="sc"><div className="sn">{stats.premium}</div><div className="sl">Premium aktiv</div></div>
                    <div className="sc"><div className="sn">{stats.revenue.toFixed(2)}€</div><div className="sl">Të ardhura</div></div>
                    <div className="sc"><div className="sn">{stats.listings}</div><div className="sl">Shpallje aktive</div></div>
                  </div>
                  <div className="card"><div className="ct">Pagesat e fundit</div>
                    <table>
                      <thead><tr><th>Përdoruesi</th><th>Plan</th><th>Shuma</th><th>Statusi</th><th>Veprime</th></tr></thead>
                      <tbody>
                        {payments.length === 0
                          ? <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Nuk ka pagesa</td></tr>
                          : payments.slice(0, 10).map((p: any) => (
                            <tr key={p.id}>
                              <td>{p.profiles?.full_name || p.profiles?.username || '—'}</td>
                              <td>{p.plan === 'monthly' ? 'Mujor' : 'Vjetor'}</td>
                              <td style={{ fontWeight: 700, color: '#1D9E75' }}>{p.amount_eur}€</td>
                              <td><span className={`sb_ ${p.status === 'active' ? 'sa' : p.status === 'pending' ? 'sp_' : 'ss'}`}>{p.status}</span></td>
                              <td>
                                {p.status !== 'active' && <button className="ab ba" onClick={() => updateStatus(p.id, 'active', p.user_id)}>Aktivizo</button>}
                                {p.status === 'active' && <button className="ab bp" onClick={() => updateStatus(p.id, 'suspended')}>Pezullo</button>}
                                <button className="ab bd_" onClick={() => updateStatus(p.id, 'cancelled', p.user_id)}>Anulo</button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === 'payments' && (
                <>
                  <div className="ph"><div className="pt">💳 Menaxhimi i Pagesas</div></div>
                  <div className="card"><div className="ct">Kërkesat për Premium ({payments.length})</div>
                    <table>
                      <thead><tr><th>Përdoruesi</th><th>Plan</th><th>Shuma</th><th>Metoda</th><th>Statusi</th><th>Data</th><th>Veprime</th></tr></thead>
                      <tbody>
                        {payments.length === 0
                          ? <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Nuk ka kërkesa</td></tr>
                          : payments.map((p: any) => (
                            <tr key={p.id}>
                              <td>{p.profiles?.full_name || p.profiles?.username || '—'}</td>
                              <td>{p.plan === 'monthly' ? 'Mujor (1m)' : 'Vjetor (12m)'}</td>
                              <td style={{ fontWeight: 700, color: '#1D9E75' }}>{p.amount_eur}€</td>
                              <td>{p.payment_method || '—'}</td>
                              <td><span className={`sb_ ${p.status === 'active' ? 'sa' : p.status === 'pending' ? 'sp_' : 'ss'}`}>{p.status}</span></td>
                              <td style={{ color: '#888' }}>{new Date(p.created_at).toLocaleDateString('sq-AL')}</td>
                              <td>
                                {p.status !== 'active' && <button className="ab ba" onClick={() => updateStatus(p.id, 'active', p.user_id)}>✓ Aktivizo</button>}
                                {p.status === 'active' && <button className="ab bp" onClick={() => updateStatus(p.id, 'suspended')}>Pezullo</button>}
                                <button className="ab bd_" onClick={() => updateStatus(p.id, 'cancelled', p.user_id)}>Anulo</button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {tab === 'methods' && (
                <>
                  <div className="ph"><div className="pt">💳 Metodat e Pagesës</div></div>
                  <div className="card"><div className="ct">Aktivizo / Çaktivizo</div>
                    {methods.map((m: any) => (
                      <div key={m.id} className="pm-r">
                        <div className="pm-inf"><strong>{m.name}</strong><span>{m.type}</span></div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`tgl ${m.is_active ? 'ton' : 'tof'}`} onClick={() => toggleMethod(m.id, m.is_active)}>
                            <span className="tdot" />
                          </span>
                          <button className="ab bd_" onClick={async () => { await supabase.from('payment_methods').delete().eq('id', m.id); fetchAll() }}>Fshi</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Module 7: Admin — Referral stats tab */}
              {tab === 'referrals' && <ReferralAdminTab />}

              {tab === 'settings' && (
                <>
                  <div className="ph"><div className="pt">⚙️ Konfigurimet</div></div>
                  <div className="card"><div className="ct">Platforma — ndrysho pa rikodifikim</div>
                    {settings.filter((s: any) => ['site_name', 'site_slogan', 'premium_monthly_price', 'premium_yearly_price', 'free_listings_limit', 'free_photos_limit', 'premium_photos_limit'].includes(s.key)).map((s: any) => (
                      <div key={s.id}>
                        <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 3 }}>{s.key.replace(/_/g, ' ').toUpperCase()}</label>
                        <input className="finput" type="text" defaultValue={s.value} onBlur={e => updateSetting(s.id, e.target.value)} />
                      </div>
                    ))}
                  </div>
                  <div className="card"><div className="ct">Veçoritë — aktivizo/çaktivizo</div>
                    {settings.filter((s: any) => s.key.endsWith('_enabled')).map((s: any) => (
                      <div key={s.id} className="cfg-r">
                        <span>{s.key.replace('_enabled', '').replace(/_/g, ' ')}</span>
                        {s.key === 'ads_enabled'
                          ? <span style={{ fontSize: 10, color: '#E63312', fontWeight: 700 }}>🚫 Bllokuar përgjithmonë</span>
                          : <span className={`tgl ${s.value === 'true' ? 'ton' : 'tof'}`}
                            onClick={async () => { const v = s.value === 'true' ? 'false' : 'true'; await supabase.from('admin_settings').update({ value: v }).eq('id', s.id); fetchAll() }}>
                            <span className="tdot" />
                          </span>
                        }
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
