'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import nextDynamic from 'next/dynamic'
import { supabase } from '../../../../lib/supabase'
import { uploadImages, UploadProgress } from '../../../../lib/uploadImages'
import { useVideos } from '../../new/useVideos'

const MapPicker = nextDynamic(() => import('../../../components/MapPicker').then(m => ({ default: m.MapPicker })), { ssr: false })


export default function EditListing({ params }: { params: { id: string } }) {
  const [existingVideos, setExistingVideos] = useState<any[]>([])
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
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const vid = useVideos(setMsg, setIsDirty, existingVideos.length)
  const maxImages: number = vid.maxImages

  useEffect(() => {
    return () => { imagePreviews.forEach(url => URL.revokeObjectURL(url)) }
  }, [imagePreviews])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

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
    setExistingVideos(Array.isArray(listing.videos) ? listing.videos : [])
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

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); setIsDirty(true) }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const MAX_MB = 10
    const all = Array.from(e.target.files || [])
    const oversized = all.filter(f => f.size > MAX_MB * 1024 * 1024)
    if (oversized.length > 0) {
      setMsg(`err:Fotot duhet të jenë max ${MAX_MB}MB secila.`)
      e.target.value = ''
      return
    }
    const files = all.slice(0, maxImages)
    setImageFiles(files)
    setMsg('')
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    setImagePreviews(files.map(f => URL.createObjectURL(f)))
  }

  function removeExistingImage(url: string) {
    setExistingImages(imgs => imgs.filter(i => i !== url))
  }

  function removeExistingVideo(i: number) {
    setExistingVideos(v => v.filter((_, idx) => idx !== i))
    setIsDirty(true)
  }

  async function submit() {
    if (!form.title.trim()) { setMsg('err:Titulli është i detyrueshëm!'); return }
    if (!form.category_id)  { setMsg('err:Zgjidh kategorinë!'); return }
    if (!form.city)         { setMsg('err:Shkruaj qytetin!'); return }

    setLoading(true); setMsg(''); setUploadProgress(null)
    try {
      let newUrls: string[] = []
      if (imageFiles.length > 0) {
        try {
          const { urls, errors } = await uploadImages(imageFiles, setUploadProgress)
          if (errors.length > 0 && urls.length === 0) {
            setMsg(`err:Ngarkim dështoi: ${errors[0]}`)
            setLoading(false); setUploadProgress(null); return
          }
          if (errors.length > 0) {
            setMsg(`warn:${urls.length} foto u ngarkuan. ${errors.length} dështuan: ${errors[0]}`)
          }
          newUrls = urls
        } catch (uploadErr: any) {
          setMsg(`err:${uploadErr?.message ?? 'Gabim ngarkim fotosh.'}`)
          setLoading(false); setUploadProgress(null); return
        }
      }
      setUploadProgress(null)
      const allImages = [...existingImages, ...newUrls]

      let allVideos: any[] = existingVideos
      if (vid.count > 0) {
        const rv = await vid.uploadAll()
        if (rv.error) { setMsg(`err:Video: ${rv.error}`); setLoading(false); return }
        allVideos = [...existingVideos, ...rv.videos]
      }

      const { error } = await supabase.from('listings').update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency,
        condition: form.condition || null,
        category_id: form.category_id,
        city: form.city,
        images: allImages,
        videos: allVideos,
        video_poster: allImages[0] || null,
        latitude: form.latitude,
        longitude: form.longitude,
        location_address: form.location_address || null,
      }).eq('id', params.id).eq('user_id', user.id)

      if (error) { setMsg(`err:${error.message}`); setLoading(false); return }
      setIsDirty(false)
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
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg);}}` }} />
      <div style={{ width: 28, height: 28, border: '3px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:100px;}
        .topbar{background:linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%);padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;}
        .body{padding:14px;}
        .msg-box{border-radius:12px;padding:10px 14px;margin-bottom:12px;font-size:12px;font-weight:600;}
        .ok{background:#EAF3DE;color:#3B6D11;border:0.5px solid #97C459;}
        .err{background:#FFF0EE;color:#E63312;border:0.5px solid #F09595;}
        .warn{background:#FFF8E1;color:#E65100;border:0.5px solid #FFB74D;}
        .card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;border:0.5px solid #eee;}
        .card-title{font-size:13px;font-weight:700;color:#111;margin-bottom:12px;display:flex;align-items:center;gap:6px;}
        .card-title i{font-size:16px;color:#E63312;}
        label{font-size:11px;font-weight:600;color:#555;display:block;margin-bottom:4px;}
        .field{margin-bottom:12px;}
        input[type=text],input[type=number],textarea,select{width:100%;border:1.5px solid #e0e0e0;border-radius:12px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;transition:border .15s;background:#fff;color:#111;}
        input:focus,textarea:focus,select:focus{border-color:#111;box-shadow:0 4px 16px -4px rgba(0,0,0,.2);}
        textarea{min-height:90px;resize:vertical;}
        .price-row{display:flex;gap:8px;}
        .price-row input{flex:1;}
        .price-row select{width:90px;flex-shrink:0;}
        .cond-row{display:flex;gap:8px;}
        .cond-btn{flex:1;border:1.5px solid #e0e0e0;border-radius:12px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;}
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
        .cat-btn{border:1.5px solid #e0e0e0;border-radius:12px;padding:8px 4px;font-size:10px;font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;}
        .cat-btn i{font-size:18px;color:#aaa;}
        .cat-btn.active{border-color:#F5C842;background:#FFFBEA;color:#111;}
        .cat-btn.active i{color:#E63312;}
        .submit-btn{width:100%;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:15px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px -3px rgba(230,51,18,.45);transition:transform .15s ease,box-shadow .15s ease;} .submit-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 7px 20px -4px rgba(230,51,18,.55);}
        .submit-btn:disabled{opacity:.6;cursor:not-allowed;}
      ` }} />

      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu mbrapa" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <h1 className="topbar-title" style={{ margin: 0 }}><span aria-hidden="true">✏️</span> Ndrysho Shpalljen</h1>
        </div>

        <div className="body">
          {msg && <div className={`msg-box ${mt}`} role="alert">{mm}</div>}
          {uploadProgress && (
            <div style={{ background:'#e8f4fd', border:'1px solid #90caf9', borderRadius:10, padding:'10px 14px', marginBottom:10, fontSize:13, color:'#1565c0', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:16 }} aria-hidden="true">⏳</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600 }}>Duke ngarkuar foto... {uploadProgress.done}/{uploadProgress.total}</div>
                {uploadProgress.currentName && <div style={{ color:'#1976d2', marginTop:2 }}>{uploadProgress.currentName}</div>}
                <div style={{ background:'#bbdefb', borderRadius:4, height:6, marginTop:6, overflow:'hidden' }}>
                  <div style={{ background:'#1976d2', height:'100%', width:`${Math.round(uploadProgress.done / uploadProgress.total * 100)}%`, transition:'width .3s' }} />
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-title"><i className="ti ti-info-circle" aria-hidden="true" />Informacioni bazë</div>

            <div className="field">
              <label htmlFor="listing-title">Titulli *</label>
              <input id="listing-title" type="text" placeholder="p.sh. iPhone 13 Pro Max 256GB..." value={form.title}
                onChange={e => set('title', e.target.value)} maxLength={100} required />
              <div style={{ textAlign: 'right', fontSize: 10, color: form.title.length > 85 ? '#E63312' : '#aaa', marginTop: 2 }}>{form.title.length}/100</div>
            </div>

            <div className="field">
              <label htmlFor="listing-description">Përshkrimi</label>
              <textarea id="listing-description" placeholder="Përshkruaj artikullin..." value={form.description}
                onChange={e => set('description', e.target.value)} maxLength={2000} />
              <div style={{ textAlign: 'right', fontSize: 10, color: form.description.length > 1800 ? '#E63312' : '#aaa', marginTop: 2 }}>{form.description.length}/2000</div>
            </div>

            <div className="field">
              <label htmlFor="listing-price">Çmimi</label>
              <div className="price-row">
                <input id="listing-price" type="number" placeholder="0" value={form.price}
                  onChange={e => set('price', e.target.value)} min="0" />
                <select aria-label="Monedha" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option value="ALL">L (Lekë)</option>
                  <option value="EUR">€ (Euro)</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Gjendja</label>
              <div className="cond-row" aria-label="Gjendja">
                <button type="button" aria-pressed={form.condition === 'i_ri'} className={`cond-btn ${form.condition === 'i_ri' ? 'active' : ''}`}
                  onClick={() => set('condition', 'i_ri')}><span aria-hidden="true">✨</span> I ri</button>
                <button type="button" aria-pressed={form.condition === 'i_perdorur'} className={`cond-btn ${form.condition === 'i_perdorur' ? 'active' : ''}`}
                  onClick={() => set('condition', 'i_perdorur')}><span aria-hidden="true">🔄</span> I përdorur</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-category" aria-hidden="true" />Kategoria *</div>
            <div className="cat-grid">
              {categories.map(c => (
                <button key={c.id}
                  type="button"
                  aria-pressed={form.category_id === c.id}
                  className={`cat-btn ${form.category_id === c.id ? 'active' : ''}`}
                  onClick={() => set('category_id', c.id)}>
                  <i className={`ti ti-${c.icon}`} aria-hidden="true" />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-map-pin" aria-hidden="true" />Vendndodhja *</div>
            <div className="field">
              <label htmlFor="listing-city">Qyteti *</label>
              <input
                id="listing-city"
                type="text"
                placeholder="p.sh. Tiranë, Durrës, Vlorë..."
                autoComplete="address-level2"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                required
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
            <div className="card-title"><i className="ti ti-photo" aria-hidden="true" />Fotot (max {maxImages})</div>

            {existingImages.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Fotot aktuale (kliko <span aria-hidden="true">✕</span> për të hequr):</p>
                <div className="img-previews">
                  {existingImages.map((url, i) => (
                    <div key={i} className="img-prev-wrap">
                      <img src={url} className="img-prev" alt={`Foto ${i + 1}`} loading="lazy" />
                      <button className="img-remove" aria-label={`Hiq foton ${i + 1}`} type="button" onClick={() => removeExistingImage(url)}>✕</button>
                      {i === 0 && (
                        <span style={{ position: 'absolute', top: 4, left: 4, background: '#F5C842', color: '#111', fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4, lineHeight: 1.4, pointerEvents: 'none' }}>
                          Kryesore
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="img-zone" onClick={() => document.getElementById('img-input')?.click()}>
              <input id="img-input" type="file" accept="image/*" multiple onChange={handleImages} />
              <i className="ti ti-cloud-upload" aria-hidden="true" />
              <p>Kliko për të shtuar foto të reja</p>
              <p style={{ fontSize: 10, marginTop: 4, color: '#bbb' }}>JPG, PNG, WebP · max 10MB secila</p>
            </label>

            {imagePreviews.length > 0 && (
              <div className="img-previews" style={{ marginTop: 10 }}>
                {imagePreviews.map((src, i) => {
                  const isFirst = i === 0 && existingImages.length === 0
                  return (
                    <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={src} className="img-prev" alt={`Foto e re ${i + 1}`} loading="lazy" />
                      {isFirst && (
                        <span style={{ position: 'absolute', top: 4, left: 4, background: '#F5C842', color: '#111', fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4, lineHeight: 1.4, pointerEvents: 'none' }}>
                          Kryesore
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">
              <i className="ti ti-video" aria-hidden="true" />
              Videot ({existingVideos.length + vid.count}/{vid.maxVideos < 0 ? '∞' : vid.maxVideos})
            </div>

            {existingVideos.length > 0 && (
              <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
                {existingVideos.map((v: any, i: number) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <video src={v?.url || v} controls playsInline preload="metadata"
                      style={{ width: '100%', maxHeight: 200, borderRadius: 12, background: '#000', display: 'block' }} />
                    <button type="button" aria-label={`Hiq videon ${i + 1}`} onClick={() => removeExistingVideo(i)}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.62)', color: '#fff', border: 'none', borderRadius: 999, width: 30, height: 30, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(vid.maxVideos < 0 || existingVideos.length + vid.count < vid.maxVideos) ? (
              <label className="img-zone" onClick={() => document.getElementById('vid-input')?.click()}>
                <input id="vid-input" type="file" accept="video/*" multiple onChange={vid.add} />
                <i className="ti ti-video" aria-hidden="true" />
                <p>Kliko për të shtuar video</p>
                <p style={{ fontSize: 10, marginTop: 4, color: '#bbb' }}>
                  Deri në {vid.maxMin} minuta secila · max {vid.maxVideos < 0 ? '∞' : vid.maxVideos} video
                </p>
              </label>
            ) : (
              <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, padding: '10px 12px', fontSize: 11.5, color: '#856404' }}>
                Ke arritur kufirin prej {vid.maxVideos} videosh.
              </div>
            )}

            {vid.count > 0 && (
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                {vid.items.map((it: any, i: number) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <video src={it.preview} controls playsInline preload="metadata"
                      style={{ width: '100%', maxHeight: 200, borderRadius: 12, background: '#000', display: 'block' }} />
                    <button type="button" aria-label={`Hiq videon e re ${i + 1}`} onClick={() => vid.remove(i)}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.62)', color: '#fff', border: 'none', borderRadius: 999, width: 30, height: 30, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {vid.uploading && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#1565c0' }}>Duke ngarkuar videot… {vid.pct}%</div>
            )}
          </div>

          <button type="submit" className="submit-btn" onClick={submit} disabled={loading}>
            {uploadProgress ? <><span aria-hidden='true'>⏳</span> {`Foto ${uploadProgress.done}/${uploadProgress.total}...`}</> : loading ? <><span aria-hidden='true'>⏳</span> Duke ruajtur...</> : <><span aria-hidden='true'>💾</span> Ruaj Ndryshimet</>}
          </button>
        </div>
      </div>
    </>
  )
}
