'use client'
// BLLOKU PËRFUNDIMTAR §3.8 — Formulari i VETËM i biznesit (create + edit), i plotë,
// profesional, i integruar. Ripërdoret nga /biznese/new dhe nga paneli i brendshëm
// (Të dhënat e biznesit). 7 seksione; vetëm Tipi+Nënkategoritë+Emri të detyrueshme;
// pjesa tjetër progresive (opsionale). Kolonat additive nga migrimi 20260825.
// §3.9: fshirja 3-shkallëshe (vetëm te editimi, vetëm-pronar, RPC delete_own_business).
// Nota: fushat opsionale ruhen si null kur bosh; hours ruan {days, schedule} për
// pajtueshmëri me shfaqjen ekzistuese (hours.schedule).
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { MapPicker } from './MapPicker'
import { uploadSingleImage } from '../../lib/uploadImages'
import FshirjeShkallezuar from './FshirjeShkallezuar'

const MAIN_TYPES = [
  { id: 'sherbime',          icon: '🛠️', label: 'Shërbime' },
  { id: 'produkte',          icon: '📦', label: 'Produkte' },
  { id: 'sherbime_produkte', icon: '🔁', label: 'Shërbime & Produkte' },
]
const DAYS = [['mon','Hënë'],['tue','Martë'],['wed','Mërkurë'],['thu','Enjte'],['fri','Premte'],['sat','Shtunë'],['sun','Diel']] as const
const PAY_OPTS = ['Para në dorë (COD)', 'PayPal', 'e-Para', 'EasyPay', 'Paysera', 'Kartë', 'Transfertë bankare']
const LEGAL_FORMS = ['Person fizik', 'SHPK', 'SHA', 'Tjetër']

interface SubCat { id: number; parent_type: string; name: string; slug: string; icon: string }
type Hours = Record<string, { closed: boolean; open: string; close: string }>

export interface BusinessInitial {
  id?: string
  name?: string; type?: string; description?: string; tagline?: string; founded_year?: number | null
  logo_url?: string | null; cover_url?: string | null; gallery?: string[] | null
  phone?: string; whatsapp?: string; email?: string; website?: string; contact_person?: string
  socials?: { instagram?: string; facebook?: string; tiktok?: string } | null
  city?: string; address?: string; latitude?: number | null; longitude?: number | null
  service_area?: string; delivery?: { ka?: boolean; detaje?: string } | null
  hours?: any; nipt?: string; legal_form?: string; withdrawal_days?: number
  payment_methods?: string[] | null; return_policy?: string; warranty?: string
  subcatIds?: number[]
}

const emptyHours = (): Hours => Object.fromEntries(DAYS.map(([k]) => [k, { closed: k === 'sun', open: '09:00', close: '18:00' }]))

function hoursSummary(h: Hours): string {
  const open = DAYS.filter(([k]) => !h[k].closed)
  if (open.length === 0) return 'Mbyllur'
  return open.map(([k, l]) => `${l} ${h[k].open}–${h[k].close}`).join(' · ')
}

