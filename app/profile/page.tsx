'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { getLevel, isNewMember } from '../components/Badges'

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

const FN_URL = 'https://sopafwfkrxpcdaljddoh.supabase.co/functions/v1'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myListings, setMyListings] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile'|'listings'|'shop'|'messages'>('profile')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', username: '', city: '', bio: '' })
  const [shopForm, setShopForm] = useState({ shop_name: '', shop_description: '', shop_category: '', shop_banner_url: '' })
  const [saving, setSaving] = useState(false)
  const [savingShop, setSavingShop] = useState(false)
  const [msg, setMsg] = useState('')
  const [shopMsg, setShopMsg] = useState('')

  // Password change
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [passMsg, setPassMsg] = useState('')

  // Account deletion
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState('')

  const listingsChRef = useRef<any>(null)
  const pollRef       = useRef<any>(null)

  useEffect(() => {
    // Kontrollo sesionin dhe dëgjo ndryshimet (p.sh. skadim sesioni)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      fetchProfile(session.user.id)

      const uid = session.user.id
      const refreshListings = () => {
        supabase.from('listings')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .then(({ data }) => { if (data) setMyListings(data) })
      }

      // Poll listingjet çdo 10 sekonda
      pollRef.current = setInterval(refreshListings, 10000)

      // Supabase Realtime si bonus
      const ch = supabase
        .channel(`my-listings-${uid}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'listings',
          filter: `user_id=eq.${uid}`,
        }, refreshListings)
        .subscribe()
      listingsChRef.current = ch
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { window.location.href = '/auth/login' }
    })
    // Check if redirected with tab param
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'shop') setActiveTab('shop')
    return () => {
      subscription.unsubscribe()
      if (listingsChRef.current) supabase.removeChannel(listingsChRef.current)
      clearInterval(pollRef.current)
    }
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
    await fetchConversations(uid)
    setLoading(false)
  }

  async function fetchConversations(uid: string) {
    const { data } = await supabase
      .from('messages')
      .select('id,sender_id,receiver_id,content,created_at,read,listing_id')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (!data || data.length === 0) return

    const threadsMap = new Map<string, any>()
    for (const msg of data) {
      const otherId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id
      if (!threadsMap.has(otherId)) {
        threadsMap.set(otherId, { otherId, lastMsg: msg, unread: 0 })
      }
      if (!msg.read && msg.receiver_id === uid) {
        threadsMap.get(otherId)!.unread++
      }
    }

    const otherIds = Array.from(threadsMap.keys())
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,full_name,username,avatar_url,is_premium,shop_name')
      .in('id', otherIds)
    const pm = new Map((profiles || []).map((p: any) => [p.id, p]))

    const convs = Array.from(threadsMap.values())
      .map(t => ({ ...t, profile: pm.get(t.otherId) || null }))
      .sort((a, b) => new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime())
    setConversations(convs)
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
    window.location.href = '/auth/login'
  }

  async function changePassword() {
    if (newPass.length < 8) { setPassMsg('err:Fjalëkalimi duhet të ketë minimumi 8 karaktere!'); return }
    if (newPass !== newPass2) { setPassMsg('err:Fjalëkalimet nuk përputhen!'); return }
    setSavingPass(true); setPassMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) {
      setPassMsg(`err:${error.message}`)
    } else {
      setPassMsg('ok:Fjalëkalimi u ndryshua me sukses!')
      setNewPass(''); setNewPass2('')
    }
    setSavingPass(false)
  }

  async function deleteAccount() {
    setDeleting(true); setDeleteMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setDeleteMsg('err:Sesioni ka skaduar.'); setDeleting(false); return }
      const res = await fetch(`${FN_URL}/delete-account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setDeleteMsg(`err:${data.error ?? 'Gabim gjatë fshirjes.'}`)
        setDeleting(false)
        return
      }
      await supabase.auth.signOut()
      window.location.href = '/?deleted=1'
    } catch {
      setDeleteMsg('err:Gabim i papritur. Provo sërish.')
      setDeleting(false)
    }
  }

  async function deleteListing(id: string) {
    if (!confirm('Fshi këtë shpallje?')) return
    await supabase.from('listings').update({ is_active: false }).eq('id', id)
    setMyListings(ls => ls.filter(l => l.id !== id))
  }

  const fmt = (price: number, cur: string) =>
    !price ? 'Me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString()} €` : `${price.toLocaleString()} L`

  const [mt, mm] = msg.split(/:(.+)/)
  const [smt, smm] = shopMsg.split(/:(.+)/)

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
        .b-verif{background:#EAF3DE;color:#3B6D11;}
        .b-seller{background:#EEF4FF;color:#185FA5;}
        .b-new{background:#FFF4E5;color:#B45309;}
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
        .edit-listing-btn{background:#FFFBEA;border:1px solid #e0b030;border-radius:7px;padding:6px 10px;font-size:12px;cursor:pointer;color:#856404;font-family:inherit;}
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
        /* Messages inbox */
        .tab-badge{display:inline-flex;align-items:center;justify-content:center;background:#E63312;color:#fff;font-size:8px;font-weight:700;width:15px;height:15px;border-radius:50%;margin-left:3px;vertical-align:middle;}
        .conv-list{display:flex;flex-direction:column;gap:0;}
        .conv-row{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:0.5px solid #f5f5f0;cursor:pointer;transition:background .1s;}
        .conv-row:last-child{border:none;}
        .conv-row:active{background:#f9f5e0;}
        .conv-av{width:48px;height:48px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;overflow:hidden;position:relative;}
        .conv-av img{width:100%;height:100%;object-fit:cover;}
        .unread-dot{position:absolute;top:1px;right:1px;width:12px;height:12px;background:#E63312;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:6px;color:#fff;font-weight:700;}
        .conv-body{flex:1;min-width:0;}
        .conv-name{font-size:13px;font-weight:700;color:#111;display:flex;align-items:center;gap:5px;}
        .conv-prem{font-size:8px;background:#F5C842;color:#111;padding:1px 5px;border-radius:6px;font-weight:700;}
        .conv-preview{font-size:11px;color:#aaa;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .conv-preview.unread{color:#111;font-weight:600;}
        .conv-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;}
        .conv-time{font-size:9px;color:#bbb;}
        .conv-badge{background:#E63312;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;min-width:18px;text-align:center;}
        .inbox-empty{text-align:center;padding:40px 20px;}
        .inbox-empty i{font-size:44px;color:#F5C842;display:block;margin-bottom:12px;}
        .inbox-empty p{font-size:12px;color:#aaa;margin-bottom:16px;line-height:1.6;}
        .inbox-empty-btn{background:#E63312;color:#fff;border:none;border-radius:10px;padding:11px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
        .open-msgs-btn{width:100%;background:#111;color:#F5C842;border:none;border-radius:11px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;}
        .open-msgs-btn i{font-size:17px;}
        /* Security section */
        .pass-wrap{position:relative;}
        .pass-toggle{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#aaa;font-size:13px;padding:4px;}
        .sec-btn{width:100%;background:#111;color:#F5C842;border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:12px;}
        .sec-btn:disabled{opacity:.6;cursor:not-allowed;}
        .danger-zone{background:#FFF0EE;border:1px solid #F09595;border-radius:13px;padding:16px;margin-bottom:12px;}
        .danger-title{font-size:13px;font-weight:700;color:#E63312;margin-bottom:6px;display:flex;align-items:center;gap:6px;}
        .danger-desc{font-size:11px;color:#888;line-height:1.6;margin-bottom:12px;}
        .delete-btn{width:100%;background:#E63312;color:#fff;border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
        .delete-btn:disabled{opacity:.6;cursor:not-allowed;}
        .delete-confirm{background:#fff;border:1.5px solid #E63312;border-radius:10px;padding:14px;margin-top:10px;text-align:center;}
        .delete-confirm p{font-size:12px;color:#111;font-weight:600;margin-bottom:10px;line-height:1.6;}
        .delete-confirm-btns{display:flex;gap:8px;}
        .delete-confirm-btns button:first-child{flex:1;background:#E63312;color:#fff;border:none;border-radius:8px;padding:11px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
        .delete-confirm-btns button:last-child{flex:1;background:#eee;color:#555;border:none;border-radius:8px;padding:11px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
        .msg-sm{font-size:11px;padding:8px 12px;border-radius:8px;margin-top:8px;font-weight:600;}
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
            {(user?.email_confirmed_at || user?.phone_confirmed_at) && <span className="badge b-verif">✓ Verifikuar</span>}
            {profile?.is_premium && <span className="badge b-prem">👑 Premium</span>}
            {profile?.shop_name && <span className="badge b-shop">🏪 Dyqan</span>}
            {(() => { const l = getLevel(profile?.gamification_points || 0); return <span className="badge" style={{ background: l.bg, color: l.color }}>{l.icon} {l.name}</span> })()}
            {myListings.some(l => l.is_active) && <span className="badge b-seller">📦 Shitës aktiv</span>}
            {isNewMember(profile?.created_at) && <span className="badge b-new">🆕 Anëtar i ri</span>}
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
            <div className="stat-n">{getLevel(profile?.gamification_points || 0).name}</div>
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
          <button className={`tab ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
            <i className="ti ti-message-circle" />
            Mesazhet
            {conversations.some(c => c.unread > 0) && (
              <span className="tab-badge">{conversations.reduce((s, c) => s + c.unread, 0)}</span>
            )}
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

              {/* Referral CTA */}
              <div style={{
                background: 'linear-gradient(135deg,#E63312,#c42a0e)',
                borderRadius: 13, padding: 16, marginBottom: 12,
              }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  🎁 Fto miq, fito pikë!
                </div>
                <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginBottom: 12, lineHeight: 1.6 }}>
                  Për çdo mik të regjistruar përmes linkut tënd, fiton <strong>50 pikë</strong> — kumulativisht.
                  {profile?.gamification_points > 0 && ` Ke ${profile.gamification_points} pikë aktualisht.`}
                </div>
                <button
                  style={{ background: '#fff', color: '#E63312', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => window.location.href = '/referral'}
                >
                  🔗 Ndaj linkun tënd →
                </button>
              </div>

              {/* ── Ndrysho Fjalëkalimin ── */}
              <div className="card">
                <div className="card-hdr">
                  <span className="card-title">🔒 Ndrysho Fjalëkalimin</span>
                </div>
                {passMsg && (
                  <div className={`msg-box msg-sm ${passMsg.split(':')[0]}`}>{passMsg.split(/:(.+)/)[1]}</div>
                )}
                <label>Fjalëkalimi i ri (min. 8 karaktere)</label>
                <div className="pass-wrap">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingRight: 36 }}
                  />
                  <button className="pass-toggle" onClick={() => setShowNewPass(v => !v)}>
                    {showNewPass ? '🙈' : '👁️'}
                  </button>
                </div>
                <label>Konfirmo fjalëkalimin e ri</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPass2}
                  onChange={e => setNewPass2(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && changePassword()}
                  autoComplete="new-password"
                />
                <button className="sec-btn" onClick={changePassword} disabled={savingPass || !newPass || !newPass2}>
                  {savingPass ? '⏳ Duke ruajtur...' : '🔒 Ndrysho Fjalëkalimin'}
                </button>
              </div>

              {/* ── Fshi Llogarinë ── */}
              <div className="danger-zone">
                <div className="danger-title">⚠️ Zona e Rrezikshme</div>
                <div className="danger-desc">
                  Fshirja e llogarisë është <strong>e pakthyeshme</strong>. Të gjitha shpalljet dhe të dhënat tuaja do të fshihen përgjithmonë.
                </div>
                {deleteMsg && (
                  <div className={`msg-box msg-sm ${deleteMsg.split(':')[0]}`}>{deleteMsg.split(/:(.+)/)[1]}</div>
                )}
                {!deleteConfirm ? (
                  <button className="delete-btn" onClick={() => setDeleteConfirm(true)}>
                    🗑 Fshi Llogarinë
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p>Je i sigurt? Kjo veprim <strong>nuk mund të kthehet</strong>.<br />Të gjitha të dhënat fshihen përgjithmonë.</p>
                    <div className="delete-confirm-btns">
                      <button onClick={deleteAccount} disabled={deleting}>
                        {deleting ? '⏳ Duke fshirë...' : '✅ Po, fshi llogarinë'}
                      </button>
                      <button onClick={() => { setDeleteConfirm(false); setDeleteMsg('') }}>
                        ✕ Anulo
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                      <button className="edit-listing-btn" onClick={() => window.location.href = `/listing/${l.id}/edit`} title="Ndrysho">✏️</button>
                      <button className="del-btn" onClick={() => deleteListing(l.id)} title="Fshi">🗑</button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <>
              <div className="card">
                <div className="card-hdr">
                  <span className="card-title">💬 Bisedat e mia</span>
                  <button className="edit-btn" onClick={() => window.location.href = '/messages'}>
                    Hap →
                  </button>
                </div>

                {conversations.length === 0 ? (
                  <div className="inbox-empty">
                    <i className="ti ti-messages" />
                    <p>Nuk ke biseda ende.<br />Kontakto një shitës nga shpalljet!</p>
                    <button className="inbox-empty-btn" onClick={() => window.location.href = '/'}>
                      Shfleto shpalljet
                    </button>
                  </div>
                ) : (
                  <div className="conv-list">
                    {conversations.map(conv => {
                      const p = conv.profile
                      const isMe = conv.lastMsg.sender_id === user?.id
                      const name = p?.shop_name || p?.full_name || p?.username || 'Përdorues'
                      const preview = (isMe ? 'Ti: ' : '') + (conv.lastMsg.content?.slice(0, 50) || '...')
                      const time = new Date(conv.lastMsg.created_at)
                      const now = new Date()
                      const diffH = (now.getTime() - time.getTime()) / 3600000
                      const timeStr = diffH < 1 ? 'Tani'
                        : diffH < 24 ? `${Math.floor(diffH)}o`
                        : diffH < 168 ? time.toLocaleDateString('sq-AL', { weekday: 'short' })
                        : time.toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' })

                      return (
                        <div key={conv.otherId} className="conv-row"
                          onClick={() => window.location.href = `/messages?with=${conv.otherId}`}>
                          <div className="conv-av">
                            {p?.avatar_url
                              ? <img src={p.avatar_url} alt={name} />
                              : name.slice(0, 1).toUpperCase()}
                            {conv.unread > 0 && (
                              <span className="unread-dot">{conv.unread > 9 ? '9+' : conv.unread}</span>
                            )}
                          </div>
                          <div className="conv-body">
                            <div className="conv-name">
                              {name}
                              {p?.is_premium && <span className="conv-prem">⭐</span>}
                            </div>
                            <div className={`conv-preview ${conv.unread > 0 ? 'unread' : ''}`}>
                              {preview}
                            </div>
                          </div>
                          <div className="conv-right">
                            <span className="conv-time">{timeStr}</span>
                            {conv.unread > 0 && (
                              <span className="conv-badge">{conv.unread}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <button className="open-msgs-btn" onClick={() => window.location.href = '/messages'}>
                <i className="ti ti-messages" /> Hap Mesazherin e Plotë
              </button>
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
