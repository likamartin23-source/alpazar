'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlpazar } from '../../lib/context'
import { useRealtimeTable } from '../../hooks/useRealtimeTable'
import { UsersTab } from './tabs/UsersTab'
import { PlansTab } from './tabs/PlansTab'
import { LimitsTab } from './tabs/LimitsTab'
import { InvoicesTab } from './tabs/InvoicesTab'
import { AuditTab } from './tabs/AuditTab'
import { BroadcastTab } from './tabs/BroadcastTab'
import { BusinessesTab } from './tabs/BusinessesTab'
import { RolesTab } from './tabs/RolesTab'
import { Trend } from './tabs/Trend'

/* ─── Styles ───────────────────────────────────────────────── */
const CSS = `
*{box-sizing:border-box;margin:0;padding:0;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
.wrap{display:flex;min-height:100vh;background:#f5f5f5;}
.sb{width:190px;background:#111;display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;}
.sb-logo{padding:16px 14px;border-bottom:1px solid #1e1e1e;}
.sb-logo .n{font-size:14px;font-weight:800;color:#F5C842;letter-spacing:.5px;}
.sb-logo .r{font-size:10px;color:#555;margin-top:3px;}
.nl{padding:10px 14px;display:flex;align-items:center;gap:9px;color:#9a9aa5;border-left:3px solid transparent;cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:inherit;transition:background .15s;}
.nl:hover{background:#1a1a1a;}
.nl.on{background:#1a1a1a;border-left-color:#F5C842;color:#F5C842;}
.nl i{font-size:16px;}
.nl span{font-size:11px;font-weight:600;}
.sb-group{font-size:9px;font-weight:800;color:#4a4a55;text-transform:uppercase;letter-spacing:.9px;padding:14px 14px 5px;}
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
.badge{border-radius:999px;padding:3px 10px;font-size:10px;font-weight:700;display:inline-block;}
.ba{background:#EAF3DE;color:#1D9E75;}
.bp{background:#FAEEDA;color:#BA7517;}
.bd{background:#FFF0EE;color:#E63312;}
.btn{border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;margin-right:6px;font-family:inherit;transition:opacity .15s,transform .1s;}
.btn:hover{opacity:.88;transform:translateY(-1px);}
.btn:disabled{opacity:.5;cursor:default;transform:none;}
.btn-green{background:#1D9E75;color:#fff;}
.btn-orange{background:#F5C842;color:#111;}
.btn-red{background:#E63312;color:#fff;}
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
.edit-btn{border:1px solid #eee;background:#fff;color:#111;border-radius:10px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s,border .15s;}
.edit-btn:hover{background:#FDE9E4;border-color:#E63312;color:#E63312;}
.edit-btn:disabled{opacity:.5;cursor:default;}
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
      <div className="ph"><div className="pt"><span aria-hidden="true">🎁</span> Referalet</div></div>
      <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="sc"><div className="sn">{refs.length}</div><div className="sl">Me referim</div></div>
        <div className="sc"><div className="sn">{ranked.length}</div><div className="sl">Referues aktiv</div></div>
        <div className="sc"><div className="sn">{refs.length * 50}</div><div className="sl">Pikë dhënë</div></div>
      </div>
      <div className="card">
        <div className="ct">Top Referues</div>
        {loading ? <p role="status" aria-live="polite" style={{ color: '#aaa', fontSize: 12, padding: '12px 0' }}>Duke ngarkuar...</p> :
          <table>
            <thead><tr><th scope="col">#</th><th scope="col">Kodi</th><th scope="col">Të ftuar</th><th scope="col">Pikë</th></tr></thead>
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
  { key: 'google_login_enabled',  label: 'Hyrja me Google',             desc: 'Shfaq butonin "Google" te faqja e hyrjes', type: 'bool'  },
]

// Çelësa sekretë/integrimesh (tabela admin_settings) — vetëm-shkrim nga paneli.
// Vlerat aktuale s'shfaqen (sekrete); shkruaj një vlerë të re për ta përditësuar.
const SECRETS_SCHEMA: { key: string; label: string; desc: string; secret?: boolean }[] = [
  { key: 'brevo_api_key',    label: 'Brevo API Key',        desc: 'Dërgim email për KËDO (300/ditë falas)', secret: true },
  { key: 'brevo_from_email', label: 'Brevo — Email Dërguesi', desc: 'Adresë e verifikuar në Brevo' },
  { key: 'google_client_id', label: 'Google Client ID',     desc: 'Për hyrjen me Google (GIS)' },
  { key: 'site_name',        label: 'Emri i Faqes',         desc: 'Emri i shfaqur i platformës' },
  { key: 'primary_color',    label: 'Ngjyra Primare',       desc: 'Hex, p.sh. #E63312' },
  { key: 'admin_pin',        label: 'Ndrysho Admin PIN',    desc: '6 shifra — ndryshon PIN-in e këtij paneli', secret: true },
]

// Veprimet e panelit kalojnë përmes /api/admin/action (Edge Function service_role)
// — kalojnë RLS-në is_admin() që bllokonte shkrimet kur admini hyn me PIN.
async function callAdminAction(action: string, params: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const pin = (() => { try { return sessionStorage.getItem('alpazar_admin_pin') || '' } catch { return '' } })()
  try {
    const res = await fetch('/api/admin/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, action, params }),
    })
    return await res.json().catch(() => ({ ok: false, error: 'Përgjigje e pavlefshme' }))
  } catch {
    return { ok: false, error: 'Gabim rrjeti' }
  }
}

function AppConfigTab() {
  const { config } = useAlpazar()
  const [localVals, setLocalVals] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  // sync from context
  useEffect(() => {
    setLocalVals(prev => ({ ...config, ...prev }))
  }, [config])

  const [saveErr, setSaveErr] = useState('')
  const [secretVals, setSecretVals] = useState<Record<string, string>>({})

  const saveSecret = async (key: string) => {
    setSaveErr('')
    const val = (secretVals[key] ?? '').trim()
    if (!val) { setSaveErr(`Shkruaj një vlerë për "${key}".`); return }
    const ok = await writeConfig(key, val, 'admin_settings')
    if (ok) {
      setSaved(prev => ({ ...prev, [key]: true }))
      setSecretVals(prev => ({ ...prev, [key]: '' }))
      setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 2000)
      // Nëse ndryshohet PIN-i, përditëso sesionin që shkrimet e mëtejshme të vazhdojnë
      if (key === 'admin_pin') { try { sessionStorage.setItem('alpazar_admin_pin', val) } catch {} }
    } else {
      setSaveErr(`Nuk u ruajt "${key}". Kontrollo PIN-in ose provo sërish.`)
    }
  }

  // Shkrimi shkon përmes /api/admin/config (Edge Function service_role) — kalon
  // RLS-në is_admin() që bllokonte shkrimet kur admini hyn vetëm me PIN.
  async function writeConfig(key: string, value: string, table: 'app_config' | 'admin_settings' = 'app_config') {
    const pin = (() => { try { return sessionStorage.getItem('alpazar_admin_pin') || '' } catch { return '' } })()
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, key, value, table }),
    })
    const j = await res.json().catch(() => ({ ok: false }))
    return !!j.ok
  }

  const save = async (key: string) => {
    setSaveErr('')
    const val = localVals[key] ?? ''
    const ok = await writeConfig(key, val)
    if (ok) {
      setSaved(prev => ({ ...prev, [key]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 2000)
    } else {
      setSaveErr(`Nuk u ruajt "${key}". Kontrollo PIN-in ose provo sërish.`)
    }
  }

  const toggleBool = async (key: string) => {
    setSaveErr('')
    const cur = (localVals[key] ?? config[key] ?? 'false') === 'true'
    const next = cur ? 'false' : 'true'
    setLocalVals(prev => ({ ...prev, [key]: next }))
    const ok = await writeConfig(key, next)
    if (!ok) {
      // Rollback — shkrimi dështoi, ktheje vlerën e mëparshme
      setLocalVals(prev => ({ ...prev, [key]: cur ? 'true' : 'false' }))
      setSaveErr(`Nuk u ndryshua "${key}". Kontrollo PIN-in ose provo sërish.`)
    }
  }

  const boolKeys  = CONFIG_SCHEMA.filter(s => s.type === 'bool')
  const otherKeys = CONFIG_SCHEMA.filter(s => s.type !== 'bool')
  const isMaint   = (localVals['maintenance_mode'] ?? config['maintenance_mode'] ?? 'false') === 'true'

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">⚙️</span> Konfigurimet Live</div>
        <div className="live-dot"><span aria-hidden="true">●</span> Transmetim Real-Time</div>
      </div>

      {isMaint && (
        <div className="maint-banner">
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <p>Modaliteti i mirëmbajtjes është AKTIV — platforma është bllokuar për përdorues.</p>
          <button type="button" className="btn btn-red" onClick={() => toggleBool('maintenance_mode')}>Çaktivizo</button>
        </div>
      )}

      {saveErr && (
        <div role="alert" style={{ background: '#FFF0EE', border: '1px solid #F09595', color: '#E63312', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, fontWeight: 600 }}>
          {saveErr}
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
                  role="switch"
                  aria-checked={val}
                  aria-label={s.label}
                  tabIndex={0}
                  onClick={() => toggleBool(s.key)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBool(s.key) } }}
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
            <label htmlFor={`cfg-${s.key}`} style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>
              {s.label} <span style={{ color: '#ccc' }}>— {s.desc}</span>
            </label>
            <div className="save-row">
              <input
                id={`cfg-${s.key}`}
                className="finput"
                type={s.type === 'int' || s.type === 'float' ? 'number' : 'text'}
                value={localVals[s.key] ?? config[s.key] ?? ''}
                onChange={e => setLocalVals(prev => ({ ...prev, [s.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && save(s.key)}
              />
              <button type="button" className="save-btn" onClick={() => save(s.key)} style={{ whiteSpace: 'nowrap' }}>
                {saved[s.key] ? <><span aria-hidden='true'>✓</span> Ruajtur</> : 'Ruaj'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="ct"><span aria-hidden="true">🔌</span> Integrime & Sekrete</div>
        <p style={{ fontSize: 10, color: '#aaa', marginBottom: 12, lineHeight: 1.6 }}>
          Ruhen te <code style={{ background: '#eee', padding: '1px 4px', borderRadius: 3 }}>admin_settings</code>. Vlerat aktuale nuk shfaqen për siguri — shkruaj një vlerë të re për ta përditësuar.
        </p>
        {SECRETS_SCHEMA.map(s => (
          <div key={s.key} style={{ marginBottom: 14 }}>
            <label htmlFor={`sec-${s.key}`} style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>
              {s.label} <span style={{ color: '#ccc' }}>— {s.desc}</span>
            </label>
            <div className="save-row">
              <input
                id={`sec-${s.key}`}
                className="finput"
                type={s.secret ? 'password' : 'text'}
                autoComplete="off"
                placeholder={s.secret ? '•••••• (i vendosur)' : 'Vlerë e re…'}
                value={secretVals[s.key] ?? ''}
                onChange={e => setSecretVals(prev => ({ ...prev, [s.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && saveSecret(s.key)}
              />
              <button type="button" className="save-btn" onClick={() => saveSecret(s.key)} style={{ whiteSpace: 'nowrap' }}>
                {saved[s.key] ? <><span aria-hidden='true'>✓</span> Ruajtur</> : 'Ruaj'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: '#f9f9f9', border: '1px dashed #ddd' }}>
        <div className="ct" style={{ color: '#888' }}><span aria-hidden="true">ℹ️</span> Si funksionon?</div>
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
  const [deactivating, setDeactivating] = useState<Record<string, boolean>>({})
  const [adminMsg, setAdminMsg] = useState('')

  const fetchReports = () => {
    supabase.from('reports')
      .select('*,listings(id,title,is_active,seller_id),profiles!reporter_id(username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => { setReports(data || []); setLoading(false) })
  }

  useEffect(() => {
    fetchReports()

    const ch = supabase.channel('mod_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports()
      }).subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  const resolve = async (id: string, action: 'resolved' | 'dismissed') => {
    const r = await callAdminAction('resolve_report', { report_id: id, status: action })
    if (!r.ok) { setAdminMsg('Gabim: ' + (r.error || 'shkrimi dështoi')); return }
    setReports(prev => prev.filter(x => x.id !== id))
  }

  const deactivateListing = async (listingId: string, reportId: string, sellerId: string) => {
    if (!listingId) { setAdminMsg('ID e shpalljes mungon.'); return }
    setDeactivating(prev => ({ ...prev, [reportId]: true }))
    const r = await callAdminAction('remove_listing', { listing_id: listingId, report_id: reportId, seller_id: sellerId })
    setDeactivating(prev => ({ ...prev, [reportId]: false }))
    if (!r.ok) { setAdminMsg('Gabim çaktivizimi: ' + (r.error || 'dështoi')); return }
    setAdminMsg('Shpallja u çaktivizua dhe shitësi u njoftua.')
    fetchReports()
  }

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🛡️</span> Moderimi</div>
        <div className="live-dot"><span aria-hidden="true">●</span> Live</div>
      </div>
      {adminMsg && (() => {
        const isSuccess = adminMsg.startsWith('Shpallja u çaktivizua')
        return (
          <div style={{ background: isSuccess ? '#EAF3DE' : '#FFF0EE', border: isSuccess ? '0.5px solid #97C459' : '0.5px solid #F09595', color: isSuccess ? '#3B6D11' : '#E63312', fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, margin: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}><span aria-hidden="true">{isSuccess ? '✅' : '⚠️'}</span> {adminMsg}</span>
            <button type="button" aria-label="Mbyll mesazhin" onClick={() => setAdminMsg('')} style={{ background: 'none', border: 'none', color: isSuccess ? '#3B6D11' : '#E63312', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        )
      })()}
      <div className="card">
        <div className="ct">Raporte të hapura ({reports.length})</div>
        {loading ? <p role="status" aria-live="polite" style={{ color: '#aaa', fontSize: 12, padding: '12px 0' }}>Duke ngarkuar...</p> :
          reports.length === 0 ? (
            <p style={{ color: '#1D9E75', fontSize: 12, padding: '12px 0', fontWeight: 700 }}><span aria-hidden="true">✓</span> Asnjë raport i hapur</p>
          ) : (
            <table>
              <thead><tr><th scope="col">Shpallja</th><th scope="col">Raportuar nga</th><th scope="col">Arsyeja</th><th scope="col">Data</th><th scope="col">Veprime</th></tr></thead>
              <tbody>{reports.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>
                    {r.listings?.title || '—'}
                    {r.listings?.is_active === false && (
                      <span style={{ marginLeft: 6, background: '#FFF0EE', color: '#E63312', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>çaktivizuar</span>
                    )}
                  </td>
                  <td>{r.profiles?.username || '—'}</td>
                  <td>{r.reason}</td>
                  <td style={{ color: '#888' }}>{new Date(r.created_at).toLocaleDateString('sq-AL')}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button type="button" className="btn btn-green" onClick={() => resolve(r.id, 'resolved')} style={{ fontSize: 11, padding: '4px 10px' }}>✓ Zgjidh</button>
                        <button type="button" className="btn btn-orange" onClick={() => resolve(r.id, 'dismissed')} style={{ fontSize: 11, padding: '4px 10px' }}>Inoro</button>
                      </div>
                      {r.listings?.is_active !== false ? (
                        <button
                          type="button"
                          onClick={() => deactivateListing(r.listings?.id || r.listing_id, r.id, r.listings?.seller_id)}
                          disabled={deactivating[r.id]}
                          style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: deactivating[r.id] ? 'not-allowed' : 'pointer', opacity: deactivating[r.id] ? 0.6 : 1 }}
                        >
                          {deactivating[r.id] ? 'Duke çaktivizuar...' : '🚫 Çaktivizo'}
                        </button>
                      ) : (
                        <span style={{ fontSize: 10, color: '#E63312', fontWeight: 700, padding: '4px 0' }}><span aria-hidden="true">✓</span> Shpallja tashmë çaktive</span>
                      )}
                    </div>
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

/* ─── Takedown Tab ───────────────────────────────────────────── */
function TakedownTab() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState<Record<string, string>>({})
  const [tdErr, setTdErr] = useState('')

  useEffect(() => {
    supabase.from('takedown_requests').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { setRequests(data || []); setLoading(false) })
  }, [])

  const resolve = async (id: string, status: 'resolved' | 'rejected') => {
    setTdErr('')
    // Përmes service_role (kalon RLS is_admin() që s'plotësohet me PIN-login)
    const r = await callAdminAction('resolve_takedown', { id, status, note: note[id] || '' })
    if (!r.ok) { setTdErr('Nuk u ruajt: ' + (r.error || 'provo sërish')); return }
    setRequests(prev => prev.map(x => x.id === id ? { ...x, status } : x))
  }

  const statusBadge: Record<string, string> = { pending: 'bp', resolved: 'ba', rejected: 'bd' }
  const statusLabel: Record<string, string> = { pending: 'Në pritje', resolved: 'Zgjidhur', rejected: 'Refuzuar' }

  return (
    <>
      <div className="ph"><div className="pt"><span aria-hidden="true">⚖️</span> Heqja e Përmbajtjes (Notice &amp; Takedown)</div></div>
      {tdErr && <div role="alert" style={{ background: '#FFF0EE', border: '1px solid #F09595', color: '#E63312', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, fontWeight: 600 }}>{tdErr}</div>}
      <div className="card">
        <div className="ct">Kërkesat ({requests.filter(r => r.status === 'pending').length} të hapura)</div>
        {loading ? <p role="status" aria-live="polite" style={{ color:'#aaa', fontSize:12 }}>Duke ngarkuar...</p> :
          requests.length === 0 ? (
            <p style={{ color:'#1D9E75', fontSize:12, padding:'12px 0', fontWeight:700 }}><span aria-hidden="true">✓</span> Asnjë kërkesë heqje</p>
          ) : (
            <table>
              <thead><tr><th scope="col">Lloji</th><th scope="col">URL</th><th scope="col">Kontakti</th><th scope="col">Përshkrimi</th><th scope="col">Data</th><th scope="col">Statusi</th><th scope="col">Veprime</th></tr></thead>
              <tbody>{requests.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontWeight:700 }}>{r.type}</td>
                  <td style={{ maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.content_url ? <a href={r.content_url} target="_blank" rel="noreferrer" style={{ color:'#185FA5', textDecoration:'none' }}>{r.content_url}</a> : '—'}
                  </td>
                  <td>{r.contact_email || '—'}</td>
                  <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description}</td>
                  <td style={{ color:'#888' }}>{new Date(r.created_at).toLocaleDateString('sq-AL')}</td>
                  <td><span className={`badge ${statusBadge[r.status] || 'bp'}`}>{statusLabel[r.status] || r.status}</span></td>
                  <td>
                    {r.status === 'pending' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <input type="text" aria-label="Shënim për raport (opsional)" className="finput" placeholder="Shënim (opsional)" style={{ fontSize:10, padding:'4px 6px', marginBottom:2 }}
                          value={note[r.id] || ''} onChange={e => setNote(prev => ({ ...prev, [r.id]: e.target.value }))} />
                        <div style={{ display:'flex', gap:4 }}>
                          <button type="button" className="btn btn-red" onClick={() => resolve(r.id, 'resolved')}>Zgjidh</button>
                          <button type="button" className="btn btn-orange" onClick={() => resolve(r.id, 'rejected')}>Refuzo</button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )
        }
      </div>
      <div className="card" style={{ marginTop:16 }}>
        <div className="ct"><span aria-hidden="true">📋</span> Si bëhet dorëzimi?</div>
        <p style={{ fontSize:11, color:'#888', lineHeight:1.7 }}>
          Kërkesat e heqjes dorëzohen përmes faqes <strong>/takedown</strong> ose me email.
          Afati ligjor i përgjigjes: <strong>72 orë</strong> për përmbajtje të paligjshme, <strong>14 ditë</strong> për të drejtat e autorit.
        </p>
      </div>
    </>
  )
}

/* ─── AI Health: gabime prodhimi + diagnozë AI (Groq) ─────────── */
function AIHealthTab() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setErr('Sesioni ka skaduar.'); setLoading(false); return }
      const res = await fetch('/api/monitor', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(json.error || 'Gabim gjatë ngarkimit.'); setEvents([]) }
      else setEvents(json.events || [])
    } catch { setErr('Gabim lidhjeje.') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const sevColor = (s: string) =>
    s === 'critical' ? '#B42318' : s === 'high' ? '#E63312' : s === 'medium' ? '#A05000' : '#1D9E75'

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🩺</span> AI Health — Monitorim në kohë reale</div>
        <button type="button" className="edit-btn" onClick={load} disabled={loading}>
          {loading ? 'Duke ngarkuar…' : '↻ Rifresko'}
        </button>
      </div>
      {err && <div role="alert" style={{ background: '#FEECEC', color: '#B42318', border: '1px solid #F5C2C2', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      {!loading && events.length === 0 && !err && (
        <div style={{ textAlign: 'center', padding: '28px 0', color: '#1D9E75', fontSize: 13 }}>
          <div style={{ fontSize: 34, marginBottom: 8 }} aria-hidden="true">✅</div>
          Asnjë gabim i kapur. Platforma është e shëndetshme.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map(ev => (
          <div key={ev.id} className="card" style={{ padding: 12, borderLeft: `4px solid ${sevColor(ev.severity)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ background: sevColor(ev.severity), color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{ev.severity || 'new'}</span>
              {ev.category && <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{ev.category}</span>}
              <span style={{ fontSize: 10, color: '#aaa' }}>×{ev.count} · {ev.source}</span>
              {ev.is_actionable && <span style={{ fontSize: 10, color: '#1D9E75', fontWeight: 700 }}>● e rregullueshme</span>}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#bbb' }}>{ev.last_seen_at ? new Date(ev.last_seen_at).toLocaleString('sq-AL') : ''}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111', wordBreak: 'break-word' }}>{ev.message}</div>
            {ev.url && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{ev.url}</div>}
            {ev.likely_cause && <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}><strong>Shkaku:</strong> {ev.likely_cause}</div>}
            {ev.suggested_fix && <div style={{ fontSize: 11, color: '#166534', marginTop: 4, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '6px 8px' }}><strong>Rregullim i propozuar (AI):</strong> {ev.suggested_fix}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

/* ─── Main Admin Page ────────────────────────────────────────── */
export default function Admin() {
  const { config } = useAlpazar()
  const [tab, setTab] = useState('dash')
  const [perms, setPerms] = useState<string[] | null>(null)
  const [myRole, setMyRole] = useState('')
  const [trends, setTrends] = useState<any>(null)
  const [trendDays, setTrendDays] = useState(30)
  const [stats, setStats] = useState({ users: 0, premium: 0, revenue: 0, listings: 0, messages: 0, reports: 0 })
  const [payments, setPayments] = useState<any[]>([])
  const [premiumRequests, setPremiumRequests] = useState<any[]>([])
  const [methods, setMethods] = useState<any[]>([])
  const [authChecked, setAuthChecked] = useState(false)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [payMsg, setPayMsg] = useState('')
  const [pmForm, setPmForm] = useState<{id?: string; name: string; type: string; is_active: boolean; sort_order: number; details: string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [liveStats, setLiveStats] = useState({ newListings: 0, newReports: 0 })
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      const { data: p } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!p?.is_admin) { window.location.href = '/'; return }
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
        const { data: factors } = await supabase.auth.mfa.listFactors()
        const totp = factors?.totp?.[0]
        if (totp) {
          setMfaFactorId(totp.id)
          setMfaRequired(true)
          return
        }
      }
      setAuthChecked(true)
      fetchAll()
    })
  }, [])

  // Lejet vijne nga baza, jo nga pamja. Pamja vetem fsheh ate qe nuk vlen.
  useEffect(() => {
    if (!authChecked) return
    supabase.rpc('my_admin_profile').then(({ data }) => {
      const d: any = data || {}
      setPerms(Array.isArray(d.perms) ? d.perms : [])
      setMyRole(d.role || '')
    }, () => setPerms([]))
  }, [authChecked])

  useEffect(() => {
    if (!authChecked) return
    supabase.rpc('admin_trends', { p_days: trendDays })
      .then(({ data }) => { if (data && !(data as any).error) setTrends(data) }, () => {})
  }, [authChecked, trendDays])

  async function verifyAdminMfa() {
    if (totpCode.length !== 6) { setMfaError('Fut kodin 6-shifror!'); return }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactorId, code: totpCode })
    if (error) { setMfaError('Kodi i gabuar!'); return }
    setMfaRequired(false)
    setAuthChecked(true)
    fetchAll()
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [
      { count: u }, { count: pr }, { count: l },
      { count: msgs }, { count: reps },
      { data: pm }, { data: mt }, { data: preq },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('messages').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.rpc('admin_list_subscriptions', { p_limit: 200 }),
      supabase.from('payment_methods').select('*').order('sort_order'),
      supabase.from('premium_requests')
        .select('*,profiles(full_name,username),payment_methods(name,type)').order('created_at', { ascending: false }).limit(100),
    ])
    const subsList = ((pm as any)?.subs || [])
    const rev = subsList.filter((p: any) => p.status === 'active')
      .reduce((s: number, p: any) => s + Number(p.amount_eur || 0), 0)

    // Burimi zyrtar i statistikave — nje RPC e vetme, e njejta e vertete si kudo.
    const { data: st } = await supabase.rpc('admin_stats')
    if (st && !(st as any).error) {
      const s: any = st
      setStats({
        users: s.users_total ?? u ?? 0,
        premium: s.users_premium ?? pr ?? 0,
        revenue: Number(s.mrr_eur ?? rev) || 0,
        listings: s.listings_active ?? l ?? 0,
        messages: s.messages_total ?? msgs ?? 0,
        reports: s.reports_pending ?? reps ?? 0,
      })
    } else {
      setStats({ users: u||0, premium: pr||0, revenue: rev, listings: l||0, messages: msgs||0, reports: reps||0 })
    }
    setPayments(subsList)
    setMethods(mt || [])
    setPremiumRequests(preq || [])
    setLoading(false)
  }, [])

  async function updateStatus(id: string, status: string, _userId?: string) {
    const { data, error } = await supabase.rpc('admin_set_subscription_status', {
      p_sub_id: id, p_status: status,
    })
    if (error || (data as any)?.error) {
      setPayMsg('Gabim ndryshim abonimi: ' + (error?.message || (data as any)?.error))
      return
    }
    fetchAll()
  }

  // Aprovim + leshim + dergim fature ne NJE veprim te vetem.
  // Me pare: aprovoje ketu, gjeje faturen ne tab tjeter, kujtohu ta dergosh.
  async function handlePremiumRequest(id: string, action: 'approved' | 'rejected', _userId: string, _daysRequested: number) {
    const fn = action === 'approved' ? 'admin_approve_request' : 'admin_reject_request'
    const args = action === 'approved' ? { p_request_id: id, p_send_invoice: true } : { p_request_id: id, p_note: null }
    const { data, error } = await supabase.rpc(fn, args)
    if (error || (data as any)?.error) {
      setPayMsg('Gabim: ' + (error?.message || (data as any)?.error))
      return
    }
    const d: any = data
    setPayMsg(action === 'approved'
      ? `Sukses: u aprovua${d?.invoice ? ` · fatura ${d.invoice}` : ''}${d?.sent ? ' u dërgua në inbox' : ''}`
      : 'Kërkesa u refuzua.')
    setPremiumRequests(prev => prev.map(x => x.id === id ? { ...x, status: action } : x))
    fetchAll()
  }

  async function giftPremium(userId: string) {
    const input = window.prompt('Dhuro ditë Premium (fut numrin e ditëve):')
    if (!input) return
    const days = parseInt(input, 10)
    if (isNaN(days) || days <= 0) { setPayMsg('Gabim: numër ditësh i pavlefshëm'); return }
    const r = await callAdminAction('gift_premium', { user_id: userId, days })
    if (!r.ok) { setPayMsg('Gabim dhurimi: ' + (r.error || 'dështoi')); return }
    setPayMsg('Sukses: u dhuruan ' + days + ' ditë Premium!')
    fetchAll()
  }

  async function toggleMethod(id: string, cur: boolean) {
    const r = await callAdminAction('toggle_method', { id, active: !cur })
    if (!r.ok) setPayMsg('Gabim: ' + (r.error || 'dështoi'))
    fetchAll()
  }

  // Realtime — kërkesa të reja pagese. Ky është ekrani ku vonesa kushton para:
  // pa këtë, një pagesë e re nuk dukej derisa dikush rifreskonte faqen.
  const onPreq = useCallback(() => { fetchAll(); setLastUpdated(new Date()) }, [fetchAll])
  useRealtimeTable('premium_requests', null, onPreq, onPreq, onPreq)

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

  async function checkPin() {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      })
      if (res.ok) {
        // Ruaj PIN-in për sesionin — nevojitet nga shkrimet e konfigurimit
        // (/api/admin/config → Edge Function service_role). Pastrohet kur mbyllet tab-i.
        try { sessionStorage.setItem('alpazar_admin_pin', pinInput) } catch {}
        setAdminUnlocked(true)
        setPinError('')
      } else {
        setPinError('PIN i gabuar. Provo sërisht.')
        setPinInput('')
      }
    } catch {
      setPinError('Gabim rrjeti. Provo sërisht.')
    }
  }

  const isMaint = (config['maintenance_mode'] ?? 'false') === 'true'

  // Grupim sipas modelit te paneleve te medha (Meta Business Suite, TikTok, Temu):
  // domene te qarta, jo nje liste e sheshte ku tre tab-e mbulojne te njejten rrjedhe.
  const groupsAll: [string, [string, string, string][]][] = [
    ['Vështrim', [
      ['dash',       'layout-dashboard', 'Dashboard'],
    ]],
    ['Njerëz', [
      ['users',      'users',            'Përdoruesit'],
      ['biznese',    'building-store',   'Bizneset'],
      ['broadcast',  'speakerphone',     'Njoftime'],
      ['referrals',  'gift',             'Referalet'],
    ]],
    ['Të ardhura', [
      ['preq',       'crown',            'Pagesat'],
      ['payments',   'credit-card',      'Abonimet'],
      ['invoices',   'file-invoice',     'Faturat'],
      ['plans',      'diamond',          'Planet'],
      ['methods',    'wallet',           'Metodat'],
    ]],
    ['Përmbajtje', [
      ['moderation', 'shield-check',     'Moderimi'],
      ['takedown',   'gavel',            'Heqja'],
    ]],
    ['Sistemi', [
      ['limits',     'adjustments',      'Kufijtë'],
      ['config',     'settings-2',       'Konfigurime'],
      ['roles',      'key',              'Rolet'],
      ['audit',      'history',          'Gjurma'],
      ['health',     'activity-heartbeat', 'AI Health'],
    ]],
  ]

  // Nje tab qe personi s'e perdor dot nuk shfaqet fare. Kjo nuk eshte siguri —
  // siguria zbatohet ne baze — por eshte pastrim i mendjes dhe mbrojtje nga gabimi.
  const NEVOJA: Record<string, string> = {
    users: 'users.view', biznese: 'business.view', broadcast: 'broadcast.send',
    referrals: 'users.view', preq: 'billing.approve', payments: 'billing.view',
    invoices: 'billing.view', plans: 'billing.plans', methods: 'billing.plans',
    moderation: 'content.moderate', takedown: 'content.moderate',
    limits: 'config.write', config: 'config.write',
    roles: 'audit.view', audit: 'audit.view', health: 'audit.view',
  }
  const lejohet = (id: string) => !perms || !NEVOJA[id] || perms.includes(NEVOJA[id])
  const groups: [string, [string, string, string][]][] = groupsAll
    .map(([g, items]) => [g, items.filter(([id]) => lejohet(id))] as [string, [string, string, string][]])
    .filter(g => g[1].length > 0)
  const tabs: [string, string, string][] = groups.flatMap(g => g[1])

  if (mfaRequired) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#111', flexDirection:'column', gap:20 }}>
      <style dangerouslySetInnerHTML={{ __html: `input[type=text]{background:#1a1a1a;border:1px solid #333;color:#fff;border-radius:8px;padding:12px 16px;font-size:20px;letter-spacing:8px;text-align:center;width:180px;outline:none;font-family:monospace;}` }} />
      <div style={{ fontSize:32 }} aria-hidden="true">🔐</div>
      <div style={{ color:'#F5C842', fontWeight:800, fontSize:16 }}>Verifikimi 2FA i Adminit</div>
      <div style={{ color:'#666', fontSize:12 }}>Fut kodin nga Google Authenticator / Authy</div>
      <input type="text" aria-label="Kodi 2FA (6 shifra)" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={6} value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g,''))} placeholder="000000" onKeyDown={e => e.key === 'Enter' && verifyAdminMfa()} autoFocus />
      {mfaError && <div role="alert" style={{ color:'#E63312', fontSize:12 }}>{mfaError}</div>}
      <button type="button" onClick={verifyAdminMfa} style={{ background:'#F5C842', color:'#111', border:'none', borderRadius:8, padding:'10px 28px', fontWeight:800, fontSize:14, cursor:'pointer' }}>Konfirmo</button>
    </div>
  )

  if (!authChecked) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#111', color:'#F5C842', fontFamily:'system-ui', gap:12 }}>
      <span style={{ fontSize:24 }} aria-hidden="true">🔐</span> Duke verifikuar aksesin...
    </div>
  )

  if (!adminUnlocked) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFFBEA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div style={{ background: '#fff', border: '1.5px solid #f0e6b0', borderRadius: 18, padding: 36, maxWidth: 340, width: '90%', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">🔐</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 6 }}>Admin PIN</h2>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>Fut kodin 6-shifror për të hyrë në panel</p>
          <input
            type="password"
            aria-label="Admin PIN 6-shifror"
            value={pinInput}
            onChange={e => { setPinInput(e.target.value); setPinError('') }}
            onKeyDown={e => { if (e.key === 'Enter') checkPin() }}
            maxLength={6}
            placeholder="••••••"
            autoComplete="off"
            style={{ width: '100%', border: '2px solid #F5C842', borderRadius: 10, padding: '12px', fontSize: 22, textAlign: 'center', letterSpacing: 8, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const, marginBottom: 12 }}
            autoFocus
          />
          {pinError && <div role="alert" style={{ color: '#E63312', fontSize: 12, marginBottom: 10 }}>{pinError}</div>}
          <button
            type="button"
            onClick={checkPin}
            style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Hyr →
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', margin: 0 }}>Paneli Administrativ — Alpazar</h1>

        {/* ── Sidebar ── */}
        <div className="sb">
          <div className="sb-logo">
            <div className="n"><span aria-hidden="true">🦅</span> ALPAZAR</div>
            <div className="r">Admin Panel</div>
            {myRole && (
              <div style={{ marginTop: 6, display: 'inline-block', background: '#1a1a1a',
                color: '#F5C842', borderRadius: 4, padding: '2px 7px', fontSize: 9, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: .5 }}>
                {myRole === 'owner' ? 'Pronar' : myRole === 'admin' ? 'Administrator'
                  : myRole === 'finance' ? 'Financa' : myRole === 'moderator' ? 'Moderator' : 'Mbështetje'}
              </div>
            )}
            {isMaint && (
              <div style={{ marginTop: 8, background: '#E63312', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 700 }}>
                <><span aria-hidden="true">🔧</span> MIRËMBAJTJE</>
              </div>
            )}
          </div>

          {groups.map(([gname, items]) => (
          <div key={gname}>
          <div className="sb-group">{gname}</div>
          {items.map(([id, icon, label]) => (
            <button type="button" key={id} className={`nl ${tab === id ? 'on' : ''}`} aria-pressed={tab === id} onClick={() => setTab(id)}>
              <i className={`ti ti-${icon}`} aria-hidden="true" />
              <span>{label}</span>
              {id === 'moderation' && stats.reports > 0 && (
                <span style={{ marginLeft: 'auto', background: '#E63312', color: '#fff', borderRadius: 10, fontSize: 9, fontWeight: 800, padding: '1px 5px' }}>
                  {stats.reports}
                </span>
              )}
              {id === 'preq' && premiumRequests.filter(r => r.status === 'pending').length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#BA7517', color: '#fff', borderRadius: 10, fontSize: 9, fontWeight: 800, padding: '1px 5px' }}>
                  {premiumRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
          </div>
          ))}

          <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid #1e1e1e' }}>
            <a href="/" style={{ color: '#666', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 13 }} aria-hidden="true" />Kthehu
            </a>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="content">
          {loading && tab !== 'config' ? (
            <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 13 }}>Duke ngarkuar...</div>
          ) : (
            <>
              {/* DASHBOARD */}
              {tab === 'dash' && (
                <>
                  <div className="ph">
                    <div className="pt"><span aria-hidden="true">📊</span> Dashboard</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <div className="live-dot"><span aria-hidden="true">●</span> Live</div>
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

                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>Periudha</span>
                    {[7, 30, 90].map(n => (
                      <button type="button" key={n} className="btn" aria-pressed={trendDays === n}
                        style={{ background: trendDays === n ? '#111' : '#f0f0f0', color: trendDays === n ? '#fff' : '#555' }}
                        onClick={() => setTrendDays(n)}>{n} ditë</button>
                    ))}
                    {trends?.totale && (
                      <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#999' }}>
                        Rimbursuar në periudhë: <strong style={{ color: Number(trends.totale.rimbursime) > 0 ? '#E63312' : '#111' }}>
                          {Number(trends.totale.rimbursime || 0).toLocaleString('sq-AL')}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginBottom: 14 }}>
                    <Trend titull="Të ardhura neto" data={trends?.te_ardhura || []} fusha="shuma" ngjyra="#1D9E75" />
                    <Trend titull="Abonime të reja"  data={trends?.abonime || []} ngjyra="#BA7517" />
                    <Trend titull="Regjistrime"      data={trends?.regjistrime || []} ngjyra="#E63312" />
                    <Trend titull="Shpallje të reja" data={trends?.shpallje || []} ngjyra="#555" />
                  </div>
                  <div className="card">
                    <div className="ct">Pagesat e fundit</div>
                    <table>
                      <thead><tr><th scope="col">Përdoruesi</th><th scope="col">Plan</th><th scope="col">Shuma</th><th scope="col">Statusi</th><th scope="col">Veprime</th></tr></thead>
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
                                {p.status !== 'active'   && <button type="button" className="btn btn-green"  onClick={() => updateStatus(p.id,'active',p.user_id)}>Aktivizo</button>}
                                {p.status === 'active'   && <button type="button" className="btn btn-orange" onClick={() => updateStatus(p.id,'suspended',p.user_id)}>Pezullo</button>}
                                <button type="button" className="btn btn-red" onClick={() => updateStatus(p.id,'cancelled',p.user_id)}>Anulo</button>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* PREMIUM REQUESTS (KOMA 4-c) */}
              {tab === 'preq' && (
                <>
                  <div className="ph">
                    <div className="pt"><span aria-hidden="true">💳</span> Pagesat Premium</div>
                    {premiumRequests.filter(r => r.status === 'pending').length > 0 && (
                      <span style={{ background: '#E63312', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 800, padding: '3px 9px' }}>
                        {premiumRequests.filter(r => r.status === 'pending').length} të reja
                      </span>
                    )}
                  </div>
                  {payMsg && (
                    <div style={{ background: payMsg.startsWith('Sukses') ? '#EAF3DE' : '#FFF0EE', border: payMsg.startsWith('Sukses') ? '0.5px solid #97C459' : '0.5px solid #F09595', color: payMsg.startsWith('Sukses') ? '#3B6D11' : '#E63312', fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1 }}>{payMsg}</span>
                      <button type="button" aria-label="Mbyll mesazhin" onClick={() => setPayMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                  )}
                  <div className="card">
                    {premiumRequests.length === 0 ? (
                      <p style={{ color: '#aaa', fontSize: 12, padding: '12px 0' }}>Asnjë kërkesë premium</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th scope="col">Përdoruesi</th>
                            <th scope="col">Plan</th>
                            <th scope="col">Shuma</th>
                            <th scope="col">Metoda e Pagesës</th>
                            <th scope="col">Data</th>
                            <th scope="col">Statusi</th>
                            <th scope="col">Veprime</th>
                          </tr>
                        </thead>
                        <tbody>
                          {premiumRequests.map((r: any) => (
                            <tr key={r.id}>
                              <td style={{ fontWeight: 700 }}>{r.profiles?.full_name || r.profiles?.username || '—'}</td>
                              <td>{r.plan === 'yearly' ? 'Vjetor' : 'Mujor'}</td>
                              <td style={{ fontWeight: 700, color: '#1D9E75' }}>{r.amount} ALL</td>
                              <td>{r.payment_methods?.name || '—'}</td>
                              <td style={{ color: '#888' }}>{new Date(r.created_at).toLocaleDateString('sq-AL')}</td>
                              <td>
                                <span className={`badge ${r.status === 'approved' ? 'ba' : r.status === 'pending' ? 'bp' : 'bd'}`}>
                                  {r.status === 'approved' ? 'Aprovuar' : r.status === 'rejected' ? 'Refuzuar' : 'Në pritje'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {r.status === 'pending' && (
                                    <>
                                      <button type="button" className="btn btn-green" onClick={() => handlePremiumRequest(r.id, 'approved', r.user_id, r.days_requested || 30)}>
                                        <span aria-hidden="true">✅</span> Aprovo + faturë
                                      </button>
                                      <button type="button" className="btn btn-red" onClick={() => handlePremiumRequest(r.id, 'rejected', r.user_id, r.days_requested || 30)}>
                                        <span aria-hidden="true">❌</span> Refuzo
                                      </button>
                                    </>
                                  )}
                                  <button type="button" className="btn btn-orange" onClick={() => giftPremium(r.user_id)}>
                                    <span aria-hidden="true">🎁</span> Dhuratë
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}

              {/* PAYMENTS (legacy subscriptions) */}
              {tab === 'payments' && (
                <>
                  <div className="ph"><div className="pt"><span aria-hidden="true">💳</span> Abonimet</div></div>
                  {payMsg && (
                    <div style={{ background: '#FFF0EE', border: '0.5px solid #F09595', color: '#E63312', fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, margin: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ flex: 1 }}><span aria-hidden="true">⚠️</span> {payMsg}</span>
                      <button type="button" aria-label="Mbyll mesazhin" onClick={() => setPayMsg('')} style={{ background: 'none', border: 'none', color: '#E63312', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                  )}

                  {/* Premium Requests (FAZA 4-c) */}
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="ct">
                      <><span aria-hidden="true">🎁</span> Kërkesat Premium</>
                      {premiumRequests.filter(r => r.status === 'pending').length > 0 && (
                        <span style={{ background: '#E63312', color: '#fff', borderRadius: 10, fontSize: 9, fontWeight: 800, padding: '1px 7px' }}>
                          {premiumRequests.filter(r => r.status === 'pending').length} të reja
                        </span>
                      )}
                    </div>
                    {premiumRequests.length === 0 ? (
                      <p style={{ color: '#aaa', fontSize: 12 }}>Asnjë kërkesë premium</p>
                    ) : (
                      <table>
                        <thead><tr><th scope="col">Përdoruesi</th><th scope="col">Plan</th><th scope="col">Statusi</th><th scope="col">Data</th><th scope="col">Veprime</th></tr></thead>
                        <tbody>{premiumRequests.map((r: any) => (
                          <tr key={r.id}>
                            <td>{r.profiles?.full_name || r.profiles?.username || '—'}</td>
                            <td>{r.plan === 'yearly' ? 'Vjetor' : 'Mujor'}</td>
                            <td>
                              <span className={`badge ${r.status === 'approved' || r.status === 'gifted' ? 'ba' : r.status === 'pending' ? 'bp' : 'bd'}`}>
                                {r.status === 'approved' ? 'Aprovuar' : r.status === 'rejected' ? 'Refuzuar' : r.status === 'gifted' ? <><span aria-hidden='true'>🎁</span> Dhuruar</> : 'Në pritje'}
                              </span>
                            </td>
                            <td style={{ color: '#888' }}>{new Date(r.created_at).toLocaleDateString('sq-AL')}</td>
                            <td>
                              {r.status === 'pending' && (
                                <>
                                  <button type="button" className="btn btn-green" onClick={() => handlePremiumRequest(r.id, 'approved', r.user_id, r.days_requested || 30)}><span aria-hidden="true">✓</span> Aprovo</button>
                                  <button type="button" className="btn btn-orange" onClick={() => giftPremium(r.user_id)}><span aria-hidden="true">🎁</span> Dhuratë</button>
                                  <button type="button" className="btn btn-red" onClick={() => handlePremiumRequest(r.id, 'rejected', r.user_id, r.days_requested || 30)}><span aria-hidden="true">✕</span> Refuzo</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}</tbody>
                      </table>
                    )}
                  </div>

                  <div className="card">
                    <table>
                      <thead><tr><th scope="col">Përdoruesi</th><th scope="col">Plan</th><th scope="col">Shuma</th><th scope="col">Metoda</th><th scope="col">Statusi</th><th scope="col">Data</th><th scope="col">Veprime</th></tr></thead>
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
                                {p.status!=='active' && <button type="button" aria-label="Aktivizo" className="btn btn-green" onClick={() => updateStatus(p.id,'active',p.user_id)}>✓</button>}
                                {p.status==='active' && <button type="button" aria-label="Pezullo" className="btn btn-orange" onClick={() => updateStatus(p.id,'suspended',p.user_id)}>⏸</button>}
                                <button type="button" aria-label="Anulo" className="btn btn-red" onClick={() => updateStatus(p.id,'cancelled',p.user_id)}>✕</button>
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
                  <div className="ph"><div className="pt"><span aria-hidden="true">💳</span> Metodat e Pagesës</div></div>
                  <div className="card">
                    <div className="ct">Aktivizo / Çaktivizo / Redakto</div>
                    {methods.map((m: any) => (
                      <div key={m.id} className="pm-r" style={{ cursor: 'pointer' }} onClick={() => setPmForm({ id: m.id, name: m.name, type: m.type, is_active: m.is_active, sort_order: m.sort_order ?? 0, details: m.details ?? '' })}>
                        <div className="pm-inf">
                          <strong>{m.name}</strong>
                          <span>{m.type}</span>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span role="switch" aria-checked={m.is_active} tabIndex={0} className={`tgl ${m.is_active ? 'tgl-on' : 'tgl-off'}`} onClick={e => { e.stopPropagation(); toggleMethod(m.id, m.is_active) }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleMethod(m.id, m.is_active) }}>
                            <span className="tdot" />
                          </span>
                          <button type="button" className="btn btn-red" onClick={async e => { e.stopPropagation(); const { error } = await supabase.from('payment_methods').delete().eq('id',m.id); if (error) setPayMsg('Gabim: ' + error.message); fetchAll() }}>Fshi</button>
                        </div>
                      </div>
                    ))}
                    {methods.length === 0 && <p style={{ color:'#aaa', fontSize:12 }}>Nuk ka metoda pagese</p>}
                    <button type="button" className="btn" style={{ marginTop: 12 }} onClick={() => setPmForm({ name: '', type: 'card', is_active: true, sort_order: methods.length, details: '' })}>
                      <span aria-hidden="true">+</span> Shto metodë
                    </button>
                  </div>

                  {pmForm !== null && (
                    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} role="dialog" aria-modal="true" aria-label="Forma metodës së pagesës" onClick={e => { if (e.target === e.currentTarget) setPmForm(null) }}>
                      <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:360 }}>
                        <div style={{ fontWeight:700, marginBottom:16 }}>{pmForm.id ? 'Redakto metodën' : 'Shto metodë të re'}</div>
                        {(['name','details'] as const).map(field => (
                          <div key={field} style={{ marginBottom:10 }}>
                            <label style={{ fontSize:11, fontWeight:600, color:'#555', display:'block', marginBottom:4 }}>{field === 'name' ? 'Emri' : 'Detaje (IBAN / numër)'}</label>
                            <input type="text" value={(pmForm as any)[field]} onChange={e => setPmForm(f => f && ({ ...f, [field]: e.target.value }))} style={{ width:'100%', border:'1.5px solid #ddd', borderRadius:8, padding:'8px 10px', fontSize:13, boxSizing:'border-box' }} />
                          </div>
                        ))}
                        <div style={{ marginBottom:10 }}>
                          <label style={{ fontSize:11, fontWeight:600, color:'#555', display:'block', marginBottom:4 }}>Tipi</label>
                          <select value={pmForm.type} onChange={e => setPmForm(f => f && ({ ...f, type: e.target.value }))} style={{ width:'100%', border:'1.5px solid #ddd', borderRadius:8, padding:'8px 10px', fontSize:13 }}>
                            {['card','paypal','bank','mobile','wallet'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div style={{ marginBottom:10 }}>
                          <label style={{ fontSize:11, fontWeight:600, color:'#555', display:'block', marginBottom:4 }}>Rend ({pmForm.sort_order})</label>
                          <input type="number" value={pmForm.sort_order} onChange={e => setPmForm(f => f && ({ ...f, sort_order: Number(e.target.value) }))} style={{ width:'100%', border:'1.5px solid #ddd', borderRadius:8, padding:'8px 10px', fontSize:13 }} />
                        </div>
                        <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, cursor:'pointer' }}>
                          <input type="checkbox" checked={pmForm.is_active} onChange={e => setPmForm(f => f && ({ ...f, is_active: e.target.checked }))} />
                          <span style={{ fontSize:13 }}>Aktiv</span>
                        </label>
                        <div style={{ display:'flex', gap:8 }}>
                          <button type="button" className="btn" style={{ flex:1 }} onClick={async () => {
                            if (!pmForm.name.trim()) { setPayMsg('err:Emri është i detyrueshëm'); return }
                            const payload = { name: pmForm.name.trim(), type: pmForm.type, is_active: pmForm.is_active, sort_order: pmForm.sort_order, details: pmForm.details.trim() }
                            const { error } = pmForm.id
                              ? await supabase.from('payment_methods').update(payload).eq('id', pmForm.id)
                              : await supabase.from('payment_methods').insert(payload)
                            if (error) setPayMsg('Gabim: ' + error.message)
                            else { setPayMsg('✅ Ruajtur!'); setPmForm(null); fetchAll() }
                          }}>Ruaj</button>
                          <button type="button" className="btn" style={{ flex:1, background:'#f5f5f5', color:'#111' }} onClick={() => setPmForm(null)}>Anulo</button>
                        </div>
                        {payMsg && <div style={{ marginTop:8, fontSize:12, color: payMsg.startsWith('err') ? '#E63312' : '#1D9E75' }}>{payMsg.replace(/^(err:|✅ )/, '')}</div>}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* APP CONFIG - REAL-TIME */}
              {tab === 'config' && <AppConfigTab />}

              {/* MODERATION */}
              {tab === 'moderation' && <ModerationTab />}

              {/* AI HEALTH */}
              {tab === 'health' && <AIHealthTab />}

              {/* REFERRALS */}
              {tab === 'referrals' && <ReferralTab />}

              {/* TAKEDOWN */}
              {tab === 'takedown' && <TakedownTab />}

              {tab === 'users' && <UsersTab />}
              {tab === 'plans' && <PlansTab />}
              {tab === 'limits' && <LimitsTab />}
              {tab === 'invoices' && <InvoicesTab />}
              {tab === 'roles' && <RolesTab />}
              {tab === 'audit' && <AuditTab />}
              {tab === 'broadcast' && <BroadcastTab />}
              {tab === 'biznese' && <BusinessesTab />}
            </>
          )}
        </div>
      </div>
    </>
  )
}
