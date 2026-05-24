'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const SHOP_CATEGORIES = [
  { id: '', label: '— Zgjidh kategorinë —' },
  { id: 'elektronike', label: 'Elektronikë' },
  { id: 'makina', label: 'Makina' },
  { id: 'shtepi', label: 'Shtëpi & Kopsht' },
  { id: 'veshje', label: 'Veshje & Aksesore' },
  { id: 'sport', label: 'Sport & Outdoor' },
  { id: 'sherbime', label: 'Shërbime' },
  { id: 'femije', label: 'Fëmijë & Lodra' },
  { id: 'bukuri', label: 'Bukuri & Shëndet' },
]

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myListings, setMyListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile'|'listings'|'shop'>('profile')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', username: '', city: '', bio: '' })
  const [shopForm, setShopForm] = useState({ shop_name: '', shop_description: '', shop_category: '', shop_banner_url: '' })
  const [saving, setSaving] = useState(false)
  const [savingShop, setSavingShop] = useState(false)
  const [msg, setMsg] = useState('')
  const [shopMsg, setShopMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      fetchProfile(session.user.id)
    })
    // Check if redirected with tab param
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'shop') setActiveTab('shop')
  }, [])

  async function fetchProfile(uid: string) {
    const [{ data: p }, { data: ls }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('listings').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ])
    if (p) {
      setProfile(p)
      setForm({ full_name: p.full_name || '', username: p.username || '', city: p.city || '', bio: p.bio || '' })
      setShopForm({ shop_name: p.shop_name || '', shop_description: p.shop_description || '', shop_category: p.shop_category || '', shop_banner_url: p.shop_banner_url || '' })
    }
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
    else { setMsg('ok:Profili u ruajt me sukses!'); setEditing(false); fetchProfile(user.id) }
    setSaving(false)
  }

  async function saveShop() {
    setSavingShop(true); setShopMsg('')
    const { error } = await supabase.from('profiles').update({
      shop_name: shopForm.shop_name.trim(),
      shop_description: shopForm.shop_description.trim(),
      shop_category: shopForm.shop_category,
      shop_banner_url: shopForm.shop_banner_url.trim(),
    }).eq('id', user.id)
    if (error) setShopMsg(`err:${error.message}`)
    else { setShopMsg('ok:Dyqani u ruajt me sukses!'); fetchProfile(user.id) }
    setSavingShop(false)
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
  const [smt, smm] = shopMsg.split(':')

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, maxWidth: 480, margin: '0 auto' }}>
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
        .topbar{background:linear-gradient(180deg,#F5C842,#f0bc30);padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;flex:1;}
        .logout{background:#111;color:#F5C842;border:none;border-radius:8px;padding:7px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}
        .hero{background:linear-gradient(180deg,#111,#1c1c1c);padding:24px 16px;text-align:center;}
        .avatar{width:76px;height:76px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 12px;border:3px solid #F5C842;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.3);}
        .avatar img{width:100%;height:100%;object-fit:cover;}
        .name{font-size:19px;font-weight:700;color:#fff;}
        .handle{font-size:12px;color:#888;margin-top:4px;}
        .email-row{font-size:11px;color:#666;display:flex;align-items:center;gap:6px;margin-top:4px;justify-content:center;}
        .badges-row{display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap;}
        .badge{font-size:10px;padding:4px 10px;border-radius:12px;font-weight:700;}
        .b-prem{background:#F5C842;color:#111;}
        .b-pts{background:#E63312;color:#fff;}
        .b-admin{background:#7C3AED;color:#fff;}
        .b-shop{background:#10B981;color:#fff;}
        .stats-row{display:flex;justify-content:space-around;padding:14px 0;background:#1a1a1a;}
        .stat{text-align:center;}
        .stat-n{font-size:18px;font-weight:800;color:#F5C842;}
        .stat-l{font-size:9px;color:#666;margin-top:2px;}
        /* Tabs */
        .tabs{display:flex;background:#fff;border-bottom:1.5px solid #eee;}
        .tab{flex:1;padding:12px;text-align:center;font-size:11px;font-weight:600;color:#999;border:none;background:none;cursor:pointer;font-family:inherit;border-bottom:2.5px solid transparent;transition:all .15s;}
        .tab.active{color:#E63312;border-bottom-color:#E63312;font-weight:700;}
        .tab i{font-size:15px;display:block;margin-bottom:3px;}
        .body{padding:12px 10px;}
        .msg-box{border-radius:9px;padding:10px 14px;margin-bottom:12px;font-size:12px;font-weight:600;}
        .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
        .err{background:#FFF0EE;color:#E63312;border:0.5px solid #F09595;}
        .card{background:#fff;border-radius:13px;padding:16px;margin-bottom:12px;border:0.5px solid #eee;box-shadow:0 2px 6px rgba(0,0,0,.03);}
        .card-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
        .card-title{font-size:13px;font-weight:700;color:#111;}
        .edit-btn{background:#F5C842;border:none;border-radius:8px;padding:6px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;color:#111;}
        .save-btn{background:#E63312;color:#fff;border:none;border-radius:8px;padding:6px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}
        .info-row{display:flex;align-items:flex-start;padding:8px 0;border-bottom:0.5px solid #f5f5f0;}
        .info-row:last-child{border:none;}
        .info-label{font-size:10px;color:#999;width:90px;flex-shrink:0;margin-top:2px;}
        .info-val{font-size:12px;color:#111;flex:1;}
        label{font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px;margin-top:10px;}
        input,textarea,select{width:100%;border:1.5px solid #ddd;border-radius:10px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;background:#fff;}
        input:focus,textarea:focus,select:focus{border-color:#F5C842;}
        textarea{min-height:80px;resize:vertical;}
        .listing-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:0.5px solid #f5f5f0;cursor:pointer;}
        .listing-row:last-child{border:none;}
        .listing-thumb{width:52px;height:52px;border-radius:9px;background:#f9f5e0;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;}
        .listing-thumb img{width:100%;height:100%;object-fit:cover;}
        .listing-info{flex:1;}
        .listing-title{font-size:12px;font-weight:700;color:#111;}
        .listing-price{font-size:13px;font-weight:700;color:#E63312;margin-top:2px;}
        .listing-meta{font-size:10px;color:#aaa;margin-top:2px;}
        .del-btn{background:#FFF0EE;border:none;border-radius:7px;padding:6px 10px;font-size:12px;cursor:pointer;color:#E63312;font-family:inherit;}
        .prem-card{background:linear-gradient(135deg,#111,#1c1c1c);border-radius:13px;padding:18px;margin-bottom:12px;text-align:center;border:1px solid #333;}
        .prem-card h3{color:#F5C842;font-size:15px;font-weight:700;margin-bottom:8px;}
        .prem-card p{color:#777;font-size:11px;margin-bottom:16px;line-height:1.6;}
        .prem-cta{background:#F5C842;color:#111;border:none;border-radius:10px;padding:12px 26px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
        .admin-btn{background:linear-gradient(135deg,#7C3AED,#6d28d9);color:#fff;border:none;border-radius:10px;padding:11px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px;}
        .shop-preview{background:linear-gradient(135deg,#10B98115,#10B98125);border:1px solid #10B981;border-radius:13px;padding:14px;margin-bottom:14px;display:flex;align-items:center;gap:12px;}
        .shop-preview-icon{width:44px;height:44px;background:#10B981;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .shop-preview-icon i{font-size:22px;color:#fff;}
        .shop-preview-text strong{font-size:12px;font-weight:700;color:#111;display:block;margin-bottom:3px;}
        .shop-preview-text span{font-size:10px;color:#666;}
        .shop-preview-btn{background:#10B981;color:#fff;border:none;border-radius:8px;padding:8px 13px;font-size:11px;font-weight:700;cursor:pointer;margin-left:auto;white-space:nowrap;font-family:inherit;}
        .save-shop-btn{background:#10B981;color:#fff;border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;margin-top:14px;display:flex;align-items:center;justify-content:center;gap:8px;}
        .save-shop-btn i{font-size:16px;}
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
            {profile?.shop_name && <span className="badge b-shop">🏪 Dyqan</span>}
            {profile?.gamification_points > 0 && <span className="badge b-pts">⚡ {profile.gamification_points} pikë</span>}
          </div>
        </div>

        <div className="stats-row">
          <div className="stat">
            <div className="stat-n">{myListings.filter(l => l.is_active).length}</div>
            <div className="stat-l">Shpallje aktive</div>
          </div>
          <div className="stat">
            <div className="stat-n">{myListings.reduce((s, l) => s + (l.views_count || 0), 0).toLocaleString()}</div>
            <div className="stat-l">Shikime totale</div>
          </div>
          <div className="stat">
            <div className="stat-n">{profile?.gamification_level || 'Fillestar'}</div>
            <div className="stat-l">Niveli</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <i className="ti ti-user" />Profili
          </button>
          <button className={`tab ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
            <i className="ti ti-package" />Shpalljet
          </button>
          <button className={`tab ${activeTab === 'shop' ? 'active' : ''}`} onClick={() => setActiveTab('shop')}>
            <i className="ti ti-building-store" />Dyqani
          </button>
        </div>

        <div className="body">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              {msg && <div className={`msg-box ${mt}`}>{mm}</div>}

              {profile?.is_admin && (
                <button className="admin-btn" onClick={() => window.location.href = '/admin'}>
                  <i className="ti ti-shield" /> Paneli i Adminit
                </button>
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
                    <div className="info-row"><span className="info-label">Anëtar që</span><span className="info-val">{new Date(profile?.created_at || Date.now()).toLocaleDateString('sq-AL')}</span></div>
                  </>
                )}
              </div>

              {!profile?.is_premium && (
                <div className="prem-card">
                  <h3>👑 Bëhu Premium — 9.99€/muaj</h3>
                  <p>Dyqan personal · Badge verifikimi · Shpallje të pakufizuara · Statistika të avancuara</p>
                  <button className="prem-cta" onClick={() => window.location.href = '/premium'}>Shiko planin →</button>
                </div>
              )}
            </>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <>
              <div className="card">
                <div className="card-hdr">
                  <span className="card-title">Shpalljet e mia ({myListings.filter(l => l.is_active).length})</span>
                  <button className="edit-btn" onClick={() => window.location.href = '/listing/new'}>+ Shto</button>
                </div>
                {myListings.filter(l => l.is_active).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#aaa', fontSize: 12 }}>
                    <i className="ti ti-package" style={{ fontSize: 36, display: 'block', marginBottom: 10, color: '#F5C842' }} />
                    Nuk ke shpallje aktive.<br />Shto tani falas!
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
                        <div className="listing-meta">👁 {l.views_count || 0} · 📍 {l.city || 'Shqipëri'}{l.is_premium ? ' · ⭐ Premium' : ''}</div>
                      </div>
                      <button className="del-btn" onClick={() => deleteListing(l.id)}>🗑</button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Shop Tab */}
          {activeTab === 'shop' && (
            <>
              {shopMsg && <div className={`msg-box ${smt}`}>{smm}</div>}

              {!profile?.is_premium ? (
                <div className="prem-card">
                  <h3>🏪 Hap Dyqanin Tënd</h3>
                  <p>Dyqani personal është i disponueshëm vetëm për anëtarët Premium. Merr badge ⭐ verifikimi, shpal produkte të pakufizuara dhe menaxho dyqanin tënd!</p>
                  <button className="prem-cta" onClick={() => window.location.href = '/premium'}>👑 Bëhu Premium — 9.99€/muaj</button>
                </div>
              ) : (
                <>
                  {profile?.shop_name && (
                    <div className="shop-preview">
                      <div className="shop-preview-icon"><i className="ti ti-building-store" /></div>
                      <div className="shop-preview-text">
                        <strong>🏪 {profile.shop_name}</strong>
                        <span>{profile.shop_description?.slice(0, 60) || 'Dyqan premium i verifikuar'}...</span>
                      </div>
                      <button className="shop-preview-btn" onClick={() => window.location.href = `/dyqane/${user.id}`}>
                        Shiko →
                      </button>
                    </div>
                  )}

                  <div className="card">
                    <div className="card-hdr">
                      <span className="card-title">🏪 Konfiguro Dyqanin</span>
                    </div>

                    <label>Emri i dyqanit *</label>
                    <input
                      type="text"
                      value={shopForm.shop_name}
                      onChange={e => setShopForm(f => ({ ...f, shop_name: e.target.value }))}
                      placeholder="p.sh. Elektronika Gjoka, Moda Alba..."
                      maxLength={60}
                    />

                    <label>Kategoria kryesore</label>
                    <select value={shopForm.shop_category} onChange={e => setShopForm(f => ({ ...f, shop_category: e.target.value }))}>
                      {SHOP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>

                    <label>Përshkrimi i dyqanit</label>
                    <textarea
                      value={shopForm.shop_description}
                      onChange={e => setShopForm(f => ({ ...f, shop_description: e.target.value }))}
                      placeholder="Përshkruaj dyqanin tënd — çfarë shet, ku je, si kontaktoni..."
                      maxLength={300}
                    />

                    <label>URL e bannerit (opsionale)</label>
                    <input
                      type="url"
                      value={shopForm.shop_banner_url}
                      onChange={e => setShopForm(f => ({ ...f, shop_banner_url: e.target.value }))}
                      placeholder="https://..."
                    />

                    <button
                      className="save-shop-btn"
                      onClick={saveShop}
                      disabled={savingShop || !shopForm.shop_name.trim()}
                    >
                      <i className="ti ti-device-floppy" />
                      {savingShop ? 'Duke ruajtur...' : 'Ruaj Dyqanin'}
                    </button>
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
