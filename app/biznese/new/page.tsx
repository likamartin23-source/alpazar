'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { MapPicker } from '../../components/MapPicker'

const MAIN_TYPES = [
  { id: 'sherbime',          icon: '🛠️', label: 'Shërbime',           desc: 'Riparime, transport, bukuri, IT, evente...' },
  { id: 'produkte',          icon: '📦', label: 'Produkte',            desc: 'Veshje, elektronikë, shtëpi, ushqim, auto...' },
  { id: 'sherbime_produkte', icon: '🔁', label: 'Shërbime & Produkte', desc: 'Të dyja bashkë' },
]

interface SubCat { id: number; parent_type: string; name: string; slug: string; icon: string }

export default function BiznesNewPage() {
  const [step, setStep]         = useState(1)
  const [userId, setUserId]     = useState<string | null>(null)
  const [mainType, setMainType] = useState<string>('')
  const [subcats, setSubcats]   = useState<SubCat[]>([])
  const [selSubs, setSelSubs]   = useState<number[]>([])
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')

  const [form, setForm] = useState({
    name: '', description: '', address: '', phone: '', website: '',
    hours: 'Hënë–Premte 09:00–18:00',
    email: '', city: '', nipt: '', withdrawal_days: 14,
    latitude: null as number | null, longitude: null as number | null,
    logo_url: '', cover_url: '',
  })
  const [logoFile, setLogoFile]   = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview]   = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUserId(session.user.id)
    })
  }, [])

  useEffect(() => {
    if (!mainType) return
    const types = mainType === 'sherbime_produkte' ? ['sherbime', 'produkte', 'sherbime_produkte'] : [mainType]
    supabase.from('business_subcategories')
      .select('*')
      .in('parent_type', types)
      .order('id')
      .then(({ data }) => { if (data) setSubcats(data) })
  }, [mainType])

  function setF(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  function toggleSub(id: number) {
    setSelSubs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function compressImage(file: File, maxW: number): Promise<Blob> {
    if (file.size < 100 * 1024) return file
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

  async function uploadFile(file: File, path: string, maxW: number, bucket = 'listing-images'): Promise<string> {
    const blob = await compressImage(file, maxW)
    const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg', upsert: true })
    if (error) throw error
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  async function submit() {
    if (!form.name.trim()) { setMsg('err:Emri i biznesit është i detyrueshëm!'); return }
    if (!mainType) { setMsg('err:Zgjidh llojin e biznesit!'); return }
    if (selSubs.length === 0) { setMsg('err:Zgjidh të paktën një nënkategori!'); return }
    if (!userId) return
    setSaving(true); setMsg(''); setUploading(true)

    let logoUrl = '', coverUrl = ''
    try {
      // UID si dosja e parë — kjo është e detyrueshme nga RLS policy
      if (logoFile) logoUrl = await uploadFile(logoFile, `${userId}/biz-logo.jpg`, 400, 'avatars')
      if (coverFile) coverUrl = await uploadFile(coverFile, `${userId}/biz-cover.jpg`, 1920, 'covers')
    } catch (e: any) {
      setMsg(`err:Gabim gjatë ngarkimit të fotove: ${e.message}`); setSaving(false); setUploading(false); return
    }
    setUploading(false)

    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
    const { data: biz, error } = await supabase.from('businesses').insert({
      owner_id: userId,
      name: form.name.trim(),
      slug,
      type: mainType,
      description: form.description || null,
      address: form.address || null,
      latitude: form.latitude, longitude: form.longitude,
      phone: form.phone || null,
      website: form.website || null,
      hours: form.hours ? { schedule: form.hours } : null,
      email: form.email || null,
      city: form.city || null,
      nipt: form.nipt || null,
      withdrawal_days: form.withdrawal_days || 14,
      logo_url: logoUrl || null,
      cover_url: coverUrl || null,
    }).select('id').single()

    if (error) { setMsg(`err:${error.message}`); setSaving(false); return }

    if (biz && selSubs.length > 0) {
      await supabase.from('business_subcategory_map').insert(
        selSubs.map(sid => ({ business_id: biz.id, subcategory_id: sid }))
      )
    }

    // Sync shop_name on profile so business badge appears in profile page
    await supabase.from('profiles').update({ shop_name: form.name.trim() }).eq('id', userId)

    window.location.href = `/biznese/${biz!.id}`
  }

  const dots = [1, 2, 3]

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh', paddingBottom: 80 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .biz-card{background:#fff;border:1.5px solid #eee;borderRadius:14px;padding:18px 16px;marginBottom:10px;cursor:pointer;transition:border .15s,background .15s;}
        .biz-card.sel{border-color:#E63312;background:#FFF6F4;}
        .sub-chip{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1.5px solid #e0e0e0;borderRadius:20px;padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;}
        .sub-chip.sel{background:#F5C842;border-color:#F5C842;color:#111;}
        .biz-input{width:100%;border:1px solid #e5e5e5;borderRadius:10px;padding:11px 13px;fontSize:13px;fontFamily:inherit;background:#fff;outline:none;boxSizing:border-box;}
        .biz-input:focus{border-color:#E63312;}
        .step-btn{width:100%;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;borderRadius:13px;padding:15px;fontSize:15px;fontWeight:700;cursor:pointer;fontFamily:inherit;}
        .step-btn:disabled{opacity:.5;cursor:not-allowed;}
        .back-btn{background:none;border:none;cursor:pointer;color:#111;display:flex;alignItems:center;gap:6px;fontSize:13px;fontWeight:600;fontFamily:inherit;padding:0;}
      ` }} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button type="button" aria-label="Kthehu mbrapa" onClick={() => step > 1 ? setStep(s => s - 1) : window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111', flex: 1, margin: 0 }}><span aria-hidden="true">🏢</span> Krijo Biznes Online</h1>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5 }}>
          {dots.map(i => (
            <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? '#E63312' : i < step ? '#111' : '#ddd', transition: 'all .2s' }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {msg && (
          <div role="alert" style={{ background: msg.startsWith('err:') ? '#FFF0EE' : '#F0FFF4', border: `1px solid ${msg.startsWith('err:') ? '#F09595' : '#86efac'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: msg.startsWith('err:') ? '#E63312' : '#166534', fontWeight: 600 }}>
            {msg.startsWith('err:') ? msg.slice(4) : msg}
          </div>
        )}

        {/* STEP 1 — Main type */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 6 }}>Çfarë ofron biznesi yt?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Zgjidh kategorinë kryesore</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {MAIN_TYPES.map(t => (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={mainType === t.id}
                  onClick={() => setMainType(t.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setMainType(t.id) }}
                  style={{ background: mainType === t.id ? '#FFF6F4' : '#fff', border: `2px solid ${mainType === t.id ? '#E63312' : '#eee'}`, borderRadius: 14, padding: '16px 16px', cursor: 'pointer', transition: 'all .15s' }}
                >
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{t.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{t.desc}</div>
                </div>
              ))}
            </div>
            <button type="button" className="step-btn" disabled={!mainType} onClick={() => setStep(2)}>Vazhdo →</button>
          </>
        )}

        {/* STEP 2 — Subcategories */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 6 }}>Zgjidh nënkategoritë</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
              {MAIN_TYPES.find(t => t.id === mainType)?.icon} {MAIN_TYPES.find(t => t.id === mainType)?.label} · Lejon zgjedhje të shumta
            </div>
            {mainType === 'sherbime_produkte' && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#E63312', marginBottom: 8 }}><span aria-hidden="true">🛠️</span> SHËRBIME</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {subcats.filter(s => s.parent_type === 'sherbime').map(s => (
                    <div key={s.id} role="checkbox" aria-checked={selSubs.includes(s.id)} tabIndex={0} onClick={() => toggleSub(s.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSub(s.id) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: selSubs.includes(s.id) ? '#F5C842' : '#fff', border: `1.5px solid ${selSubs.includes(s.id) ? '#F5C842' : '#ddd'}`, borderRadius: 20, padding: '7px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                      {s.icon} {s.name}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#E63312', marginBottom: 8 }}><span aria-hidden="true">📦</span> PRODUKTE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {subcats.filter(s => s.parent_type === 'produkte').map(s => (
                    <div key={s.id} role="checkbox" aria-checked={selSubs.includes(s.id)} tabIndex={0} onClick={() => toggleSub(s.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSub(s.id) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: selSubs.includes(s.id) ? '#F5C842' : '#fff', border: `1.5px solid ${selSubs.includes(s.id) ? '#F5C842' : '#ddd'}`, borderRadius: 20, padding: '7px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                      {s.icon} {s.name}
                    </div>
                  ))}
                </div>
                {subcats.filter(s => s.parent_type === 'sherbime_produkte').length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#E63312', marginBottom: 8 }}><span aria-hidden="true">🔁</span> TË DYJA</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {subcats.filter(s => s.parent_type === 'sherbime_produkte').map(s => (
                        <div key={s.id} role="checkbox" aria-checked={selSubs.includes(s.id)} tabIndex={0} onClick={() => toggleSub(s.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSub(s.id) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: selSubs.includes(s.id) ? '#F5C842' : '#fff', border: `1.5px solid ${selSubs.includes(s.id) ? '#F5C842' : '#ddd'}`, borderRadius: 20, padding: '7px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                          {s.icon} {s.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            {mainType !== 'sherbime_produkte' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {subcats.map(s => (
                  <div key={s.id} role="button" tabIndex={0} aria-pressed={selSubs.includes(s.id)} onClick={() => toggleSub(s.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSub(s.id) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: selSubs.includes(s.id) ? '#F5C842' : '#fff', border: `1.5px solid ${selSubs.includes(s.id) ? '#F5C842' : '#ddd'}`, borderRadius: 20, padding: '7px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                    {s.icon} {s.name}
                  </div>
                ))}
              </div>
            )}
            {selSubs.length > 0 && (
              <div style={{ fontSize: 12, color: '#E63312', fontWeight: 700, marginBottom: 16 }}><span aria-hidden="true">✓</span> {selSubs.length} të zgjedhura</div>
            )}
            <button type="button" className="step-btn" disabled={selSubs.length === 0} onClick={() => setStep(3)}>Vazhdo →</button>
          </>
        )}

        {/* STEP 3 — Business details */}
        {step === 3 && (
          <>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 20 }}>Profili i Biznesit</div>

            {/* Cover upload */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/6', borderRadius: 12, overflow: 'hidden', marginBottom: 40, background: coverPreview ? 'transparent' : 'linear-gradient(135deg,#F5C842,#E63312)', cursor: 'pointer' }}>
              {coverPreview && <img src={coverPreview} alt="Foto kopertinë" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <label style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: coverPreview ? 'rgba(0,0,0,.3)' : 'none' }}>
                <span style={{ background: 'rgba(0,0,0,.5)', color: '#fff', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700 }}><span aria-hidden="true">📷</span> {coverPreview ? 'Ndrysho kopertinën' : 'Shto kopertinën'}</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) } }} />
              </label>
              {/* Logo overlay */}
              <div style={{ position: 'absolute', bottom: -28, left: 16 }}>
                <div style={{ position: 'relative', width: 56, height: 56 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: '3px solid #fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                    {logoPreview ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span aria-hidden="true">🏢</span>}
                  </div>
                  <label aria-label="Ndrysho logon" style={{ position: 'absolute', bottom: -2, right: -2, background: '#E63312', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'pointer', border: '2px solid #fff' }}>
                    <span aria-hidden="true">📷</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) } }} />
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label htmlFor="biz-name" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>Emri i biznesit *</label>
                <input id="biz-name" type="text" className="biz-input" autoComplete="organization" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="p.sh. Elektro Servisi Tirana" maxLength={80} required />
              </div>
              <div>
                <label htmlFor="biz-description" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>Përshkrim</label>
                <textarea id="biz-description" className="biz-input" value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Çfarë bëni? Si mund t'ju ndihmojmë..." maxLength={500} style={{ resize: 'none', minHeight: 80 }} />
              </div>
              <div>
                <label htmlFor="biz-address" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}><span aria-hidden="true">📍</span> Adresa (harta OSM)</label>
                <MapPicker
                  address={form.address}
                  lat={form.latitude}
                  lng={form.longitude}
                  onChange={(lat, lng, address) => { setF('latitude', lat); setF('longitude', lng); setF('address', address) }}
                />
              </div>
              <div>
                <label htmlFor="biz-phone" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}><span aria-hidden="true">☎</span> Telefon</label>
                <input id="biz-phone" className="biz-input" type="tel" autoComplete="tel" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+355 6X XXX XXXX" />
              </div>
              <div>
                <label htmlFor="biz-email" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}><span aria-hidden="true">✉️</span> Email</label>
                <input id="biz-email" className="biz-input" type="email" autoComplete="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="info@biznesi.al" />
              </div>
              <div>
                <label htmlFor="biz-website" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}><span aria-hidden="true">🌐</span> Website</label>
                <input id="biz-website" className="biz-input" type="url" value={form.website} onChange={e => setF('website', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label htmlFor="biz-city" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}><span aria-hidden="true">🏙️</span> Qyteti</label>
                <input id="biz-city" type="text" className="biz-input" autoComplete="address-level2" value={form.city} onChange={e => setF('city', e.target.value)} placeholder="p.sh. Tiranë" maxLength={80} />
              </div>
              <div>
                <label htmlFor="biz-hours" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}><span aria-hidden="true">🕐</span> Orari</label>
                <input id="biz-hours" type="text" className="biz-input" autoComplete="off" value={form.hours} onChange={e => setF('hours', e.target.value)} placeholder="Hënë–Premte 09:00–18:00" />
              </div>
              <div style={{ background: '#FFFBEA', borderRadius: 12, padding: 14, border: '1px solid #F5C84266' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7B5000', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}><span aria-hidden="true">⚖️</span> Të dhëna ligjore (B2C)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label htmlFor="biz-nipt" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>NIPT / Nr. TVSH (opsional)</label>
                    <input id="biz-nipt" type="text" className="biz-input" autoComplete="off" value={form.nipt} onChange={e => setF('nipt', e.target.value.toUpperCase())} placeholder="p.sh. K12345678A" maxLength={20} />
                    <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>Detyrueshëm nëse shet B2C sipas ligjit shqiptar</div>
                  </div>
                  <div>
                    <label htmlFor="biz-withdrawal" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>E drejta e tërheqjes (ditë)</label>
                    <input id="biz-withdrawal" className="biz-input" type="number" min={14} max={30} value={form.withdrawal_days} onChange={e => setF('withdrawal_days', parseInt(e.target.value) || 14)} />
                    <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>Direktiva EU 2011/83/EU — minimum 14 ditë</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button type="submit" className="step-btn" disabled={saving || !form.name.trim()} onClick={submit}>
                {saving ? <><span aria-hidden='true'>⏳</span> {uploading ? 'Duke ngarkuar...' : 'Duke krijuar...'}</> : <><span aria-hidden='true'>✓</span> Krijo Biznesin</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
