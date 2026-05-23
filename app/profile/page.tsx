'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myListings, setMyListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', username: '', city: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      fetchProfile(session.user.id)
    })
  }, [])

  async function fetchProfile(uid: string) {
    const [{ data: p }, { data: ls }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('listings').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ])
    if (p) { setProfile(p); setForm({ full_name: p.full_name || '', username: p.username || '', city: p.city || '', bio: p.bio || '' }) }
    if (ls) setMyListings(ls)
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true); setMsg('')
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name.trim(),
      username: form.username.trim().toLowerCase().replace(/\s+/g, '_'),
      city: form.city,
      bio: form.bio.trim(),
    }).eq('id', user.id)
    if (error) setMsg(`err:${error.message}`)
    else { setMsg('ok:Profili u ruajt!'); setEditing(false); fetchProfile(user.id) }
    setSaving(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function deleteListing(id: string) {
    if (!confirm('Fshi këtë shpallje?')) return
    await supabase.from('listings').update({ is_active: false }).eq('id', id)
    setMyListings(ls => ls.filter(l => l.id !== id))
  }

  const fmt = (price: number, cur: string) =>
    !price ? 'Me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString()} €` : `${price.toLocaleString()} L`

  const [mt, mm] = msg.split(':')

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 10px' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:30px;}
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;flex:1;}
        .logout{background:#111;color:#F5C842;border:none;border-radius:7px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}
        .hero{background:#111;padding:24px 16px;text-align:center;}
        .avatar{width:72px;height:72px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 12px;border:3px solid #F5C842;overflow:hidden;}
        .avatar img{width:100%;height:100%;object-fit:cover;}
        .name{font-size:18px;font-weight:700;color:#fff;}
        .handle{font-size:12px;color:#888;margin-top:4px;}
        .badges-row{display:flex;gap:8px;justify-content:center;margin-top:10px;}
        .badge{font-size:10px;padding:3px 9px;border-radius:12px;font-weight:700;}
        .b-prem{background:#F5C842;color:#111;}
        .b-pts{background:#E63312;color:#fff;}
        .b-admin{background:#7C3AED;color:#fff;}
        .stats-row{display:flex;justify-content:space-around;padding:14px 0;background:#1a1a1a;}
        .stat{text-align:center;}
        .stat-n{font-size:18px;font-weight:700;color:#F5C842;}
        .stat-l{font-size:9px;color:#666;margin-top:2px;}
        .body{padding:12px 10px;}
        .msg-box{border-radius:9px;padding:10px 14px;margin-bottom:12px;font-size:12px;font-weight:600;}
        .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
        .err{background:#FFF0EE;color:#E63312;border:0.5px solid #F09595;}
        .card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;border:0.5px solid #eee;}
        .card-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
        .card-title{font-size:13px;font-weight:700;color:#111;}
        .edit-btn{background:#F5C842;border:none;border-radius:7px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;color:#111;}
        .save-btn{background:#E63312;color:#fff;border:none;border-radius:7px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}
        .info-row{display:flex;align-items:flex-start;padding:7px 0;border-bottom:0.5px solid #f0f0f0;}
        .info-row:last-child{border:none;}
        .info-label{font-size:10px;color:#888;width:90px;flex-shrink:0;margin-top:2px;}
        .info-val{font-size:12px;color:#111;flex:1;}
        label{font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px;margin-top:8px;}
        input,textarea,select{width:100%;border:1.5px solid #ddd;border-radius:9px;padding:9px 13px;font-size:13px;font-family:inherit;outline:none;}
        input:focus,textarea:focus{border-color:#F5C842;}
        textarea{min-height:70px;resize:vertical;}
        .listing-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:0.5px solid #f0f0f0;cursor:pointer;}
        .listing-row:last-child{border:none;}
        .listing-thumb{width:50px;height:50px;border-radius:8px;background:#f9f5e0;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;}
        .listing-thumb img{width:100%;height:100%;object-fit:cover;}
        .listing-info{flex:1;}
        .listing-title{font-size:12px;font-weight:700;color:#111;}
        .listing-price{font-size:13px;font-weight:700;color:#E63312;margin-top:2px;}
        .listing-meta{font-size:10px;color:#aaa;margin-top:2px;}
        .del-btn{background:#FFF0EE;border:none;border-radius:6px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer;color:#E63312;font-family:inherit;}
        .prem-card{background:#111;border-radius:12px;padding:16px;margin-bottom:12px;text-align:center;}
        .prem-card h3{color:#F5C842;font-size:15px;font-weight:700;margin-bottom:6px;}
        .prem-card p{color:#888;font-size:11px;margin-bottom:14px;line-height:1.6;}
        .prem-cta{background:#F5C842;color:#111;border:none;border-radius:9px;padding:11px 24px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
        .admin-btn{background:#7C3AED;color:#fff;border:none;border-radius:9px;padding:10px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;margin-bottom:12px;}
        .email-row{font-size:11px;color:#666;display:flex;align-items:center;gap:6px;margin-top:4px;justify-content:center;}
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <button className="back" onClick={() => window.location.href = '/'}>
            <i className="ti ti-arrow-left" />
          </button>
          <span className="topbar-title">Profili im</span>
          <button className="logout" onClick={signOut}>Dil ↗</button>
        </div>

        <div className="hero">
          <div className="avatar">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : '👤'}
          </div>
          <div className="name">{profile?.full_name || profile?.username || 'Përdoruesi'}</div>
          {profile?.username && <div className="handle">@{profile.username}</div>}
          <div className="email-row"><i className="ti ti-mail" />{user?.email}</div>
          <div className="badges-row">
            {profile?.is_admin && <span className="badge b-admin">🛡 Admin</span>}
            {profile?.is_premium && <span className="badge b-prem">👑 Premium</span>}
            {profile?.gamification_points > 0 && <span className="badge b-pts">⚡ {profile.gamification_points} pikë</span>}
          </div>
        </div>

        <div className="stats-row">
          <div className="stat">
            <div className="stat-n">{myListings.filter(l => l.is_active).length}</div>
            <div className="stat-l">Shpallje aktive</div>
          </div>
          <div className="stat">
            <div className="stat-n">{myListings.reduce((s, l) => s + (l.views_count || 0), 0)}</div>
            <div className="stat-l">Shikime totale</div>
          </div>
          <div className="stat">
            <div className="stat-n">{profile?.gamification_level || 'Fillestar'}</div>
            <div className="stat-l">Niveli</div>
          </div>
        </div>

        <div className="body">
          {msg && <div className={`msg-box ${mt}`}>{mm}</div>}

          {profile?.is_admin && (
            <button className="admin-btn" onClick={() => window.location.href = '/admin'}>
              🛡 Shko te Paneli i Adminit
            </button>
          )}

          {!profile?.is_premium && (
            <div className="prem-card">
              <h3>👑 Bëhu Premium — 9.99€/muaj</h3>
              <p>Dyqan personal · Badge verifikimi · Shpallje të pakufizuara · Statistika të avancuara</p>
              <button className="prem-cta" onClick={() => window.location.href = '/premium'}>Shiko planin →</button>
            </div>
          )}

          <div className="card">
            <div className="card-hdr">
              <span className="card-title">Informacioni personal</span>
              {editing
                ? <button className="save-btn" onClick={saveProfile} disabled={saving}>{saving ? '⏳' : 'Ruaj'}</button>
                : <button className="edit-btn" onClick={() => setEditing(true)}>✏️ Ndrysho</button>
              }
            </div>

            {editing ? (
              <>
                <label>Emri i plotë</label>
                <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Emri Mbiemri" />
                <label>Username</label>
                <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username123" />
                <label>Qyteti</label>
                <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                  <option value="">— Zgjidh —</option>
                  {['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat', 'Sarandë', 'Tjetër'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label>Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Pak fjalë rreth vetes..." maxLength={300} />
              </>
            ) : (
              <>
                <div className="info-row"><span className="info-label">Emri</span><span className="info-val">{profile?.full_name || '—'}</span></div>
                <div className="info-row"><span className="info-label">Username</span><span className="info-val">{profile?.username ? `@${profile.username}` : '—'}</span></div>
                <div className="info-row"><span className="info-label">Qyteti</span><span className="info-val">{profile?.city || '—'}</span></div>
                <div className="info-row"><span className="info-label">Bio</span><span className="info-val">{profile?.bio || '—'}</span></div>
                <div className="info-row"><span className="info-label">Anëtarësi</span><span className="info-val">{new Date(profile?.created_at || Date.now()).toLocaleDateString('sq-AL')}</span></div>
              </>
            )}
          </div>

          <div className="card">
            <div className="card-hdr">
              <span className="card-title">Shpalljet e mia ({myListings.filter(l => l.is_active).length})</span>
              <button className="edit-btn" onClick={() => window.location.href = '/listing/new'}>+ Shto</button>
            </div>
            {myListings.filter(l => l.is_active).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#aaa', fontSize: 12 }}>
                <i className="ti ti-package" style={{ fontSize: 32, display: 'block', marginBottom: 8, color: '#e0b030' }} />
                Nuk ke shpallje aktive. Shto tani!
              </div>
            ) : (
              myListings.filter(l => l.is_active).map(l => (
                <div key={l.id} className="listing-row">
                  <div className="listing-thumb" onClick={() => window.location.href = `/listing/${l.id}`}>
                    {l.images?.[0] ? <img src={l.images[0]} alt="" /> : <i className="ti ti-photo" style={{ color: '#ccc', fontSize: 20 }} />}
                  </div>
                  <div className="listing-info" onClick={() => window.location.href = `/listing/${l.id}`}>
                    <div className="listing-title">{l.title}</div>
                    <div className="listing-price">{fmt(l.price, l.currency)}</div>
                    <div className="listing-meta">👁 {l.views_count || 0} · 📍 {l.city || 'Shqipëri'}</div>
                  </div>
                  <button className="del-btn" onClick={() => deleteListing(l.id)}>🗑</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
