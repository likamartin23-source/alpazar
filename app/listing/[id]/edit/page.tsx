'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '../../../../lib/supabase'

const MapPicker = dynamic(() => import('../../../components/MapPicker').then(m => ({ default: m.MapPicker })), { ssr: false })


export default function EditListing({ params }: { params: { id: string } }) {
  const [user, setUser]       = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [msg, setMsg]         = useState('')
  const [form, setForm]       = useState({
    title: '', description: '', price: '', currency: 'ALL',
    condition: '', category_id: '', city: '', images: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
    location_address: '',
  })
  const [imageFiles, setImageFiles]     = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      if (!mounted) return
      setUser(session.user)

      const [{ data: listing }, { data: cats }] = await Promise.all([
        supabase.from('listings').select('*').eq('id', params.id).single(),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      ])

      if (!mounted) return

      if (!listing || listing.user_id !== session.user.id) {
        window.location.href = `/listing/${params.id}`
        return
      }

      if (cats) setCategories(cats)
      setExistingImages(listing.images || [])
      setForm({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price != null ? String(listing.price) : '',
        currency: listing.currency || 'ALL',
        condition: listing.condition || '',
        category_id: listing.category_id || '',
        city: listing.city || '',
        images: listing.images || [],
        latitude: listing.latitude ?? null,
        longitude: listing.longitude ?? null,
        location_address: listing.location_address || '',
      })
      setPageLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.href = '/auth/login'
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [params.id])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const MAX_MB = 5
    const all = Array.from(e.target.files || [])
    const oversized = all.filter(f => f.size > MAX_MB * 1024 * 1024)
    if (oversized.length > 0) {
      setMsg(`err:Fotot duhet të jenë max ${MAX_MB}MB secila.`)
      e.target.value = ''
      return
    }
    const files = all.slice(0, 5)
    setImageFiles(files)
    setMsg('')
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    setImagePreviews(files.map(f => URL.createObjectURL(f)))
  }

  function removeExistingImage(url: string) {
    setExistingImages(imgs => imgs.filter(i => i !== url))
  }

  async function uploadImages(): Promise<string[]> {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession()
    if (sessionErr || !session) { setMsg('err:Sesioni ka skaduar. Hyr sërisht.'); return [] }

    const urls: string[] = []
    const firstErr: string[] = []
    for (const file of imageFiles) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error } = await supabase.storage.from('listing-images').upload(path, file, {
        upsert: false,
        contentType: file.type || 'image/jpeg',
      })
      if (error) { firstErr.push(error.message); continue }
      const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(path)
      urls.push(publicUrl)
    }
    if (urls.length === 0 && firstErr.length > 0) {
      setMsg(`err:Gabim ngarkim: ${firstErr[0]}`)
    }
    return urls
  }

  async function submit() {
    if (!form.title.trim()) { setMsg('err:Titulli është i detyrueshëm!'); return }
    if (!form.category_id)  { setMsg('err:Zgjidh kategorinë!'); return }
    if (!form.city)         { setMsg('err:Shkruaj qytetin!'); return }

    setLoading(true); setMsg('')
    try {
      const newUrls = imageFiles.length ? await uploadImages() : []
      const allImages = [...existingImages, ...newUrls]

      const { error } = await supabase.from('listings').update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency,
        condition: form.condition || null,
        category_id: form.category_id,
        city: form.city,
        images: allImages,
        latitude: form.latitude,
        longitude: form.longitude,
        location_address: form.location_address || null,
      }).eq('id', params.id).eq('user_id', user.id)

      if (error) { setMsg(`err:${error.message}`); setLoading(false); return }
      setMsg('ok:Shpallja u përditësua me sukses!')
      setTimeout(() => { window.location.href = `/listing/${params.id}` }, 900)
    } catch (e: any) {
      setMsg(`err:${e.message}`)
    }
    setLoading(false)
  }

  const [mt, mm] = msg.split(/:(.+)/)

  if (pageLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FFFBEA' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{ width: 28, height: 28, border: '3px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:100px;}
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;}
        .body{padding:14px;}
        .msg-box{border-radius:9px;padding:10px 14px;margin-bottom:12px;font-size:12px;font-weight:600;}
        .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
        .err{background:#FFF0EE;color:#E63312;border:0.5px solid #F09595;}
        .card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;border:0.5px solid #eee;}
        .card-title{font-size:13px;font-weight:700;color:#111;margin-bottom:12px;display:flex;align-items:center;gap:6px;}
        .card-title i{font-size:16px;color:#E63312;}
        label{font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px;}
        .field{margin-bottom:12px;}
        input[type=text],input[type=number],textarea,select{width:100%;border:1.5px solid #ddd;border-radius:9px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;transition:border .15s;background:#fff;color:#111;}
        input:focus,textarea:focus,select:focus{border-color:#F5C842;}
        textarea{min-height:90px;resize:vertical;}
        .price-row{display:flex;gap:8px;}
        .price-row input{flex:1;}
        .price-row select{width:90px;flex-shrink:0;}
        .cond-row{display:flex;gap:8px;}
        .cond-btn{flex:1;border:1.5px solid #ddd;border-radius:9px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;}
        .cond-btn.active{border-color:#E63312;background:#FFF0EE;color:#E63312;}
        .img-zone{border:2px dashed #e0b030;border-radius:10px;padding:20px;text-align:center;cursor:pointer;background:#FFFBEA;}
        .img-zone input{display:none;}
        .img-zone i{font-size:32px;color:#e0b030;display:block;margin-bottom:8px;}
        .img-zone p{font-size:12px;color:#888;}
        .img-previews{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
        .img-prev-wrap{position:relative;}
        .img-prev{width:70px;height:70px;border-radius:8px;object-fit:cover;border:2px solid #F5C842;}
        .img-remove{position:absolute;top:-5px;right:-5px;width:18px;height:18px;background:#E63312;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;line-height:1;}
        .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
        .cat-btn{border:1.5px solid #ddd;border-radius:9px;padding:8px 4px;font-size:10px;font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;}
        .cat-btn i{font-size:18px;color:#aaa;}
        .cat-btn.active{border-color:#F5C842;background:#FFFBEA;color:#111;}
        .cat-btn.active i{color:#E63312;}
        .submit-btn{width:100%;background:#E63312;color:#fff;border:none;border-radius:12px;padding:15px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .15s;}
        .submit-btn:disabled{opacity:.6;cursor:not-allowed;}
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <button className="back" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" />
          </button>
          <span className="topbar-title">✏️ Ndrysho Shpalljen</span>
        </div>

        <div className="body">
          {msg && <div className={`msg-box ${mt}`}>{mm}</div>}

          <div className="card">
            <div className="card-title"><i className="ti ti-info-circle" />Informacioni bazë</div>

            <div className="field">
              <label>Titulli *</label>
              <input type="text" placeholder="p.sh. iPhone 13 Pro Max 256GB..." value={form.title}
                onChange={e => set('title', e.target.value)} maxLength={100} />
            </div>

            <div className="field">
              <label>Përshkrimi</label>
              <textarea placeholder="Përshkruaj artikullin..." value={form.description}
                onChange={e => set('description', e.target.value)} maxLength={2000} />
            </div>

            <div className="field">
              <label>Çmimi</label>
              <div className="price-row">
                <input type="number" placeholder="0" value={form.price}
                  onChange={e => set('price', e.target.value)} min="0" />
                <select value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option value="ALL">L (Lekë)</option>
                  <option value="EUR">€ (Euro)</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Gjendja</label>
              <div className="cond-row">
                <button className={`cond-btn ${form.condition === 'i_ri' ? 'active' : ''}`}
                  onClick={() => set('condition', 'i_ri')}>✨ I ri</button>
                <button className={`cond-btn ${form.condition === 'i_perdorur' ? 'active' : ''}`}
                  onClick={() => set('condition', 'i_perdorur')}>🔄 I përdorur</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-category" />Kategoria *</div>
            <div className="cat-grid">
              {categories.map(c => (
                <button key={c.id}
                  className={`cat-btn ${form.category_id === c.id ? 'active' : ''}`}
                  onClick={() => set('category_id', c.id)}>
                  <i className={`ti ti-${c.icon}`} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-map-pin" />Vendndodhja *</div>
            <div className="field">
              <label>Qyteti *</label>
              <input
                type="text"
                placeholder="p.sh. Tiranë, Durrës, Vlorë..."
                value={form.city}
                onChange={e => set('city', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Adresa e saktë <span style={{ fontWeight: 400, color: '#aaa' }}>(opsional — mund të vendoset me GPS)</span></label>
              <MapPicker
                lat={form.latitude}
                lng={form.longitude}
                address={form.location_address}
                onChange={(lat, lng, address) => setForm(f => ({ ...f, latitude: lat, longitude: lng, location_address: address }))}
                onCityChange={city => { if (!form.city) setForm(f => ({ ...f, city })) }}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-photo" />Fotot</div>

            {existingImages.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Fotot aktuale (kliko ✕ për të hequr):</p>
                <div className="img-previews">
                  {existingImages.map((url, i) => (
                    <div key={i} className="img-prev-wrap">
                      <img src={url} className="img-prev" alt="" />
                      <button className="img-remove" onClick={() => removeExistingImage(url)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="img-zone" onClick={() => document.getElementById('img-input')?.click()}>
              <input id="img-input" type="file" accept="image/*" multiple onChange={handleImages} />
              <i className="ti ti-cloud-upload" />
              <p>Kliko për të shtuar foto të reja</p>
              <p style={{ fontSize: 10, marginTop: 4, color: '#bbb' }}>JPG, PNG, WebP · max 5MB secila</p>
            </label>

            {imagePreviews.length > 0 && (
              <div className="img-previews" style={{ marginTop: 10 }}>
                {imagePreviews.map((src, i) => (
                  <img key={i} src={src} className="img-prev" alt="" />
                ))}
              </div>
            )}
          </div>

          <button className="submit-btn" onClick={submit} disabled={loading}>
            {loading ? '⏳ Duke ruajtur...' : '💾 Ruaj Ndryshimet'}
          </button>
        </div>
      </div>
    </>
  )
}
