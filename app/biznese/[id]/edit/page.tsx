'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { MapPicker } from '../../../components/MapPicker'

export default function BiznesEditPage({ params }: { params: { id: string } }) {
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg]           = useState('')
  const [userId, setUserId]     = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', description: '', address: '', phone: '', website: '',
    hours: '', email: '', city: '', nipt: '', withdrawal_days: 14,
    latitude: null as number | null, longitude: null as number | null,
    logo_url: '', cover_url: '',
  })
  const [logoFile, setLogoFile]   = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview]   = useState('')
  const [coverPreview, setCoverPreview] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUserId(session.user.id)

      const { data: b } = await supabase.from('businesses').select('*').eq('id', params.id).single()
      if (!b) { window.location.href = '/profile'; return }
      if (b.owner_id !== session.user.id) { window.location.href = `/biznese/${params.id}`; return }

      setForm({
        name: b.name || '',
        description: b.description || '',
        address: b.address || '',
        phone: b.phone || '',
        website: b.website || '',
        hours: b.hours?.schedule || '',
        email: b.email || '',
        city: b.city || '',
        nipt: b.nipt || '',
        withdrawal_days: b.withdrawal_days ?? 14,
        latitude: b.latitude || null,
        longitude: b.longitude || null,
        logo_url: b.logo_url || '',
        cover_url: b.cover_url || '',
      })
      if (b.logo_url) setLogoPreview(b.logo_url)
      if (b.cover_url) setCoverPreview(b.cover_url)
      setLoading(false)
    })
  }, [params.id])

  function setF(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

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

  async function uploadFile(file: File, path: string, maxW: number, bucket: string): Promise<string> {
    const blob = await compressImage(file, maxW)
    const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg', upsert: true })
    if (error) throw error
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  async function save() {
    if (!form.name.trim()) { setMsg('err:Emri i biznesit është i detyrueshëm!'); return }
    if (!userId) return
    setSaving(true); setMsg(''); setUploading(true)

    let logoUrl = form.logo_url
    let coverUrl = form.cover_url
    try {
      if (logoFile) logoUrl = await uploadFile(logoFile, `${userId}/biz-logo.jpg`, 400, 'avatars')
      if (coverFile) coverUrl = await uploadFile(coverFile, `${userId}/biz-cover.jpg`, 1920, 'covers')
    } catch (e: any) {
      setMsg(`err:Gabim gjatë ngarkimit të fotove: ${e.message}`)
      setSaving(false); setUploading(false); return
    }
    setUploading(false)

    const { error } = await supabase.from('businesses').update({
      name: form.name.trim(),
      description: form.description || null,
      address: form.address || null,
      latitude: form.latitude,
      longitude: form.longitude,
      phone: form.phone || null,
      website: form.website || null,
      hours: form.hours ? { schedule: form.hours } : null,
      email: form.email || null,
      city: form.city || null,
      nipt: form.nipt || null,
      withdrawal_days: form.withdrawal_days || 14,
      logo_url: logoUrl || null,
      cover_url: coverUrl || null,
    }).eq('id', params.id).eq('owner_id', userId)

    setSaving(false)
    if (error) { setMsg(`err:${error.message}`); return }
    // Keep profile shop_name in sync
    await supabase.from('profiles').update({ shop_name: form.name.trim() }).eq('id', userId)
    setMsg('ok:Ndryshimet u ruajtën!')
    setTimeout(() => window.location.href = `/biznese/${params.id}`, 1200)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFBEA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #F5C842', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh', paddingBottom: 80, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{`
        .biz-input{width:100%;border:1px solid #e5e5e5;border-radius:10px;padding:11px 13px;font-size:13px;font-family:inherit;background:#fff;outline:none;box-sizing:border-box;}
        .biz-input:focus{border-color:#E63312;}
        .section-title{font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;margin-top:4px;}
        .save-btn{width:100%;background:#E63312;color:#fff;border:none;border-radius:13px;padding:15px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;}
        .save-btn:disabled{opacity:.5;cursor:not-allowed;}
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#F5C842,#f0bc30)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => window.location.href = `/biznese/${params.id}`} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111', flex: 1 }}>✏️ Edito Biznesin</span>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msg && (
          <div role="alert" style={{ background: msg.startsWith('err:') ? '#FFF0EE' : '#F0FFF4', border: `1px solid ${msg.startsWith('err:') ? '#F09595' : '#86efac'}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: msg.startsWith('err:') ? '#E63312' : '#166534', fontWeight: 600 }}>
            {msg.replace(/^(err:|ok:)/, '')}
          </div>
        )}

        {/* Cover + Logo */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/6', borderRadius: 12, overflow: 'hidden', marginBottom: 28, background: coverPreview ? 'transparent' : 'linear-gradient(135deg,#F5C842,#E63312)', cursor: 'pointer' }}>
          {coverPreview && <img src={coverPreview} alt="Foto kopertinë" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <label style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: coverPreview ? 'rgba(0,0,0,.3)' : 'none' }}>
            <span style={{ background: 'rgba(0,0,0,.5)', color: '#fff', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700 }}>📷 {coverPreview ? 'Ndrysho kopertinën' : 'Shto kopertinën'}</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) } }} />
          </label>
          <div style={{ position: 'absolute', bottom: -24, left: 16 }}>
            <div style={{ position: 'relative', width: 48, height: 48 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', border: '3px solid #fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
                {logoPreview ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
              </div>
              <label style={{ position: 'absolute', bottom: -2, right: -2, background: '#E63312', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, cursor: 'pointer', border: '2px solid #fff' }}>
                📷
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) } }} />
              </label>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div>
          <div className="section-title">Informacion bazë</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label htmlFor="biz-name" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>Emri i biznesit *</label>
              <input id="biz-name" type="text" className="biz-input" autoComplete="organization" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="p.sh. Elektro Servisi Tirana" maxLength={80} required />
            </div>
            <div>
              <label htmlFor="biz-description" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>Përshkrim</label>
              <textarea id="biz-description" className="biz-input" value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Çfarë bëni? Si mund t'ju ndihmojmë..." maxLength={500} style={{ resize: 'none', minHeight: 80 }} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <div className="section-title">Kontakti</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label htmlFor="biz-phone" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>☎ Telefon</label>
              <input id="biz-phone" className="biz-input" type="tel" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+355 6X XXX XXXX" />
            </div>
            <div>
              <label htmlFor="biz-email" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>✉️ Email</label>
              <input id="biz-email" className="biz-input" type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="info@biznesi.al" />
            </div>
            <div>
              <label htmlFor="biz-website" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>🌐 Website</label>
              <input id="biz-website" className="biz-input" type="url" value={form.website} onChange={e => setF('website', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="section-title">Vendndodhja</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label htmlFor="biz-city" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>🏙️ Qyteti</label>
              <input id="biz-city" type="text" className="biz-input" autoComplete="address-level2" value={form.city} onChange={e => setF('city', e.target.value)} placeholder="p.sh. Tiranë" maxLength={80} />
            </div>
            <div>
              <label htmlFor="biz-address" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>📍 Adresa (harta OSM)</label>
              <MapPicker
                address={form.address}
                lat={form.latitude}
                lng={form.longitude}
                onChange={(lat, lng, address) => { setF('latitude', lat); setF('longitude', lng); setF('address', address) }}
              />
            </div>
          </div>
        </div>

        {/* Hours */}
        <div>
          <label htmlFor="biz-hours" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>🕐 Orari</label>
          <input id="biz-hours" type="text" className="biz-input" autoComplete="off" value={form.hours} onChange={e => setF('hours', e.target.value)} placeholder="Hënë–Premte 09:00–18:00" />
        </div>

        {/* Legal — B2C */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e5e5e5' }}>
          <div className="section-title" style={{ marginBottom: 12 }}>⚖️ Të dhëna ligjore (B2C)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label htmlFor="biz-nipt" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>NIPT / Nr. TVSH</label>
              <input id="biz-nipt" type="text" className="biz-input" autoComplete="off" value={form.nipt} onChange={e => setF('nipt', e.target.value.toUpperCase())} placeholder="p.sh. K12345678A" maxLength={20} />
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Numri i Identifikimit të Personit të Tatueshëm — detyrueshëm nëse shet B2C</div>
            </div>
            <div>
              <label htmlFor="biz-withdrawal" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>📅 E drejta e tërheqjes (ditë)</label>
              <input id="biz-withdrawal" className="biz-input" type="number" min={14} max={30} value={form.withdrawal_days} onChange={e => setF('withdrawal_days', parseInt(e.target.value) || 14)} />
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Direktiva EU 2011/83/EU — minimum 14 ditë për blerjet B2C online</div>
            </div>
          </div>
        </div>

        <button className="save-btn" disabled={saving || !form.name.trim()} onClick={save} style={{ marginTop: 8 }}>
          {saving ? (uploading ? '⏳ Duke ngarkuar...' : '⏳ Duke ruajtur...') : '✓ Ruaj Ndryshimet'}
        </button>
      </div>
    </div>
  )
}
