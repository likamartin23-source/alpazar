'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import Avatar, { tierNgaProfili } from '../components/Avatar'
import { supabase } from '../../lib/supabase'
import { SITE_URL } from '../../lib/siteConfig'
import { getLevel, isNewMember } from '../components/Badges'
import { monthYear } from '../../lib/format'
import { SkeletonProfile, SkeletonList } from '../components/Skeleton'

const FN_URL = 'https://sopafwfkrxpcdaljddoh.supabase.co/functions/v1'

function BizUpsellBanner({ userId, isPremium }: { userId?: string; isPremium?: boolean }) {
  const [hasBiz, setHasBiz] = useState<boolean | null>(null)
  useEffect(() => {
    if (!userId) return
    supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('owner_id', userId)
      .then(({ count }) => setHasBiz((count ?? 0) > 0))
  }, [userId])
  if (hasBiz !== false) return null
  // §1B: krijimi i biznesit eshte vecori Premium. Jo-premium -> ftese te /premium.
  const dest = isPremium ? '/biznese/new' : '/premium'
  return (
    <div
      role="link" tabIndex={0}
      onClick={() => window.location.href = dest}
      onKeyDown={e => { if (e.key === 'Enter') window.location.href = dest }}
      style={{ background: 'linear-gradient(135deg,#111,#1c1c1c)', borderRadius: 13, padding: '14px 16px', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <span style={{ fontSize: 28 }} aria-hidden="true">🏢</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#F5C842', marginBottom: 3 }}>Krijo Biznes Online</div>
        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>{isPremium
          ? <>Faqe e dedikuar · Shpallje pa limit · Badge <span aria-hidden="true">✓</span> Biznes</>
          : <><span aria-hidden="true">👑</span> Veçori Premium · Faqe e dedikuar · Badge <span aria-hidden="true">✓</span> Biznes</>}</div>
      </div>
      <i className="ti ti-chevron-right" style={{ color: '#F5C842', fontSize: 18 }} aria-hidden="true" />
    </div>
  )
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myListings, setMyListings] = useState<any[]>([])
  // FAZA 4 (BLLOKU Skema 1): filtri i shpalljeve + kufiri nga entitlements (JO i ngurtesuar
  // ne kod — vjen nga get_my_entitlements → app_config). -1 = pa limit (premium).
  const [listFilter, setListFilter] = useState<'active'|'paused'|'sold'>('active')
  const [maxListings, setMaxListings] = useState<number | null>(null)
  // 168 ore = 7 dite: sjellja e derisotme si vlere rezerve, qe nje deshtim
  // rrjeti te mos e beje ftohjen me te lire nga sa eshte vendosur.
  const [bumpOre, setBumpOre] = useState(168)
  const [bumpMsg, setBumpMsg] = useState('')
  const [reactBusy, setReactBusy] = useState<string | null>(null)
  const [reactMsg, setReactMsg] = useState('')
  const [savedListings, setSavedListings] = useState<any[]>([])
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile'|'listings'|'saved'|'shop'|'messages'>('profile')
  // FAZA 3 (BLLOKU Imazhi 6a): tabi "Profili" ndahet ne nen-pamje permes nen-butonave.
  // Koka dhe tabet mbeten identike; kartat ekzistuese vetem grupohen, s'krijohet sistem i ri.
  const [profSub, setProfSub] = useState<'menu'|'tedhena'|'siguri'>('menu')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', username: '', city: '', bio: '' })
  // FAZA 5 (BLLOKU Skema 2=A): biznesi REAL nga tabela `businesses` (jo legacy shop_*).
  // Butoni një hyrje, tri gjendje. Faqja /biznese/[id] është nën-paneli "Vepro si"
  // (BiznesPageClient ka tashmë kontrollet e pronarit). Krijimi te /biznese/new (§1B premium).
  const [myBiz, setMyBiz] = useState<{ id: string; name: string; is_verified: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Email change
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

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
  const [deletePassword, setDeletePassword] = useState('')

  const [profileCopied, setProfileCopied] = useState(false)

  // Listing deletion inline confirm
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [pendingSold, setPendingSold]     = useState<string | null>(null)
  const [listErr, setListErr] = useState('')

  // Cover + Avatar upload
  const [coverUploading, setCoverUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const listingsChRef = useRef<any>(null)
  const pollRef       = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    // Kontrollo sesionin dhe dëgjo ndryshimet (p.sh. skadim sesioni)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return // unmount para se sesioni të zgjidhej — mos krijo interval/kanal jetim
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
      cancelled = true
      subscription.unsubscribe()
      if (listingsChRef.current) supabase.removeChannel(listingsChRef.current)
      clearInterval(pollRef.current)
    }
  }, [])

  async function fetchProfile(uid: string) {
    try {
      const [{ data: p }, { data: ls }] = await Promise.all([
        // `my_profile()` ne vend te `select('*')`: kolonat e ndjeshme
        // (telefon, gdpr_consent, admin_role…) nuk lexohen me nga klienti, por
        // MBI VETEN perdoruesi i sheh te gjitha — RPC-ja pergjigjet vetem per
        // `auth.uid()`.
        supabase.rpc('my_profile'),
        supabase.from('listings').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      ])
      if (p) {
        setProfile(p)
        setForm({ full_name: p.full_name || '', username: p.username || '', city: p.city || '', bio: p.bio || '' })
      }
      if (ls) setMyListings(ls)
      supabase.rpc('get_my_entitlements').then(({ data }) => {
        const m = Number((data as any)?.max_listings)
        if (Number.isFinite(m)) setMaxListings(m)
        // Ftohja e rifreskimit vjen nga I NJEJTI burim si kufiri i trigerit
        // (`app_config`), jo nga nje numer i ngurtesuar ketu.
        const b = Number((data as any)?.bump_min_hours)
        if (Number.isFinite(b)) setBumpOre(b)
      })
      // FAZA 5: biznesi real (nëse ekziston). maybeSingle — fail-soft, pa hedhur.
      supabase.from('businesses').select('id,name,is_verified').eq('owner_id', uid).maybeSingle()
        .then(({ data }) => { if (data) setMyBiz(data as any) })
      await Promise.all([fetchConversations(uid), fetchSavedListings(uid), fetchSavedSearches(uid)])
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  async function compressImage(file: File, maxW = 1920): Promise<Blob> {
    if (file.size < 250 * 1024) return file
    return new Promise(resolve => {
      const img = new Image(), url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const scale = Math.min(1, maxW / Math.max(img.naturalWidth, img.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.naturalWidth * scale)
        canvas.height = Math.round(img.naturalHeight * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(b => resolve(b ?? file), 'image/jpeg', 0.82)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  async function uploadProfileImage(file: File, type: 'avatar' | 'cover') {
    if (!user) return
    const setUploading = type === 'cover' ? setCoverUploading : setAvatarUploading
    setUploading(true)
    try {
      const blob = await compressImage(file, type === 'cover' ? 1920 : 400)
      const bucket = type === 'cover' ? 'covers' : 'avatars'
      const path = `${user.id}/profile-${type}.jpg`
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (upErr) { setMsg(`err:Gabim ngarkimi ${type}: ${upErr.message}`); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      const field = type === 'cover' ? 'cover_url' : 'avatar_url'
      const { error: dbErr } = await supabase.from('profiles').update({ [field]: publicUrl }).eq('id', user.id)
      if (dbErr) { setMsg(`err:Gabim ruajtje: ${dbErr.message}`); setUploading(false); return }
      setProfile((p: any) => ({ ...p, [field]: publicUrl }))
    } catch (e: any) {
      setMsg(`err:${e?.message ?? 'Gabim i papritur'}`)
    }
    setUploading(false)
  }

  async function fetchSavedListings(uid: string) {
    const { data } = await supabase
      .from('favorites')
      .select('listing_id, listings(*)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (data) setSavedListings(data.map((r: any) => r.listings).filter(Boolean))
  }

  async function fetchSavedSearches(uid: string) {
    const { data } = await supabase
      .from('saved_searches')
      .select('id, query, filters, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setSavedSearches(data)
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
      .select('id,full_name,username,avatar_url,is_premium,premium_expires_at,has_boost,boost_expires_at,shop_name')
      .in('id', otherIds)
    const pm = new Map((profiles || []).map((p: any) => [p.id, p]))

    const convs = Array.from(threadsMap.values())
      .map(t => ({ ...t, profile: pm.get(t.otherId) || null }))
      .sort((a, b) => new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime())
    setConversations(convs)
  }

  async function saveProfile() {
    const uname = form.username.trim().toLowerCase().replace(/\s+/g, '_')
    if (uname.length < 3) { setMsg('err:Emri i përdoruesit duhet të ketë të paktën 3 karaktere.'); return }
    if (!/^[a-z0-9_]+$/.test(uname)) { setMsg('err:Emri i përdoruesit mund të përmbajë vetëm shkronja, numra dhe nënvija (_).'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name.trim(),
      username: uname,
      city: form.city,
      bio: form.bio.trim(),
    }).eq('id', user.id)
    if (error) setMsg(`err:${error.message}`)
    else { setMsg('ok:Profili u ruajt me sukses!'); setEditing(false); fetchProfile(user.id) }
    setSaving(false)
  }


  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  async function changeEmail() {
    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setEmailMsg('err:Shkruaj një adresë email të vlefshme.'); return }
    if (trimmed === user?.email) { setEmailMsg('err:Emaili i ri duhet të jetë i ndryshëm nga ai aktual.'); return }
    setChangingEmail(true); setEmailMsg('')
    const { error } = await supabase.auth.updateUser({ email: trimmed })
    if (error) {
      setEmailMsg(`err:${error.message}`)
    } else {
      setEmailMsg('ok:U dërgua email konfirmimi. Kontrollo kutinë postare.')
      setNewEmail('')
    }
    setChangingEmail(false)
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
    if (!deletePassword) { setDeleteMsg('err:Shkruaj fjalëkalimin për të konfirmuar.'); return }
    setDeleting(true); setDeleteMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setDeleteMsg('err:Sesioni ka skaduar.'); setDeleting(false); return }
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: session.user.email!, password: deletePassword })
      if (authErr) { setDeleteMsg('err:Fjalëkalimi është i gabuar.'); setDeleting(false); return }
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
    setListErr('')
    // .select() returns the affected rows — empty means RLS blocked the update
    // (otherwise the button would silently do nothing).
    const { data, error } = await supabase
      .from('listings').update({ is_active: false }).eq('id', id).select('id')
    if (error || !data || data.length === 0) {
      setListErr(error?.message || 'Nuk u fshi dot shpallja. Provo sërish ose kontakto alpazarsuport@gmail.com.')
      return
    }
    setMyListings(ls => ls.filter(l => l.id !== id))
    setPendingDelete(null)
    // Drop it from the "Rishikimet e fundit" cache so it disappears from the homepage too.
    try {
      const rv = JSON.parse(localStorage.getItem('_alpazar_rv') || '[]')
      localStorage.setItem('_alpazar_rv', JSON.stringify(rv.filter((x: any) => x.id !== id)))
    } catch { /* ignore */ }
  }

  // Shëno Shitur (Vendimi 3): statusi 'sold' ekziston ne enum listing_status.
  // E heq nga grid-i aktiv (is_active=false) por e ruan si te shitur — social
  // proof i mevonshem numerohet nga statusi 'sold', jo nga grid-i aktiv.
  async function markSold(id: string) {
    setListErr('')
    const { data, error } = await supabase
      .from('listings').update({ status: 'sold', is_active: false }).eq('id', id).select('id')
    if (error || !data || data.length === 0) {
      setListErr(error?.message || 'Nuk u shënua dot si e shitur. Provo sërish.')
      return
    }
    setMyListings(ls => ls.filter(l => l.id !== id))
    setPendingSold(null)
    try {
      const rv = JSON.parse(localStorage.getItem('_alpazar_rv') || '[]')
      localStorage.setItem('_alpazar_rv', JSON.stringify(rv.filter((x: any) => x.id !== id)))
    } catch { /* ignore */ }
  }

  // FAZA 4: Riaktivizim idempotent. Trigeri `tg_enforce_listing_quota` mbron kufirin
  // ne server (INSERT OR UPDATE OF is_active); ketu vetem shfaqim gabimin miqesor.
  async function reactivateListing(id: string) {
    if (reactBusy) return
    setReactBusy(id); setReactMsg('')
    const { data, error } = await supabase
      .from('listings').update({ is_active: true, status: 'active' }).eq('id', id).select('id')
    if (error || !data || data.length === 0) {
      const msg = (error?.message || '').includes('KUFI_SHPALLJESH')
        ? `Ke arritur kufirin prej ${maxListings ?? 10} shpalljesh aktive. Pauzo një tjetër ose kalo në Premium.`
        : (error?.message || 'Nuk u riaktivizua dot. Provo sërish.')
      setReactMsg('err:' + msg)
    } else {
      setMyListings(ls => ls.map(l => l.id === id ? { ...l, is_active: true, status: 'active' } : l))
      setReactMsg('ok:Shpallja u riaktivizua.')
    }
    setReactBusy(null)
    setTimeout(() => setReactMsg(''), 4000)
  }

  /*  FTOHJA E RIFRESKIMIT — nje burim i vetem.
   *  Deri me 31 gusht 2026 ketu qendronin 7 dite TE NGURTESUARA (§2.9 e
   *  shkelur), faqja e biznesit s'kishte asnje kufi, dhe baza s'kishte asnje —
   *  tre numra te ndryshem per te njejten gje. Tani vlera vjen nga
   *  `get_my_entitlements().bump_min_hours`, qe e lexon nga `app_config`, dhe
   *  te njejtin celes e lexon edhe trigeri `guard_listing_bump`. Nese pronari
   *  e ndryshon vleren, ndryshojne te dyja njekohesisht.
   *  Vlera rezerve mbetet 168 ore = sjellja e derisotme, qe nje deshtim i
   *  rrjetit te mos e beje me te lire aksidentalisht.  */
  function canBump(lastBumped: string | null): boolean {
    if (!lastBumped) return true
    const diff = Date.now() - new Date(lastBumped).getTime()
    return diff >= bumpOre * 60 * 60 * 1000
  }

  /** Sa mbetet, ne njesine qe i pershtatet: ore nen dy dite, perndryshe dite. */
  function bumpMbetur(lastBumped: string | null): { n: number; njesia: 'ore' | 'dite' } {
    if (!lastBumped) return { n: 0, njesia: 'ore' }
    const mbetur = bumpOre * 3600e3 - (Date.now() - new Date(lastBumped).getTime())
    if (mbetur <= 0) return { n: 0, njesia: 'ore' }
    const ore = Math.ceil(mbetur / 3600e3)
    return ore >= 48 ? { n: Math.ceil(ore / 24), njesia: 'dite' } : { n: ore, njesia: 'ore' }
  }

  async function bumpListing(id: string) {
    const now = new Date().toISOString()
    const para = myListings.find(l => l.id === id)
    setMyListings(ls => ls.map(l => l.id === id ? { ...l, created_at: now, last_bumped_at: now } : l))
    const { error } = await supabase.from('listings').update({ created_at: now, last_bumped_at: now }).eq('id', id)
    if (error) {
      /*  Kthimi mbrapsht i vertete: rreshti i mesiperm e kishte humbur vleren e
       *  vjeter (lexonte `l.created_at` te rreshtit TASHME te ndryshuar), ndaj
       *  "rollback"-u nuk kthente asgje. Ruhet gjendja e meparshme para prekjes.
       *  Dhe mesazhi i bazes i tregohet perdoruesit: trigeri e shkruan ne shqip
       *  ("Provo perseri pas N ore"), pra fshehja e tij ishte humbje e vetem
       *  informacionit qe ndihmon.  */
      if (para) setMyListings(ls => ls.map(l => l.id === id ? para : l))
      setBumpMsg(error.message || 'Nuk u rifreskua dot.')
      setTimeout(() => setBumpMsg(''), 6000)
    }
  }

  const fmt = (price: number, cur: string) =>
    !price ? 'Me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString()} €` : `${price.toLocaleString()} L`

  const [mt, mm] = msg.split(/:(.+)/)

  if (loadError) return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ fontSize: 40 }} aria-hidden="true">⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Gabim gjatë ngarkimit</div>
      <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: '#F5C842', border: 'none', borderRadius: 24, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Rifresko</button>
    </div>
  )

  if (loading) return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh' }}>
      <div style={{ background: '#F5C842', height: 52 }} />
      <SkeletonProfile />
      <div style={{ height: 1, background: '#f0f0f0' }} />
      <SkeletonList count={4} />
    </div>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:30px;}
        .topbar{background:linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%);padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;flex:1;}
        .logout{background:linear-gradient(135deg,#1a1a1a,#000);color:#F5C842;border:none;border-radius:10px;padding:7px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s ease;}
        .hero{background:linear-gradient(180deg,#111,#1c1c1c);padding:24px 16px;text-align:center;}
        .avatar{width:76px;height:76px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 12px;border:3px solid #F5C842;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.3);}
        .avatar img{width:100%;height:100%;object-fit:cover;}
        .name{font-size:19px;font-weight:800;color:#1a1a1a;}
        .handle{font-size:12px;color:#555;margin-top:4px;}
        .email-row{font-size:11px;color:#666;display:flex;align-items:center;gap:6px;margin-top:4px;justify-content:center;}
        .badges-row{display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap;}
        .badge{font-size:10px;padding:4px 10px;border-radius:6px;font-weight:700;}
        .b-prem{background:linear-gradient(135deg,#F8D24E,#F5C842);color:#111;}
        .b-pts{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;}
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
        .tab{flex:1;padding:9px 2px;text-align:center;font-size:9.5px;font-weight:600;color:#6B6B6B;border:none;background:none;cursor:pointer;font-family:inherit;border-bottom:2.5px solid transparent;transition:all .15s cubic-bezier(.2,.8,.2,1);}
        .tab.active{background:linear-gradient(135deg,#1a1a1a,#000);color:#F5C842;border-bottom-color:transparent;font-weight:700;}
        .tab i{font-size:14px;display:block;margin-bottom:2px;}
        .body{padding:12px 12px;}
        .msg-box{border-radius:12px;padding:10px 14px;margin-bottom:12px;font-size:12px;font-weight:600;}
        .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
        .err{background:#FFF0EE;color:#C42B0F;border:0.5px solid #F09595;}
        .card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;border:0.5px solid #ececec;box-shadow:0 1px 2px rgba(0,0,0,.04),0 6px 16px -10px rgba(0,0,0,.14);}
        .card-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
        .card-title{font-size:13px;font-weight:700;color:#1a1a1a;}
        .edit-btn{background:linear-gradient(135deg,#1a1a1a,#000);border:none;border-radius:10px;padding:6px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;color:#F5C842;transition:all .15s ease;}
        .save-btn{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:10px;padding:6px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px -2px rgba(230,51,18,.4);transition:all .15s ease;}
        .info-row{display:flex;align-items:flex-start;padding:8px 0;border-bottom:0.5px solid #f5f5f0;}
        .info-row:last-child{border:none;}
        .info-label{font-size:10px;color:#4A4A4A;width:90px;flex-shrink:0;margin-top:2px;}
        .info-val{font-size:12px;color:#111;flex:1;}
        label{font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px;margin-top:10px;}
        input,textarea,select{width:100%;border:1.5px solid #ddd;border-radius:12px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;background:#fff;transition:border-color .15s ease,box-shadow .15s ease;}
        input:focus,textarea:focus,select:focus{border-color:#111;box-shadow:0 4px 16px -4px rgba(0,0,0,.2);}
        textarea{min-height:80px;resize:vertical;}
        .listing-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:0.5px solid #f5f5f0;cursor:pointer;}
        .listing-row:last-child{border:none;}
        .listing-thumb{width:52px;height:52px;border-radius:10px;background:#f9f5e0;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;}
        .listing-thumb img{width:100%;height:100%;object-fit:cover;}
        .listing-info{flex:1;}
        .listing-title{font-size:12px;font-weight:700;color:#1a1a1a;}
        .listing-price{font-size:13px;font-weight:800;color:#C42B0F;margin-top:2px;}
        .listing-meta{font-size:10px;color:#aaa;margin-top:2px;}
        .del-btn{background:#FFF0EE;border:none;border-radius:10px;padding:6px 10px;font-size:12px;cursor:pointer;color:#C42B0F;font-family:inherit;}
        .edit-listing-btn{background:#FFFBEA;border:1px solid #e0b030;border-radius:10px;padding:6px 10px;font-size:12px;cursor:pointer;color:#856404;font-family:inherit;}
        .prem-card{background:linear-gradient(135deg,#111,#1c1c1c);border-radius:12px;padding:18px;margin-bottom:12px;text-align:center;border:1px solid #333;}
        .prem-card h3{color:#F5C842;font-size:15px;font-weight:700;margin-bottom:8px;}
        .prem-card p{color:#777;font-size:11px;margin-bottom:16px;line-height:1.6;}
        .prem-cta{background:linear-gradient(135deg,#F8D24E,#F5C842);color:#111;border:none;border-radius:10px;padding:12px 26px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
        .admin-btn{background:linear-gradient(135deg,#7C3AED,#6d28d9);color:#fff;border:none;border-radius:10px;padding:11px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px;}
        /* Messages inbox */
        .tab-badge{display:inline-flex;align-items:center;justify-content:center;background:#E63312;color:#fff;font-size:8px;font-weight:700;width:15px;height:15px;border-radius:50%;margin-left:3px;vertical-align:middle;}
        .conv-list{display:flex;flex-direction:column;gap:0;}
        .conv-row{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:0.5px solid #f5f5f0;cursor:pointer;transition:background .15s ease;}
        .conv-row:last-child{border:none;}
        .conv-row:active{background:#f9f5e0;}
        .conv-av{width:48px;height:48px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;overflow:hidden;position:relative;}
        .conv-av img{width:100%;height:100%;object-fit:cover;}
        .unread-dot{position:absolute;top:1px;right:1px;width:12px;height:12px;background:#E63312;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:6px;color:#fff;font-weight:700;}
        .conv-body{flex:1;min-width:0;}
        .conv-name{font-size:13px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;gap:5px;}
        .conv-prem{font-size:8px;background:linear-gradient(135deg,#F8D24E,#F5C842);color:#111;padding:1px 5px;border-radius:6px;font-weight:700;}
        .conv-preview{font-size:11px;color:#aaa;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .conv-preview.unread{color:#111;font-weight:600;}
        .conv-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;}
        .conv-time{font-size:9px;color:#bbb;}
        .conv-badge{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:999px;min-width:18px;text-align:center;}
        .inbox-empty{text-align:center;padding:40px 20px;}
        .inbox-empty i{font-size:44px;color:#F5C842;display:block;margin-bottom:12px;}
        .inbox-empty p{font-size:12px;color:#555;margin-bottom:16px;line-height:1.6;}
        .inbox-empty-btn{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:10px;padding:11px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px -2px rgba(230,51,18,.4);}
        .open-msgs-btn{width:100%;background:linear-gradient(135deg,#1a1a1a,#000);color:#F5C842;border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;transition:all .15s ease;}
        .open-msgs-btn i{font-size:17px;}
        /* Security section */
        .pass-wrap{position:relative;}
        .pass-toggle{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#aaa;font-size:13px;padding:4px;}
        .sec-btn{width:100%;background:linear-gradient(135deg,#1a1a1a,#000);color:#F5C842;border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:12px;transition:all .15s ease;}
        .sec-btn:disabled{opacity:.6;cursor:not-allowed;}
        .danger-zone{background:#FFF0EE;border:1px solid #F09595;border-radius:12px;padding:16px;margin-bottom:12px;}
        .danger-title{font-size:13px;font-weight:700;color:#C42B0F;margin-bottom:6px;display:flex;align-items:center;gap:6px;}
        .danger-desc{font-size:11px;color:#555;line-height:1.6;margin-bottom:12px;}
        .delete-btn{width:100%;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px -2px rgba(230,51,18,.4);transition:all .15s ease;}
        .delete-btn:disabled{opacity:.6;cursor:not-allowed;}
        .delete-confirm{background:#fff;border:1.5px solid #E63312;border-radius:12px;padding:14px;margin-top:10px;text-align:center;}
        .delete-confirm p{font-size:12px;color:#111;font-weight:600;margin-bottom:10px;line-height:1.6;}
        .delete-confirm-btns{display:flex;gap:8px;}
        .delete-confirm-btns button:first-child{flex:1;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:10px;padding:11px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
        .delete-confirm-btns button:last-child{flex:1;background:#eee;color:#555;border:none;border-radius:10px;padding:11px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
        .msg-sm{font-size:11px;padding:8px 12px;border-radius:10px;margin-top:8px;font-weight:600;}
      ` }} />

      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu mbrapa" onClick={() => window.location.href = '/'}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <h1 className="topbar-title" style={{ margin: 0 }}>Profili im</h1>
          <button type="button" className="logout" onClick={signOut}>Dil ↗</button>
        </div>

        {/* B3.1 — Shiriti i qëndrueshëm "Vepro si: [Unë | Biznesi]", simetrik me panelin e biznesit
            (BiznesPageClient .vs-bar). Shfaqet kur pronari ka biznes; s'krijon inbox/analitikë të dytë.
            Më parë kalimi Unë→Biznesi ishte i fshehur brenda tab-it "Biznes" (gjetje audit, BP2 §B3.1). */}
        {myBiz && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF8E1', border: '1px solid #F5C84255', borderRadius: 12, padding: '6px 11px', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#7B5000' }}>Vepro si:</span>
            <div role="tablist" aria-label="Vepro si" style={{ display: 'inline-flex', background: '#fff', border: '1px solid #e0c070', borderRadius: 999, overflow: 'hidden' }}>
              <button type="button" role="tab" aria-current="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#111', color: '#F5C842', border: 'none', padding: '5px 12px', fontSize: 12, fontWeight: 800, cursor: 'default', fontFamily: 'inherit' }}>
                <i className="ti ti-user" aria-hidden="true" /> Unë
              </button>
              <button type="button" role="tab" onClick={() => { window.location.href = `/biznese/${myBiz.id}` }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#7B5000', border: 'none', padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <i className="ti ti-building-store" aria-hidden="true" /> Biznesi
              </button>
            </div>
          </div>
        )}

        {/* Cover + Avatar — Facebook-style */}
        <div style={{ position: 'relative', marginBottom: 56 }}>
          {/* Cover 16:6 */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/6', overflow: 'hidden', borderRadius: '20px 20px 0 0', background: 'linear-gradient(135deg,#F5C842,#E63312)' }}>
            {profile?.cover_url && (
              <img src={profile.cover_url} alt="Kopertina" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            )}
            <label style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.52)', color: '#fff', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span aria-hidden="true">{coverUploading ? '⏳' : '📷'}</span> Kopertina
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadProfileImage(f, 'cover') }} />
            </label>
          </div>

          {/* Avatar — positioned to overlap cover */}
          <div style={{ position: 'absolute', bottom: -48, left: 16 }}>
            <div style={{ position: 'relative' }}>
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name || profile?.username}
                type={profile?.shop_name ? 'business' : 'person'}
                tier={tierNgaProfili(profile)}
                verified={(profile?.trust_score ?? 0) >= 60}
                size={96}
              />
              <label style={{ position: 'absolute', bottom: 0, right: 0, background: '#E63312', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)', zIndex: 2 }}>
                <span aria-hidden="true">{avatarUploading ? '⏳' : '📷'}</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadProfileImage(f, 'avatar') }} />
              </label>
            </div>
          </div>
        </div>

        {/* Name + handle + badges */}
        <div style={{ padding: '0 16px 4px' }}>
          <div className="name" style={{ textAlign: 'left', marginBottom: 2 }}>{profile?.full_name || profile?.username || 'Përdoruesi'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            {profile?.username && <div className="handle" style={{ margin: 0 }}>@{profile.username}</div>}
            <button
              type="button"
              onClick={() => {
                const url = `${SITE_URL}/u/${profile?.id}`
                navigator.clipboard?.writeText(url).catch(() => {})
                setProfileCopied(true)
                setTimeout(() => setProfileCopied(false), 2000)
              }}
              style={{ background: profileCopied ? '#EAF3DE' : '#f5f5f5', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', color: profileCopied ? '#3B6D11' : '#555', display: 'flex', alignItems: 'center', gap: 3, transition: 'all .15s' }}
            >
              <i className={`ti ti-${profileCopied ? 'check' : 'share-2'}`} aria-hidden="true" style={{ fontSize: 11 }} />
              {profileCopied ? 'Kopjuar!' : 'Ndaj'}
            </button>
            {/* Shiko profilin nga JASHTË (si e sheh vizitori) — harmonizim me "Shiko faqen publike" te biznesi. */}
            {profile?.id && (
              <button type="button" aria-label="Shiko profilin publik" onClick={() => { window.location.href = `/u/${profile.id}` }}
                style={{ background: '#111', color: '#F5C842', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ti ti-eye" aria-hidden="true" style={{ fontSize: 11 }} /> Shiko publik
              </button>
            )}
          </div>
          {profile?.city && <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}><span aria-hidden="true">📍</span> {profile.city}{profile?.created_at ? ` · Anëtar që nga ${monthYear(profile.created_at)}` : ''}</div>}
          <div className="email-row" style={{ justifyContent: 'flex-start' }}><i className="ti ti-mail" aria-hidden="true" />{user?.email}</div>
          <div className="badges-row" style={{ justifyContent: 'flex-start', marginTop: 8 }}>
            {profile?.is_admin && <span className="badge b-admin"><span aria-hidden="true">🛡</span> Admin</span>}
            {(user?.email_confirmed_at || user?.phone_confirmed_at) && <span className="badge b-verif"><span aria-hidden="true">✓</span> Verifikuar</span>}
            {(() => { const t = tierNgaProfili(profile); return t !== 'free' && <span className="badge b-prem"><span aria-hidden="true">👑</span> {t === 'vip' ? 'VIP Ekstra Boost' : 'Premium'}</span> })()}
            {profile?.shop_name && <span className="badge b-shop"><span aria-hidden="true">🏢</span> Biznes</span>}
            {(() => { const l = getLevel(profile?.gamification_points || 0); return <span className="badge" style={{ background: l.bg, color: l.color }}><span aria-hidden="true">{l.icon}</span> {l.name}</span> })()}
            {myListings.some(l => l.is_active) && <span className="badge b-seller"><span aria-hidden="true">📦</span> Shitës aktiv</span>}
            {isNewMember(profile?.created_at) && <span className="badge b-new"><span aria-hidden="true">🆕</span> Anëtar i ri</span>}
            {profile?.gamification_points > 0 && <span className="badge b-pts"><span aria-hidden="true">⚡</span> {profile.gamification_points} pikë</span>}
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
        <div className="tabs" role="tablist" aria-label="Seksionet e profilit">
          <button id="tab-profile" type="button" role="tab" aria-selected={activeTab === 'profile'} aria-controls="tabpanel-profile" className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <i className="ti ti-user" aria-hidden="true" />Profili
          </button>
          <button id="tab-listings" type="button" role="tab" aria-selected={activeTab === 'listings'} aria-controls="tabpanel-listings" className={`tab ${activeTab === 'listings' ? 'active' : ''}`} onClick={() => setActiveTab('listings')}>
            <i className="ti ti-package" aria-hidden="true" />Shpalljet
          </button>
          <button id="tab-saved" type="button" role="tab" aria-selected={activeTab === 'saved'} aria-controls="tabpanel-saved" className={`tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
            <i className="ti ti-heart" aria-hidden="true" />Të ruajtura
          </button>
          <button id="tab-messages" type="button" role="tab" aria-selected={activeTab === 'messages'} aria-controls="tabpanel-messages" className={`tab ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
            <i className="ti ti-message-circle" aria-hidden="true" />
            Mesazhet
            {conversations.some(c => c.unread > 0) && (
              <span className="tab-badge">{conversations.reduce((s, c) => s + c.unread, 0)}</span>
            )}
          </button>
          <button id="tab-shop" type="button" role="tab" aria-selected={activeTab === 'shop'} aria-controls="tabpanel-shop" className={`tab ${activeTab === 'shop' ? 'active' : ''}`} onClick={() => setActiveTab('shop')}>
            <i className="ti ti-building-store" aria-hidden="true" />Biznes
          </button>
        </div>

        <div id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="body">

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              {msg && <div className={`msg-box ${mt}`} role="alert">{mm}</div>}

              {profile?.is_admin && (
                <button type="button" className="admin-btn" onClick={() => window.location.href = '/admin'}>
                  <i className="ti ti-shield" aria-hidden="true" /> Paneli i Adminit
                </button>
              )}

              {/* Nen-butonat (Imazhi 6a / panel_perdoruesit_korrigjuar): Te dhenat /
                  Analitika / Abonimi / Siguri / Fto miq. "Biznesi im" U HOQ nga tab-i
                  Profili (BLLOKU I PËRMIRËSUAR §4) — biznesi hapet VETEM nga tab-i
                  "Biznes" (tab-shop), pa dyfishim. */}
              {profSub === 'menu' && (
                <>
                {/* FINAL §3.3 (alpazar_profili_brendshem_te_dhenat_direkt): Informacioni
                    personal DIREKT te tab-i Profili — i hapur, i editueshëm, pa nën-buton
                    ndërmjetës. Kartat e tjera (Fto miq/Analitika/Abonimi/Siguri) më poshtë. */}
                <div className="card">
                  <div className="card-hdr">
                    <span className="card-title">Informacioni personal</span>
                    {editing
                      ? <button type="button" className="save-btn" onClick={saveProfile} disabled={saving}>{saving ? <><span aria-hidden="true">⏳</span> Duke ruajtur...</> : 'Ruaj'}</button>
                      : <button type="button" className="edit-btn" onClick={() => setEditing(true)}><span aria-hidden="true">✏️</span> Ndrysho</button>
                    }
                  </div>
                  {editing ? (
                    <>
                      <label htmlFor="prof-fullname">Emri i plotë</label>
                      <input id="prof-fullname" type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Emri Mbiemri" maxLength={80} autoComplete="name" />
                      <label htmlFor="prof-username">Username</label>
                      <input id="prof-username" type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username123" maxLength={30} autoComplete="username" />
                      <label htmlFor="prof-city">Qyteti</label>
                      <select id="prof-city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                        <option value="">— Zgjidh —</option>
                        {['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat', 'Sarandë', 'Tjetër'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <label htmlFor="prof-bio">Bio</label>
                      <textarea id="prof-bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Pak fjalë rreth vetes..." maxLength={300} />
                    </>
                  ) : (
                    <>
                      <div className="info-row"><span className="info-label">Emri</span><span className="info-val">{profile?.full_name || '—'}</span></div>
                      <div className="info-row"><span className="info-label">Username</span><span className="info-val">{profile?.username ? `@${profile.username}` : '—'}</span></div>
                      <div className="info-row"><span className="info-label">Qyteti</span><span className="info-val">{profile?.city || '—'}</span></div>
                      <div className="info-row"><span className="info-label">Bio</span><span className="info-val">{profile?.bio || '—'}</span></div>
                      <div className="info-row"><span className="info-label">Anëtar që</span><span className="info-val">{monthYear(profile?.created_at || Date.now())}</span></div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {([
                    { ike: 'ti-hand-click',     titull: 'Ofertat',              nen: 'Oferta çmimi të marra dhe të dërguara · prano, refuzo ose tërhiq', vepro: () => { window.location.href = '/oferta' } },
                    { ike: 'ti-chart-bar',      titull: 'Analitika',            nen: 'Pamje, kontaktime (WhatsApp/Viber), CTR — 7 ose 30 ditë', vepro: () => { window.location.href = '/profile/analytics' } },
                    { ike: 'ti-crown',          titull: 'Abonimi im',           nen: (() => { const t = tierNgaProfili(profile); return t === 'vip' ? 'VIP Ekstra Boost aktiv · shiko / menaxho' : t === 'premium' ? 'Premium aktiv · shiko / menaxho / anulo' : 'Kalo në Premium — biznes online, VIP, pa limit' })(), vepro: () => { window.location.href = tierNgaProfili(profile) !== 'free' ? '/billing' : '/premium' } },
                    { ike: 'ti-shield-lock',    titull: 'Siguri & privatësi',   nen: 'Fjalëkalimi, email-i, GDPR, Trust Score, Takedown, fshirja', vepro: () => setProfSub('siguri') },
                    { ike: 'ti-gift',           titull: 'Fto miq',              nen: `50 pikë për çdo mik të regjistruar${(profile?.gamification_points ?? 0) > 0 ? ` · ke ${profile.gamification_points} pikë` : ''}`, vepro: () => { window.location.href = '/referral' } },
                  ] as const).map(b => (
                    <button
                      key={b.titull}
                      type="button"
                      onClick={b.vepro}
                      style={{ width: '100%', background: '#fff', border: '1px solid #eee', borderRadius: 13, padding: '12px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, color: '#111', minHeight: 48, textAlign: 'left' }}>
                      <i className={`ti ${b.ike}`} style={{ fontSize: 20, color: '#C42B0F' }} aria-hidden="true" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div>{b.titull}</div>
                        <div style={{ fontSize: 10, fontWeight: 500, color: '#767676', marginTop: 2 }}>{b.nen}</div>
                      </div>
                      <i className="ti ti-chevron-right" style={{ fontSize: 16, color: '#999' }} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                </>
              )}

              {profSub !== 'menu' && (
                <button
                  type="button"
                  onClick={() => setProfSub('menu')}
                  style={{ background: 'none', border: 'none', color: '#C42305', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0', marginBottom: 8, minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden="true" /> Kthehu te paneli
                </button>
              )}

              {profSub === 'menu' && tierNgaProfili(profile) === 'free' && (
                <div className="prem-card">
                  <h3><span aria-hidden="true">👑</span> Bëhu Premium</h3>
                  <p>Biznes online · Badge verifikimi · Shpallje të pakufizuara · Statistika të avancuara</p>
                  <button type="button" className="prem-cta" onClick={() => window.location.href = '/premium'}>Shiko planin →</button>
                </div>
              )}

              {/* Karta e madhe "Fto miq" u hoq si dublim: nen-butoni "Fto miq" i menuse
                  mban te njejtin informacion (50 pike + gjendja) dhe con te /referral. */}

              {profSub === 'siguri' && (
              <>
              {/* ── Trust Score — Kundërshtim Profilizimit (Ligj 124/2024 n.19) ── */}
              <div className="card">
                <div className="card-hdr">
                  <span className="card-title"><span aria-hidden="true">🔵</span> Trust Score — Privatësia</span>
                </div>
                <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>
                  <strong>Ç'është Trust Score?</strong> Është një vlerë 0–100 që tregon besueshmërinë
                  e llogarisë bazuar në: moshën e llogarisë, numrin e shpalljeve aktive dhe pikët e
                  aktivitetit. <strong>Nuk lidhet me pagesa, gjini, racë apo karakteristika sensitive.</strong>
                  <br /><br />
                  Sipas Ligjit Nr. 124/2024 (neni 19), keni të drejtë të kundërshtoni profilizimin
                  automatik. Nëse e çaktivizoni, Trust Score juaj <em>nuk do të shfaqet</em> te profili
                  publik dhe kartat e shpalljeve.
                </p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 0' }}>
                  <input
                    type="checkbox"
                    checked={profile?.trust_score_visible !== false}
                    onChange={async e => {
                      const visible = e.target.checked
                      await supabase.from('profiles').update({ trust_score_visible: visible }).eq('id', user?.id)
                      setProfile((prev: any) => ({ ...prev, trust_score_visible: visible }))
                      setMsg(`ok:Trust Score ${visible ? 'aktivizuar' : 'çaktivizuar'} me sukses.`)
                      setTimeout(() => setMsg(''), 3000)
                    }}
                    style={{ width: 18, height: 18, accentColor: '#E63312', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                    Shfaq Trust Score tim te profili publik
                  </span>
                </label>
                {profile?.trust_score_visible !== false && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: '#166534', marginTop: 4 }}>
                    <span aria-hidden="true">✅</span> Trust Score aktiv — vizitorët mund ta shohin besueshmërinë tuaj
                  </div>
                )}
                {profile?.trust_score_visible === false && (
                  <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: '#713F12', marginTop: 4 }}>
                    <span aria-hidden="true">⚠️</span> Trust Score i fshehur — profili publik nuk e shfaq
                  </div>
                )}
              </div>

              {/* ── Marketing Opt-in (GDPR Art.7) ── */}
              <div className="card">
                <div className="card-hdr">
                  <span className="card-title"><span aria-hidden="true">📢</span> Komunikim Marketing</span>
                </div>
                <p style={{ fontSize: 12, color: '#666', marginBottom: 10, lineHeight: 1.6 }}>
                  Zgjidhni nëse doni të merrni oferta speciale, lajme dhe këshilla nga Alpazar. Mund ta ndryshoni kurdo. (GDPR Art.7)
                </p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 0' }}>
                  <input
                    type="checkbox"
                    checked={profile?.marketing_opt_in === true}
                    onChange={async e => {
                      const opted = e.target.checked
                      if (!user?.id) { setMsg('err:Duhet të kyçesh.'); return }
                      const { error } = await supabase.from('profiles').update({ marketing_opt_in: opted }).eq('id', user.id)
                      if (error) { setMsg('err:Nuk u ruajt preferenca. Provo sërish.'); setTimeout(() => setMsg(''), 3000); return }
                      setProfile((prev: any) => ({ ...prev, marketing_opt_in: opted }))
                      setMsg(`ok:Preferencat e marketingut u ${opted ? 'aktivizuan' : 'çaktivizuan'}.`)
                      setTimeout(() => setMsg(''), 3000)
                    }}
                    style={{ width: 18, height: 18, accentColor: '#E63312', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                    Pranoj njoftime dhe oferta nga Alpazar
                  </span>
                </label>
                <div style={{ marginTop: 6 }}>
                  <a href="/te-dhenat-mia" style={{ fontSize: 12, color: '#C42B0F', fontWeight: 600, textDecoration: 'none' }}>
                    <span aria-hidden="true">🔒</span> Menaxho të gjitha të dhënat e mia (GDPR) →
                  </a>
                </div>
              </div>

              {/* ── Ndrysho Email-in ── */}
              <div className="card">
                <div className="card-hdr">
                  <span className="card-title"><span aria-hidden="true">✉️</span> Ndrysho Email-in</span>
                </div>
                {emailMsg && (
                  <div className={`msg-box msg-sm ${emailMsg.split(':')[0]}`} role="alert">{emailMsg.split(/:(.+)/)[1]}</div>
                )}
                <label htmlFor="prof-new-email">Email aktual: <strong>{user?.email}</strong></label>
                <input
                  id="prof-new-email"
                  type="email"
                  placeholder="Email i ri..."
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  autoComplete="email"
                  style={{ marginTop: 6 }}
                />
                <button type="button" className="sec-btn" onClick={changeEmail} disabled={changingEmail || !newEmail} style={{ marginTop: 8 }}>
                  {changingEmail ? <><span aria-hidden='true'>⏳</span> Duke dërguar...</> : <><span aria-hidden='true'>✉️</span> Ndrysho Email-in</>}
                </button>
              </div>

              {/* ── Ndrysho Fjalëkalimin ── */}
              <div className="card">
                <div className="card-hdr">
                  <span className="card-title"><span aria-hidden="true">🔒</span> Ndrysho Fjalëkalimin</span>
                </div>
                {passMsg && (
                  <div className={`msg-box msg-sm ${passMsg.split(':')[0]}`} role="alert">{passMsg.split(/:(.+)/)[1]}</div>
                )}
                <label htmlFor="prof-new-pass">Fjalëkalimi i ri (min. 8 karaktere)</label>
                <div className="pass-wrap">
                  <input
                    id="prof-new-pass"
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingRight: 36 }}
                  />
                  <button type="button" className="pass-toggle" aria-label={showNewPass ? 'Fshih fjalëkalimin' : 'Shfaq fjalëkalimin'} aria-pressed={showNewPass} onClick={() => setShowNewPass(v => !v)}>
                    <span aria-hidden="true">{showNewPass ? '🙈' : '👁️'}</span>
                  </button>
                </div>
                <label htmlFor="prof-confirm-pass">Konfirmo fjalëkalimin e ri</label>
                <input
                  id="prof-confirm-pass"
                  type="password"
                  placeholder="••••••••"
                  value={newPass2}
                  onChange={e => setNewPass2(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && changePassword()}
                  autoComplete="new-password"
                />
                <button type="button" className="sec-btn" onClick={changePassword} disabled={savingPass || !newPass || !newPass2}>
                  {savingPass ? <><span aria-hidden="true">⏳</span> Duke ruajtur...</> : <><span aria-hidden="true">🔒</span> Ndrysho Fjalëkalimin</>}
                </button>
              </div>

              {/* ── Mbrojtja & ndihma — lidhje me sistemet EKZISTUESE (asnje sistem i ri):
                    Takedown → /takedown (moderimi ekzistues), Kujdes klienti → /kontakt,
                    te dhenat GDPR → /te-dhenat-mia (e njejta lidhje si te karta e marketingut). */}
              <div className="card">
                <div className="card-hdr">
                  <span className="card-title"><span aria-hidden="true">🛡️</span> Mbrojtja & ndihma</span>
                </div>
                <a href="/takedown" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: '#111', fontSize: 13, fontWeight: 600, minHeight: 44 }}>
                  <i className="ti ti-flag" style={{ fontSize: 17, color: '#C42B0F' }} aria-hidden="true" />
                  <span style={{ flex: 1 }}>Kërkesë heqjeje (Takedown)<br /><span style={{ fontSize: 10.5, fontWeight: 500, color: '#767676' }}>Raporto përmbajtje të paligjshme — shqyrtohet nga moderimi</span></span>
                  <i className="ti ti-chevron-right" style={{ fontSize: 15, color: '#999' }} aria-hidden="true" />
                </a>
                <a href="/kontakt" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', textDecoration: 'none', color: '#111', fontSize: 13, fontWeight: 600, minHeight: 44 }}>
                  <i className="ti ti-headset" style={{ fontSize: 17, color: '#C42B0F' }} aria-hidden="true" />
                  <span style={{ flex: 1 }}>Kujdesi ndaj klientit<br /><span style={{ fontSize: 10.5, fontWeight: 500, color: '#767676' }}>Na shkruaj për çdo pyetje a problem</span></span>
                  <i className="ti ti-chevron-right" style={{ fontSize: 15, color: '#999' }} aria-hidden="true" />
                </a>
              </div>

              {/* ── Fshi Llogarinë ── */}
              <div className="danger-zone">
                <div className="danger-title"><span aria-hidden="true">⚠️</span> Zona e Rrezikshme</div>
                <div className="danger-desc">
                  Fshirja e llogarisë është <strong>e pakthyeshme</strong>. Të gjitha shpalljet dhe të dhënat tuaja do të fshihen përgjithmonë.
                </div>
                {deleteMsg && (
                  <div className={`msg-box msg-sm ${deleteMsg.split(':')[0]}`} role="alert">{deleteMsg.split(/:(.+)/)[1]}</div>
                )}
                {!deleteConfirm ? (
                  <button type="button" className="delete-btn" onClick={() => setDeleteConfirm(true)}>
                    <span aria-hidden="true">🗑</span> Fshi Llogarinë
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p>Je i sigurt? Kjo veprim <strong>nuk mund të kthehet</strong>.<br />Të gjitha të dhënat fshihen përgjithmonë.</p>
                    <input
                      type="password"
                      aria-label="Fjalëkalimi për konfirmim fshirjeje"
                      placeholder="Shkruaj fjalëkalimin për të konfirmuar"
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      autoComplete="current-password"
                      style={{ width: '100%', border: '1.5px solid #E63312', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
                    />
                    <div className="delete-confirm-btns">
                      <button type="button" onClick={deleteAccount} disabled={deleting || !deletePassword}>
                        {deleting ? <><span aria-hidden="true">⏳</span> Duke fshirë...</> : <><span aria-hidden="true">✅</span> Po, fshi llogarinë</>}
                      </button>
                      <button type="button" onClick={() => { setDeleteConfirm(false); setDeleteMsg(''); setDeletePassword('') }}>
                        <span aria-hidden="true">✕</span> Anulo
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>
              )}
            </>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <>
              {/* Business upsell — shown only if user has no business */}
              <BizUpsellBanner userId={user?.id} isPremium={tierNgaProfili(profile) !== 'free'} />

              {/* BP2 §B16 — HEQUR kartat-dublikatë "Statistikat e Shpalljeve" (dublonte Analitikën
                  te tab-i Profili) + "Abonimi im" (dublonte kartën te Profili). Një sistem, një
                  vend hyrjeje: Analitika & Abonimi qëndrojnë VETËM te tab-i "Profili". Këtu mbetet
                  vetëm menaxhimi i shpalljeve (Skema 1: kuota/filtra/Rifresko/+Shto). */}
              <div className="card">
                <div className="card-hdr">
                  <span className="card-title">
                    Shpalljet e mia
                    {maxListings != null && maxListings >= 0
                      ? <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700, color: myListings.filter(l => l.is_active).length >= maxListings ? '#C42305' : '#0E7A35' }}>{myListings.filter(l => l.is_active).length}/{maxListings}</span>
                      : <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700, color: '#7A4A00' }}>{myListings.filter(l => l.is_active).length} · <span aria-hidden="true">👑</span> pa limit</span>}
                  </span>
                  <button type="button" className="edit-btn" onClick={() => window.location.href = '/listing/new'}>+ Shto</button>
                </div>
                {listErr && (
                  <div role="alert" style={{ background: '#FEECEC', color: '#B42318', border: '1px solid #F5C2C2', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 10 }}>{listErr}</div>
                )}
                {bumpMsg && (
                  /*  Mesazhi vjen nga trigeri i bazes dhe eshte tashme ne shqip
                      ("Provo perseri pas N ore"). Tregohet ashtu sic eshte: ai
                      di saktesisht sa mbetet, ndersa nje tekst i pergjithshem
                      ne klient do te ishte me pak i sakte.  */
                  <div role="alert" style={{ background: '#FFF8E1', color: '#8A6D00', border: '1px solid #FFB74D', borderRadius: 10, padding: '9px 12px', fontSize: 12.5, fontWeight: 600, marginBottom: 10, lineHeight: 1.6 }}>{bumpMsg}</div>
                )}
                {reactMsg && (
                  <div role="alert" className={`msg-box msg-sm ${reactMsg.split(':')[0]}`} style={{ marginBottom: 10 }}>{reactMsg.split(/:(.+)/)[1]}</div>
                )}
                {maxListings != null && maxListings >= 0 && myListings.filter(l => l.is_active).length >= maxListings && (
                  <div style={{ background: '#FFF9C3', border: '1px solid #FDE047', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: '#713F12', marginBottom: 10 }}>
                    <span aria-hidden="true">⚠️</span> Ke arritur kufirin falas ({maxListings} aktive). Pauzo një shpallje ose <a href="/premium" style={{ color: '#C42305', fontWeight: 700 }}>kalo në Premium</a> për shpallje pa limit.
                  </div>
                )}
                {/* FAZA 4: filtra Aktive / Të pauzuara / Të shitura */}
                <div role="tablist" aria-label="Filtro shpalljet" style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {([['active','Aktive'],['paused','Të pauzuara'],['sold','Të shitura']] as const).map(([k, etiketa]) => {
                    const n = k === 'active' ? myListings.filter(l => l.is_active).length
                            : k === 'sold' ? myListings.filter(l => l.status === 'sold').length
                            : myListings.filter(l => !l.is_active && l.status !== 'sold').length
                    return (
                      <button key={k} type="button" role="tab" aria-selected={listFilter === k} onClick={() => setListFilter(k)}
                        style={{ flex: 1, minHeight: 40, borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                          border: listFilter === k ? '1.5px solid #C42305' : '1px solid #eee',
                          background: listFilter === k ? '#FFF1EE' : '#fff', color: listFilter === k ? '#C42305' : '#666' }}>
                        {etiketa} ({n})
                      </button>
                    )
                  })}
                </div>
                {(() => {
                  const shown = listFilter === 'active' ? myListings.filter(l => l.is_active)
                              : listFilter === 'sold'   ? myListings.filter(l => l.status === 'sold')
                              : myListings.filter(l => !l.is_active && l.status !== 'sold')
                  const bosh = listFilter === 'active' ? 'Nuk ke shpallje aktive.'
                             : listFilter === 'sold'   ? 'Ende asnjë shpallje e shitur.'
                             : 'Asnjë shpallje e pauzuar.'
                  return shown.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#555', fontSize: 12 }}>
                    <i className="ti ti-package" style={{ fontSize: 36, display: 'block', marginBottom: 10, color: '#F5C842' }} aria-hidden="true" />
                    {bosh}{listFilter === 'active' ? <><br />Shto tani falas!</> : null}
                  </div>
                ) : (
                  shown.map(l => (
                    <div key={l.id} className="listing-row" style={!l.is_active ? { opacity: 0.72 } : undefined}>
                      <div role="link" tabIndex={0} className="listing-thumb" onClick={() => window.location.href = `/listing/${l.id}`} onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/listing/${l.id}` }}>
                        {l.images?.[0] ? <img src={l.images[0]} alt={l.title} loading="lazy" width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="ti ti-photo" style={{ color: '#ccc', fontSize: 20 }} aria-hidden="true" />}
                      </div>
                      <div role="link" tabIndex={0} className="listing-info" onClick={() => window.location.href = `/listing/${l.id}`} onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/listing/${l.id}` }}>
                        <div className="listing-title">{l.title}</div>
                        <div className="listing-price">{fmt(l.price, l.currency)}</div>
                        <div className="listing-meta"><span aria-hidden="true">👁</span> {l.views_count || 0} · <span aria-hidden="true">📍</span> {l.city || 'Shqipëri'}{l.is_premium ? ' · ⭐ Premium' : ''}</div>
                      </div>
                      {l.is_active && (canBump(l.last_bumped_at) ? (
                        <button
                          type="button"
                          className="edit-listing-btn"
                          onClick={() => bumpListing(l.id)}
                          aria-label="Rifresko shpalljen"
                          style={{ fontSize: 13 }}
                        ><span aria-hidden="true">⬆️</span></button>
                      ) : (
                        (() => { const m = bumpMbetur(l.last_bumped_at); return (
                          <span title={`Mund ta rifreskosh pas ${m.n} ${m.njesia === 'ore' ? 'orësh' : 'ditësh'}`}
                            style={{ fontSize: 10, color: '#6B6B6B', padding: '0 4px', cursor: 'default' }}>
                            {m.n}{m.njesia === 'ore' ? 'h' : 'd'}
                          </span>
                        ) })()
                      ))}
                      {!l.is_active && l.status !== 'sold' && (
                        <button type="button" className="edit-listing-btn" disabled={reactBusy === l.id} onClick={() => reactivateListing(l.id)} aria-label="Riaktivizo shpalljen" title="Riaktivizo" style={{ fontSize: 13 }}><span aria-hidden="true">{reactBusy === l.id ? '⏳' : '♻️'}</span></button>
                      )}
                      <button type="button" className="edit-listing-btn" onClick={() => window.location.href = `/listing/${l.id}/edit`} aria-label="Ndrysho">✏️</button>
                      {l.is_active && (pendingSold === l.id ? (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <button type="button" onClick={() => markSold(l.id)} style={{ background: 'linear-gradient(135deg,#0E7A35,#0b6a2e)', color: '#fff', border: 'none', borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Shitur ✓</button>
                          <button type="button" onClick={() => setPendingSold(null)} style={{ background: '#eee', color: '#555', border: 'none', borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Jo</button>
                        </div>
                      ) : (
                        <button type="button" className="edit-listing-btn" onClick={() => setPendingSold(l.id)} aria-label="Shëno si të shitur" title="Shëno si të shitur"><span aria-hidden="true">💰</span></button>
                      ))}
                      {pendingDelete === l.id ? (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <button type="button" onClick={() => deleteListing(l.id)} style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Fshi</button>
                          <button type="button" onClick={() => setPendingDelete(null)} style={{ background: '#eee', color: '#555', border: 'none', borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Jo</button>
                        </div>
                      ) : (
                        <button type="button" className="del-btn" onClick={() => setPendingDelete(l.id)} aria-label="Fshi shpalljen"><span aria-hidden="true">🗑</span></button>
                      )}
                    </div>
                  ))
                )
                })()}
              </div>
            </>
          )}

          {/* Saved Listings Tab */}
          {activeTab === 'saved' && (
            <div className="card">
              <div className="card-hdr">
                <span className="card-title"><span aria-hidden="true">❤️</span> Shpalljet e ruajtura ({savedListings.length})</span>
              </div>
              {savedListings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#555', fontSize: 12 }}>
                  <i className="ti ti-heart" style={{ fontSize: 36, display: 'block', marginBottom: 10, color: '#F5C842' }} aria-hidden="true" />
                  Nuk ke shpallje të ruajtura.<br />Hap zemrën <i className="ti ti-heart" style={{ fontSize: 11 }} aria-hidden="true" /> në çdo shpallje!
                </div>
              ) : (
                savedListings.map((l: any) => (
                  <div key={l.id} className="listing-row" tabIndex={0} onClick={() => window.location.href = `/listing/${l.id}`} onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/listing/${l.id}` }} style={{ cursor: 'pointer' }}>
                    <div className="listing-thumb">
                      {l.images?.[0] ? <img src={l.images[0]} alt={l.title} loading="lazy" width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="ti ti-photo" style={{ color: '#ccc', fontSize: 20 }} aria-hidden="true" />}
                    </div>
                    <div className="listing-info">
                      <div className="listing-title">{l.title}</div>
                      <div className="listing-price">{fmt(l.price, l.currency)}</div>
                      <div className="listing-meta"><span aria-hidden="true">📍</span> {l.city || 'Shqipëri'}{l.is_active ? '' : ' · ✅ Shitur'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Saved Searches */}
          {activeTab === 'saved' && savedSearches.length > 0 && (
            <div className="card" style={{ marginTop: 10 }}>
              <div className="card-hdr">
                <span className="card-title"><span aria-hidden="true">🔔</span> Kërkimet e ruajtura ({savedSearches.length})</span>
              </div>
              {savedSearches.map((s: any) => {
                const parts = [s.query, s.filters?.city, s.filters?.cat, s.filters?.cond === 'i_ri' ? 'I ri' : s.filters?.cond === 'i_perdorur' ? 'I përdorur' : null, s.filters?.priceMin ? `Min: ${s.filters.priceMin}` : null, s.filters?.priceMax ? `Max: ${s.filters.priceMax}` : null].filter(Boolean)
                const urlParams = new URLSearchParams()
                if (s.query) urlParams.set('q', s.query)
                if (s.filters?.city) urlParams.set('city', s.filters.city)
                if (s.filters?.cat) urlParams.set('cat', s.filters.cat)
                if (s.filters?.cond) urlParams.set('cond', s.filters.cond)
                if (s.filters?.priceMin) urlParams.set('pmin', s.filters.priceMin)
                if (s.filters?.priceMax) urlParams.set('pmax', s.filters.priceMax)
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F6F6F6' }}>
                    <div role="link" tabIndex={0} style={{ flex: 1, fontSize: 12, color: '#111', cursor: 'pointer', fontWeight: 600 }} onClick={() => { window.location.href = `/search/results?${urlParams.toString()}` }} onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/search/results?${urlParams.toString()}` }}>
                      <><span aria-hidden="true">🔍</span> {parts.length > 0 ? parts.join(' · ') : 'Kërkim i ruajtur'}</>
                    </div>
                    <button type="button" aria-label="Fshi kërkimin e ruajtur" onClick={async () => { await supabase.from('saved_searches').delete().eq('id', s.id); setSavedSearches(prev => prev.filter(x => x.id !== s.id)) }} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <>
              <div className="card">
                <div className="card-hdr">
                  <span className="card-title"><span aria-hidden="true">💬</span> Bisedat e mia</span>
                  <button type="button" className="edit-btn" onClick={() => window.location.href = '/messages'}>
                    Hap →
                  </button>
                </div>

                {conversations.length === 0 ? (
                  <div className="inbox-empty">
                    <i className="ti ti-messages" aria-hidden="true" />
                    <p>Nuk ke biseda ende.<br />Kontakto një shitës nga shpalljet!</p>
                    <button type="button" className="inbox-empty-btn" onClick={() => window.location.href = '/'}>
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
                        <div key={conv.otherId} role="link" tabIndex={0} className="conv-row"
                          onClick={() => window.location.href = `/messages?with=${conv.otherId}`}
                          onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/messages?with=${conv.otherId}` }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar
                              src={p?.avatar_url}
                              name={name}
                              type={p?.shop_name ? 'business' : 'person'}
                              tier={tierNgaProfili(p)}
                              size={44}
                            />
                            {conv.unread > 0 && (
                              <span className="unread-dot">{conv.unread > 9 ? '9+' : conv.unread}</span>
                            )}
                          </div>
                          <div className="conv-body">
                            <div className="conv-name">
                              {name}
                              {tierNgaProfili(p) !== 'free' && <span className="conv-prem" role="img" aria-label="Premium">⭐</span>}
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

              <button type="button" className="open-msgs-btn" onClick={() => window.location.href = '/messages'}>
                <i className="ti ti-messages" aria-hidden="true" /> Hap Mesazherin e Plotë
              </button>
            </>
          )}

          {/* Shop Tab */}
          {activeTab === 'shop' && (() => {
            // BP2 §B3.2 — Butoni "Biznes" = një hyrje, TRE nën-butona/gjendje (kushtëzuar),
            // të treja të dukshme si te specifikimi; vetëm njëra aktive sipas planit+biznesit.
            //   G1 (!premium)          → Bëhu Premium → Planet
            //   G2 (premium && !biznes)→ Krijo faqen e biznesit (/biznese/new); çaktivizohet kur ka biznes
            //   G3 (premium && biznes) → Vepro si Biznes → /biznese/[id] (e vetmja rrugë brenda)
            // NDERO skadimin: tierNgaProfili lexon premium_expires_at (jo is_premium raw) →
            // përdorues me Premium të skaduar NUK sheh më "Krijo biznes" që RLS do ta refuzonte.
            const premium = tierNgaProfili(profile) !== 'free'
            const hasBiz = !!myBiz
            const g1 = !premium, g2 = premium && !hasBiz, g3 = premium && hasBiz
            const badge = (on: boolean, txtOn: string, txtOff: string) => (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: on ? '#dcfce7' : '#f0f0f0', color: on ? '#16a34a' : '#999' }}>{on ? txtOn : txtOff}</span>
            )
            const cardStyle = (on: boolean): React.CSSProperties => ({ borderLeft: `3px solid ${on ? '#C42305' : '#ddd'}`, opacity: on ? 1 : 0.6 })
            return (
              <>
                <div style={{ fontSize: 11.5, color: '#767676', margin: '2px 4px 10px', lineHeight: 1.5 }}>
                  Butoni <b>Biznes</b> — një hyrje, <b>tri gjendje</b>. Vetëm njëra është aktive; nën-butonat e menaxhimit rrinë te profili i biznesit.
                </div>

                {/* ── Gjendja 1 — Falas ─────────────────────────────── */}
                <div className="card" style={cardStyle(g1)}>
                  <div className="card-hdr">
                    <span className="card-title"><span aria-hidden="true">①</span> Gjendja 1 — Falas</span>
                    {badge(g1, 'aktive', 'ke Premium ✓')}
                  </div>
                  <p style={{ fontSize: 11.5, color: '#767676', margin: '2px 0 12px', lineHeight: 1.5 }}>
                    S’ka biznes pa plan. Orientim automatik te <b>Planet</b> (gate në server/RLS).
                  </p>
                  <button type="button" disabled={!g1} onClick={() => { if (g1) window.location.href = '/premium' }}
                    style={{ width: '100%', minHeight: 46, background: g1 ? 'linear-gradient(135deg,#F8D24E,#F5C842)' : '#f0f0f0', color: g1 ? '#111' : '#aaa', border: 'none', borderRadius: 11, fontSize: 13, fontWeight: 800, cursor: g1 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span aria-hidden="true">👑</span> Bëhu Premium → Shiko Planet
                  </button>
                </div>

                {/* ── Gjendja 2 — Premium, pa biznes ────────────────── */}
                <div className="card" style={cardStyle(g2)}>
                  <div className="card-hdr">
                    <span className="card-title"><span aria-hidden="true">②</span> Gjendja 2 — Premium, pa biznes</span>
                    {badge(g2, 'aktive', hasBiz ? 'ke biznes' : 'kërkon Premium')}
                  </div>
                  <p style={{ fontSize: 11.5, color: '#767676', margin: '2px 0 12px', lineHeight: 1.5 }}>
                    Regjistrimi për herë të parë — katalogu i plotë (Tipi → Nënkategoritë → Profili).
                  </p>
                  <button type="button" disabled={!g2} onClick={() => { if (g2) window.location.href = '/biznese/new' }}
                    style={{ width: '100%', minHeight: 46, background: g2 ? 'linear-gradient(135deg,#E63312,#c42a0e)' : '#f0f0f0', color: g2 ? '#fff' : '#aaa', border: 'none', borderRadius: 11, fontSize: 13, fontWeight: 800, cursor: g2 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                    + Krijo faqen e biznesit
                  </button>
                  {hasBiz && <p style={{ fontSize: 10.5, color: '#555', margin: '8px 0 0' }}>Ke tashmë një biznes → çaktivizohet (pa dublim).</p>}
                </div>

                {/* ── Gjendja 3 — Me biznes ─────────────────────────── */}
                <div className="card" style={cardStyle(g3)}>
                  <div className="card-hdr">
                    <span className="card-title"><span aria-hidden="true">③</span> Gjendja 3 — Me biznes</span>
                    {badge(g3, 'aktive', 'pa biznes')}
                  </div>
                  {g3 && myBiz ? (
                    <>
                      <p style={{ fontSize: 11.5, color: '#767676', margin: '2px 0 12px', lineHeight: 1.5 }}>
                        <b>{myBiz.name}</b>{myBiz.is_verified ? ' · ✅ i verifikuar' : ''} — menaxhoje te profili i tij i brendshëm. Identiteti dhe abonimi mbeten te llogaria jote personale.
                      </p>
                      <button type="button" aria-label="Vepro si biznes — hap profilin e brendshëm të biznesit"
                        onClick={() => { window.location.href = `/biznese/${myBiz.id}` }}
                        style={{ width: '100%', minHeight: 48, background: 'linear-gradient(135deg,#1a1a1a,#000)', color: '#F5C842', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <i className="ti ti-briefcase" aria-hidden="true" /> Vepro si Biznes → hap profilin
                      </button>
                      <button type="button" onClick={() => { window.location.href = `/biznese/${myBiz.id}?public=1` }}
                        style={{ width: '100%', marginTop: 8, minHeight: 40, background: 'none', border: 'none', color: '#C42305', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <i className="ti ti-eye" aria-hidden="true" /> Shiko faqen publike të biznesit
                      </button>
                    </>
                  ) : (
                    <p style={{ fontSize: 11.5, color: '#555', margin: '2px 0 0', lineHeight: 1.5 }}>
                      Kur të krijosh biznesin, këtu do të veprosh si biznes (hyrja te paneli i biznesit).
                    </p>
                  )}
                </div>
              </>
            )
          })()}
        </div>
      </div>
    </>
  )
}