export default function BusinessForm({ mode, initial, onSaved }: {
  mode: 'create' | 'edit'
  initial?: BusinessInitial
  onSaved?: (id: string) => void
}) {
  const [userId, setUserId]   = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg]         = useState('')
  const [subcats, setSubcats] = useState<SubCat[]>([])
  const [selSubs, setSelSubs] = useState<number[]>(initial?.subcatIds || [])
  const [mainType, setMainType] = useState(initial?.type || '')

  const [f, setForm] = useState({
    name: initial?.name || '', description: initial?.description || '', tagline: initial?.tagline || '',
    founded_year: initial?.founded_year ?? ('' as number | ''),
    phone: initial?.phone || '', whatsapp: initial?.whatsapp || '', email: initial?.email || '',
    website: initial?.website || '', contact_person: initial?.contact_person || '',
    ig: initial?.socials?.instagram || '', fb: initial?.socials?.facebook || '', tiktok: initial?.socials?.tiktok || '',
    city: initial?.city || '', address: initial?.address || '',
    latitude: initial?.latitude ?? null, longitude: initial?.longitude ?? null,
    service_area: initial?.service_area || '', delivery_ka: !!initial?.delivery?.ka, delivery_detaje: initial?.delivery?.detaje || '',
    nipt: initial?.nipt || '', legal_form: initial?.legal_form || '', withdrawal_days: initial?.withdrawal_days ?? 14,
    return_policy: initial?.return_policy || '', warranty: initial?.warranty || '',
  })
  const [pay, setPay] = useState<string[]>(initial?.payment_methods || [])
  const [hours, setHours] = useState<Hours>(() => {
    const h = initial?.hours
    if (h && typeof h === 'object' && h.days) return { ...emptyHours(), ...h.days }
    return emptyHours()
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [logoPrev, setLogoPrev] = useState(initial?.logo_url || '')
  const [coverPrev, setCoverPrev] = useState(initial?.cover_url || '')
  // Galeria si NJË listë e vetme e renditur (foto ekzistuese + të reja) → modalitet i plotë:
  // shto · fshi · rendit (e para = kryesore) · zëvendëso (fshi+shto). Rendi ruhet te "Ruaj".
  type GalItem = { id: string; url?: string; file?: File; prev?: string }
  const newId = () => (globalThis.crypto?.randomUUID?.() || 'g' + Math.random().toString(36).slice(2))
  const [galleryItems, setGalleryItems] = useState<GalItem[]>(
    (initial?.gallery || []).map(u => ({ id: newId(), url: u })),
  )
  function addGalleryFiles(files: File[]) {
    setGalleryItems(items => [...items, ...files.map(f => ({ id: newId(), file: f, prev: URL.createObjectURL(f) }))])
  }
  function removeGalleryItem(id: string) {
    setGalleryItems(items => { const it = items.find(x => x.id === id); if (it?.prev) URL.revokeObjectURL(it.prev); return items.filter(x => x.id !== id) })
  }
  function moveGalleryItem(id: string, dir: -1 | 1) {
    setGalleryItems(items => { const i = items.findIndex(x => x.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= items.length) return items; const cp = [...items];[cp[i], cp[j]] = [cp[j], cp[i]]; return cp })
  }

  // Fshirja 3-shkallëshe (§3.9) — tani përmes komponentit të përbashkët FshirjeShkallezuar.

  const setV = (k: string, v: any) => setForm(s => ({ ...s, [k]: v }))

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUserId(session.user.id)
    })
  }, [])

  useEffect(() => {
    if (!mainType) { setSubcats([]); return }
    const types = mainType === 'sherbime_produkte' ? ['sherbime', 'produkte', 'sherbime_produkte'] : [mainType]
    supabase.from('business_subcategories').select('*').in('parent_type', types).order('id')
      .then(({ data }) => { if (data) setSubcats(data) })
  }, [mainType])

  function toggleSub(id: number) { setSelSubs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]) }
  function togglePay(m: string) { setPay(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]) }

  // Ngarkimi i logos/kopertinës/galerisë përdor helper-in e vetëm `uploadSingleImage`
  // (lib/uploadImages): path UNIK → cache-bust automatik (foto e re duket menjëherë) +
  // zero përplasje mes bizneseve/rikrijueve; tip/extension i saktë; EXIF + webp; retry.

  async function save() {
    if (!mainType) { setMsg('err:Zgjidh llojin e biznesit.'); return }
    if (selSubs.length === 0) { setMsg('err:Zgjidh të paktën një nënkategori.'); return }
    if (!f.name.trim()) { setMsg('err:Emri i biznesit është i detyrueshëm.'); return }
    if (!userId) return
    setSaving(true); setMsg(''); setUploading(true)
    let logoUrl = logoPrev, coverUrl = coverPrev; const gal: string[] = []
    try {
      if (logoFile) {
        const r = await uploadSingleImage(logoFile, 'avatars')
        if (r.error || !r.url) throw new Error(r.error || 'ngarkimi i logos dështoi')
        logoUrl = r.url
      }
      if (coverFile) {
        const r = await uploadSingleImage(coverFile, 'covers')
        if (r.error || !r.url) throw new Error(r.error || 'ngarkimi i kopertinës dështoi')
        coverUrl = r.url
      }
      // Ngarko sipas RENDIT të galerisë (e para = kryesore); foto ekzistuese ruhen si janë.
      for (const it of galleryItems) {
        if (it.url) { gal.push(it.url); continue }
        if (it.file) {
          const r = await uploadSingleImage(it.file, 'listing-images')
          if (r.error || !r.url) throw new Error(r.error || 'ngarkimi i galerisë dështoi')
          gal.push(r.url)
        }
      }
    } catch (e: any) { setMsg(`err:Gabim gjatë ngarkimit: ${e.message}`); setSaving(false); setUploading(false); return }
    setUploading(false)
    // Pas ngarkimit të suksesshëm: pastro skedarët në pritje (parandalon ringarkim/dublime
    // te "Ruaj" i dytë — BUG #4) dhe përditëso preview-n e galerisë me URL-të e ruajtura.
    setLogoFile(null); setCoverFile(null); setGalleryItems(gal.map(u => ({ id: newId(), url: u })))

    const payload: any = {
      name: f.name.trim(), type: mainType,
      description: f.description || null, tagline: f.tagline || null,
      founded_year: f.founded_year ? Number(f.founded_year) : null,
      logo_url: logoUrl || null, cover_url: coverUrl || null, gallery: gal.length ? gal : null,
      phone: f.phone || null, whatsapp: f.whatsapp || null, email: f.email || null,
      website: f.website || null, contact_person: f.contact_person || null,
      socials: (f.ig || f.fb || f.tiktok) ? { instagram: f.ig || null, facebook: f.fb || null, tiktok: f.tiktok || null } : null,
      city: f.city || null, address: f.address || null, latitude: f.latitude, longitude: f.longitude,
      service_area: f.service_area || null,
      delivery: f.delivery_ka ? { ka: true, detaje: f.delivery_detaje || null } : { ka: false },
      hours: { days: hours, schedule: hoursSummary(hours) },
      nipt: f.nipt || null, legal_form: f.legal_form || null, withdrawal_days: Math.min(60, Math.max(14, Number(f.withdrawal_days) || 14)),
      payment_methods: pay.length ? pay : null, return_policy: f.return_policy || null, warranty: f.warranty || null,
    }

    let bizId = initial?.id
    if (mode === 'edit' && bizId) {
      const { error } = await supabase.from('businesses').update(payload).eq('id', bizId)
      if (error) { setMsg(`err:${error.message}`); setSaving(false); return }
    } else {
      payload.owner_id = userId
      payload.slug = f.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
      const { data: biz, error } = await supabase.from('businesses').insert(payload).select('id').single()
      if (error) { setMsg(`err:${error.message}`); setSaving(false); return }
      bizId = biz.id
    }

    // Nënkategoritë: rifresko hartën (fshi + rifut) — idempotent.
    if (bizId) {
      await supabase.from('business_subcategory_map').delete().eq('business_id', bizId)
      await supabase.from('business_subcategory_map').insert(selSubs.map(sid => ({ business_id: bizId, subcategory_id: sid })))
      await supabase.from('profiles').update({ shop_name: f.name.trim() }).eq('id', userId)
    }
    setSaving(false)
    if (bizId) { if (onSaved) onSaved(bizId); else window.location.href = `/biznese/${bizId}` }
  }

  // onFshi për FshirjeShkallezuar: kthen mesazh gabimi ose null (sukses → ridrejton).
  async function doDelete(): Promise<string | null> {
    if (!initial?.id) return 'Biznesi mungon.'
    const { error } = await supabase.rpc('delete_own_business', { p_business_id: initial.id })
    if (error) return `Fshirja dështoi: ${error.message}`
    // Pas fshirjes: tab Biznes → G2 (krijo). Kthehu te profili.
    window.location.href = '/profile?tab=shop'
    return null
  }

  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }
  const sec: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: '#C42B0F', textTransform: 'uppercase', letterSpacing: 0.5, margin: '18px 0 10px' }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        .bf-input{width:100%;border:1px solid #e5e5e5;border-radius:10px;padding:11px 13px;font-size:13px;font-family:inherit;background:#fff;outline:none;box-sizing:border-box;}
        .bf-input:focus{border-color:#E63312;}
        .bf-chip{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1.5px solid #ddd;border-radius:20px;padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;}
        .bf-chip.on{background:#F5C842;border-color:#F5C842;color:#111;}
        .bf-save{width:100%;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:13px;padding:15px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;margin-top:20px;}
        .bf-save:disabled{opacity:.5;cursor:not-allowed;}
      ` }} />

      {msg && (
        <div role="alert" style={{ background: msg.startsWith('err:') ? '#FFF0EE' : '#F0FFF4', border: `1px solid ${msg.startsWith('err:') ? '#F09595' : '#86efac'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: msg.startsWith('err:') ? '#C42305' : '#166534', fontWeight: 600 }}>
          {msg.replace(/^(err|warn):/, '')}
        </div>
      )}

      {/* Kopertina + logo. Avatar-i është SIBLING i kopertinës (jo brenda overflow:hidden) →
          gjysma e poshtme + butoni i kamerës NUK priten dhe janë të kapshme (rregullim). */}
      <div style={{ position: 'relative', width: '100%', marginBottom: 44 }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/6', borderRadius: 12, overflow: 'hidden', background: coverPrev ? 'transparent' : 'linear-gradient(135deg,#F5C842,#E63312)' }}>
          {coverPrev && <img src={coverPrev} alt="Kopertinë" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <label style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: coverPrev ? 'rgba(0,0,0,.25)' : 'none' }}>
            <span style={{ background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700 }}><span aria-hidden="true">📷</span> {coverPrev ? 'Ndrysho kopertinën' : 'Shto kopertinën'}</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const x = e.target.files?.[0]; if (x) { setCoverFile(x); setCoverPrev(URL.createObjectURL(x)) } }} />
          </label>
          {coverPrev && (
            <button type="button" aria-label="Hiq kopertinën" onClick={() => { setCoverFile(null); setCoverPrev('') }} style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
          )}
        </div>
        {/* Logo/avatar — jashtë overflow-it, i tërë tappable (≥44px), me badge kamere + hiq */}
        <div style={{ position: 'absolute', bottom: -22, left: 16, width: 64, height: 64 }}>
          <label aria-label={logoPrev ? 'Ndrysho logon' : 'Shto logon'} style={{ display: 'block', position: 'relative', width: 64, height: 64, borderRadius: '50%', background: '#fff', border: '3px solid #fff', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
            {logoPrev
              ? <img src={logoPrev} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }} aria-hidden="true">🏢</span>}
            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 10, textAlign: 'center', padding: '1px 0' }} aria-hidden="true">📷</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const x = e.target.files?.[0]; if (x) { setLogoFile(x); setLogoPrev(URL.createObjectURL(x)) } }} />
          </label>
          {logoPrev && (
            <button type="button" aria-label="Hiq logon" onClick={() => { setLogoFile(null); setLogoPrev('') }} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#E63312', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 11, lineHeight: 1 }}>✕</button>
          )}
        </div>
      </div>

      {/* 1 · Tipi & Nënkategoritë */}
      <div style={sec}>1 · Tipi & Kategoritë *</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {MAIN_TYPES.map(t => (
          <button key={t.id} type="button" className={`bf-chip ${mainType === t.id ? 'on' : ''}`} onClick={() => { setMainType(t.id); setSelSubs([]) }}>
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
      {subcats.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {subcats.map(s => (
            <button key={s.id} type="button" className={`bf-chip ${selSubs.includes(s.id) ? 'on' : ''}`} onClick={() => toggleSub(s.id)}>
              {s.icon} {s.name}
            </button>
          ))}
        </div>
      )}

      {/* 2 · Identiteti vizual */}
      <div style={sec}>2 · Identiteti vizual</div>
      <label style={lbl}>Slogan / Moto</label>
      <input className="bf-input" value={f.tagline} onChange={e => setV('tagline', e.target.value)} placeholder="p.sh. Cilësi që i besohet" maxLength={120} />
      <label style={{ ...lbl, marginTop: 12 }}>Galeria (foto shtesë)</label>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        {galleryItems.map((it, i) => (
          <div key={it.id} style={{ position: 'relative', width: 72 }}>
            <div style={{ position: 'relative', width: 72, height: 72 }}>
              <img src={it.file ? it.prev : it.url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: i === 0 ? '2px solid #F5C842' : '1px solid #eee' }} />
              {i === 0 && <span style={{ position: 'absolute', top: 0, left: 0, background: '#F5C842', color: '#111', fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: '8px 0 6px 0' }} aria-hidden="true">KRYESORE</span>}
              {it.file && <span style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(14,122,53,.9)', color: '#fff', fontSize: 8, padding: '1px 4px', borderRadius: '6px 0 8px 0' }} aria-hidden="true">E re</span>}
              <button type="button" aria-label="Fshi foton" onClick={() => removeGalleryItem(it.id)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#E63312', color: '#fff', border: '2px solid #fff', cursor: 'pointer', fontSize: 11, lineHeight: 1 }}>✕</button>
            </div>
            {/* Rendit: ◀ ▶ (e para = kryesore) */}
            <div style={{ display: 'flex', gap: 4, marginTop: 3, justifyContent: 'center' }}>
              <button type="button" aria-label="Zhvendos majtas" disabled={i === 0} onClick={() => moveGalleryItem(it.id, -1)} style={{ flex: 1, border: '1px solid #ddd', background: i === 0 ? '#f5f5f5' : '#fff', borderRadius: 6, fontSize: 11, cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? '#ccc' : '#555', lineHeight: 1.6, fontFamily: 'inherit' }}>◀</button>
              <button type="button" aria-label="Zhvendos djathtas" disabled={i === galleryItems.length - 1} onClick={() => moveGalleryItem(it.id, 1)} style={{ flex: 1, border: '1px solid #ddd', background: i === galleryItems.length - 1 ? '#f5f5f5' : '#fff', borderRadius: 6, fontSize: 11, cursor: i === galleryItems.length - 1 ? 'default' : 'pointer', color: i === galleryItems.length - 1 ? '#ccc' : '#555', lineHeight: 1.6, fontFamily: 'inherit' }}>▶</button>
            </div>
          </div>
        ))}
        <label style={{ width: 72, height: 72, borderRadius: 8, border: '1.5px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 24, color: '#aaa' }}>
          +
          <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { addGalleryFiles(Array.from(e.target.files || [])); e.target.value = '' }} />
        </label>
      </div>
      <div style={{ fontSize: 11, color: '#555' }}>
        Shto (+) · fshi (✕) · rendit (◀ ▶). Foto e parë është <b>kryesore</b>.
        {galleryItems.some(it => it.file) && <span style={{ color: '#0E7A35', fontWeight: 600 }}> Ndryshimet ruhen te “Ruaj”.</span>}
      </div>

      {/* 3 · Informacion bazë */}
      <div style={sec}>3 · Informacion bazë</div>
      <label style={lbl}>Emri i biznesit *</label>
      <input className="bf-input" value={f.name} onChange={e => setV('name', e.target.value)} placeholder="p.sh. Elektro Servisi Tirana" maxLength={80} required />
      <label style={{ ...lbl, marginTop: 12 }}>Përshkrim</label>
      <textarea className="bf-input" value={f.description} onChange={e => setV('description', e.target.value)} placeholder="Çfarë ofroni..." maxLength={500} style={{ resize: 'none', minHeight: 80 }} />
      <label style={{ ...lbl, marginTop: 12 }}>Viti i themelimit</label>
      <input className="bf-input" type="number" min={1900} max={2100} value={f.founded_year} onChange={e => setV('founded_year', e.target.value ? parseInt(e.target.value) : '')} placeholder="p.sh. 2015" />

      {/* 4 · Kontakti */}
      <div style={sec}>4 · Kontakti</div>
      <label style={lbl}>Telefon</label>
      <input className="bf-input" type="tel" value={f.phone} onChange={e => setV('phone', e.target.value)} placeholder="+355 6X XXX XXXX" />
      <label style={{ ...lbl, marginTop: 12 }}>WhatsApp / Viber</label>
      <input className="bf-input" type="tel" value={f.whatsapp} onChange={e => setV('whatsapp', e.target.value)} placeholder="+355 6X XXX XXXX" />
      <label style={{ ...lbl, marginTop: 12 }}>Email</label>
      <input className="bf-input" type="email" value={f.email} onChange={e => setV('email', e.target.value)} placeholder="info@biznesi.al" />
      <label style={{ ...lbl, marginTop: 12 }}>Website</label>
      <input className="bf-input" type="url" value={f.website} onChange={e => setV('website', e.target.value)} placeholder="https://..." />
      <label style={{ ...lbl, marginTop: 12 }}>Personi i kontaktit</label>
      <input className="bf-input" value={f.contact_person} onChange={e => setV('contact_person', e.target.value)} placeholder="Emri Mbiemri" maxLength={80} />
      <label style={{ ...lbl, marginTop: 12 }}>Rrjete sociale</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input className="bf-input" value={f.ig} onChange={e => setV('ig', e.target.value)} placeholder="Instagram (username ose link)" />
        <input className="bf-input" value={f.fb} onChange={e => setV('fb', e.target.value)} placeholder="Facebook" />
        <input className="bf-input" value={f.tiktok} onChange={e => setV('tiktok', e.target.value)} placeholder="TikTok" />
      </div>

      {/* 5 · Vendndodhja & mbulimi */}
      <div style={sec}>5 · Vendndodhja & mbulimi</div>
      <label style={lbl}>Qyteti</label>
      <input className="bf-input" value={f.city} onChange={e => setV('city', e.target.value)} placeholder="p.sh. Tiranë" maxLength={80} />
      <label style={{ ...lbl, marginTop: 12 }}><span aria-hidden="true">📍</span> Adresa (harta OSM)</label>
      <MapPicker address={f.address} lat={f.latitude} lng={f.longitude} onChange={(lat, lng, address) => { setV('latitude', lat); setV('longitude', lng); setV('address', address) }} />
      <label style={{ ...lbl, marginTop: 12 }}>Zona e shërbimit</label>
      <input className="bf-input" value={f.service_area} onChange={e => setV('service_area', e.target.value)} placeholder="p.sh. Tiranë, Durrës dhe rrethina" />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, cursor: 'pointer' }}>
        <input type="checkbox" checked={f.delivery_ka} onChange={e => setV('delivery_ka', e.target.checked)} /> Ofron dorëzim
      </label>
      {f.delivery_ka && <input className="bf-input" style={{ marginTop: 8 }} value={f.delivery_detaje} onChange={e => setV('delivery_detaje', e.target.value)} placeholder="Detaje dorëzimi (tarifa, zona, afat)" />}

      {/* 6 · Orari */}
      <div style={sec}>6 · Orari</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {DAYS.map(([k, l]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 64, fontSize: 12, fontWeight: 600, color: '#555' }}>{l}</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#555', cursor: 'pointer' }}>
              <input type="checkbox" checked={hours[k].closed} onChange={e => setHours(h => ({ ...h, [k]: { ...h[k], closed: e.target.checked } }))} /> Mbyllur
            </label>
            {!hours[k].closed && (
              <>
                <input type="time" className="bf-input" style={{ width: 110, padding: '7px 8px' }} value={hours[k].open} onChange={e => setHours(h => ({ ...h, [k]: { ...h[k], open: e.target.value } }))} />
                <span style={{ color: '#aaa' }}>–</span>
                <input type="time" className="bf-input" style={{ width: 110, padding: '7px 8px' }} value={hours[k].close} onChange={e => setHours(h => ({ ...h, [k]: { ...h[k], close: e.target.value } }))} />
              </>
            )}
          </div>
        ))}
      </div>

      {/* 7 · Ligjore (B2C) */}
      <div style={sec}>7 · Të dhëna ligjore (B2C)</div>
      <label style={lbl}>NIPT / Nr. TVSH</label>
      <input className="bf-input" value={f.nipt} onChange={e => setV('nipt', e.target.value.toUpperCase())} placeholder="p.sh. K12345678A" maxLength={20} />
      <label style={{ ...lbl, marginTop: 12 }}>Forma ligjore</label>
      <select className="bf-input" value={f.legal_form} onChange={e => setV('legal_form', e.target.value)}>
        <option value="">— Zgjidh —</option>
        {LEGAL_FORMS.map(x => <option key={x} value={x}>{x}</option>)}
      </select>
      <label style={{ ...lbl, marginTop: 12 }}>E drejta e tërheqjes (ditë, min. 14)</label>
      <input className="bf-input" type="number" min={14} max={60} value={f.withdrawal_days} onChange={e => setV('withdrawal_days', parseInt(e.target.value) || 14)} />
      <label style={{ ...lbl, marginTop: 12 }}>Metodat e pagesës</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PAY_OPTS.map(m => (
          <button key={m} type="button" className={`bf-chip ${pay.includes(m) ? 'on' : ''}`} onClick={() => togglePay(m)}>{m}</button>
        ))}
      </div>
      <label style={{ ...lbl, marginTop: 12 }}>Politika e kthimit</label>
      <textarea className="bf-input" value={f.return_policy} onChange={e => setV('return_policy', e.target.value)} placeholder="Kushtet e kthimit të produktit..." maxLength={400} style={{ resize: 'none', minHeight: 60 }} />
      <label style={{ ...lbl, marginTop: 12 }}>Garancia</label>
      <textarea className="bf-input" value={f.warranty} onChange={e => setV('warranty', e.target.value)} placeholder="Kushtet e garancisë..." maxLength={400} style={{ resize: 'none', minHeight: 60 }} />

      <button type="button" className="bf-save" disabled={saving || !f.name.trim()} onClick={save}>
        {saving ? (uploading ? '⏳ Duke ngarkuar...' : '⏳ Duke ruajtur...') : (mode === 'edit' ? '✓ Ruaj ndryshimet' : '✓ Krijo Biznesin')}
      </button>

      {/* §3.9 — Fshirja 3-shkallëshe (vetëm te editimi). I NJËJTI komponent si te
          fshirja e llogarisë (urdhër pronari, 2 shtator 2026): konfirmim me EMRIN. */}
      {mode === 'edit' && initial?.id && (
        <div style={{ marginTop: 28, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <FshirjeShkallezuar
            butoniHapja="Fshij biznesin"
            titull="Fshirje e biznesit — e pakthyeshme"
            tip="emri"
            emriPritur={initial.name || ''}
            paralajmerim={<>Do të fshihen <b>përfundimisht</b>: faqja e biznesit, <b>shpalljet e tij, vlerësimet, ndjekësit</b> dhe kategoritë. <b>Këto humbasin dhe nuk kthehen</b> — shpalljet e biznesit çaktivizohen dhe <b>nuk</b> kalojnë te profili yt personal. Llogaria jote personale dhe të dhënat e saj nuk preken.</>}
            onFshi={doDelete}
          />
        </div>
      )}
    </div>
  )
}
