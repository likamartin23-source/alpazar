'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '../../../lib/supabase'
import { useAlpazar } from '../../../lib/context'
import { uploadImages, UploadProgress } from '../../../lib/uploadImages'
import { FreeTierBanner, PremiumUpsellModal, SellerPremiumUpsell } from '../../components/PremiumUpsell'

const MapPicker = dynamic(() => import('../../components/MapPicker').then(m => ({ default: m.MapPicker })), { ssr: false })


export default function NewListing() {
  const { cfgInt, profile } = useAlpazar()
  const maxImages  = profile?.is_premium ? cfgInt('max_images_premium', 10) : cfgInt('max_images_free', 5)
  const freeLimit  = cfgInt('free_listings_limit', 5)
  const [user, setUser] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'ALL',
    condition: '',
    category_id: '',
    city: '',
    images: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
    location_address: '',
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [myListingCount, setMyListingCount] = useState(0)
  const [priceSuggestion, setPriceSuggestion] = useState('')
  const [priceLoading, setPriceLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [showUpsell, setShowUpsell] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('is_active', true).then(({ count }) => setMyListingCount(count || 0))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { window.location.href = '/auth/login' }
    })
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data) setCategories(data)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => { imagePreviews.forEach(url => URL.revokeObjectURL(url)) }
  }, [imagePreviews])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function suggestPrice() {
    if (!form.title.trim()) { setPriceSuggestion('err:Shkruaj titullin para se të sugjerosh çmimin.'); return }
    setPriceLoading(true); setPriceSuggestion('')
    const catName = categories.find(c => c.id === form.category_id)?.name || ''
    const userMsg = `Duhet të vendos çmim për shpalljen time: "${form.title}"${catName ? ` (kategoria: ${catName})` : ''}${form.description ? `. Përshkrimi: ${form.description.slice(0, 200)}` : ''}. Cili është çmimi real i tregut shqiptar? Jep vetëm një range konkrete çmimi (p.sh. "15,000–25,000 L" ose "150–200 €").`
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userMsg }] }),
      })
      const json = await res.json()
      setPriceSuggestion(json.reply || 'err:Nuk mund të sugjeroj çmim tani.')
    } catch {
      setPriceSuggestion('err:Gabim në lidhje. Provo sërisht.')
    }
    setPriceLoading(false)
  }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const MAX_MB = 25
    const all = Array.from(e.target.files || [])
    const oversized = all.filter(f => f.size > MAX_MB * 1024 * 1024)
    if (oversized.length > 0) {
      setMsg(`err:Fotot duhet të jenë max ${MAX_MB}MB secila. (${oversized.map(f => f.name).join(', ')})`)
      e.target.value = ''
      return
    }
    const files = all.slice(0, maxImages)
    setImageFiles(files)
    setMsg('')
    // Revoke old object URLs to prevent memory leaks
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    const previews = files.map(f => URL.createObjectURL(f))
    setImagePreviews(previews)
  }

  async function submit() {
    if (!form.title.trim()) { setMsg('err:Titulli është i detyrueshëm!'); return }
    if (!form.category_id) { setMsg('err:Zgjidh kategorinë!'); return }
    if (!form.city) { setMsg('err:Shkruaj qytetin!'); return }

    setLoading(true); setMsg(''); setUploadProgress(null)
    try {
      let uploadedUrls: string[] = []
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
          uploadedUrls = urls
        } catch (uploadErr: any) {
          setMsg(`err:${uploadErr?.message ?? 'Gabim ngarkim fotosh.'}`)
          setLoading(false); setUploadProgress(null); return
        }
      }
      setUploadProgress(null)
      const { data, error } = await supabase.from('listings').insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency,
        condition: form.condition || null,
        category_id: form.category_id,
        city: form.city,
        images: uploadedUrls,
        is_active: true,
        latitude: form.latitude,
        longitude: form.longitude,
        location_address: form.location_address || null,
      }).select().single()

      if (error) { setMsg(`err:${error.message}`); setLoading(false); return }
      const bonusMsg = myListingCount === 0 ? ' +35 pikë gamifikimi (bonus fillestar)! 🎉' : ' +10 pikë gamifikimi! ⚡'
      setMsg(`ok:Shpallja u publikua me sukses!${bonusMsg}`)
      // IndexNow ping — instant Bing/Yandex indexing
      fetch('https://www.bing.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'alpazar.vercel.app',
          key: 'alpazar2025vercel',
          urlList: [`https://alpazar.vercel.app/listing/${data.id}`],
        }),
      }).catch(() => {})
      // Upsell pas shpalljes së 2-të — max 1 herë/sesion
      if (myListingCount === 1 && !sessionStorage.getItem('alpazar_upsell_shown')) {
        sessionStorage.setItem('alpazar_upsell_shown', '1')
        setShowUpsell(true)
        setTimeout(() => { window.location.href = `/listing/${data.id}` }, 4000)
      } else {
        setTimeout(() => { window.location.href = `/listing/${data.id}` }, 2000)
      }
    } catch (e: any) {
      setMsg(`err:${e.message}`)
    }
    setLoading(false)
  }

  const [mt, mm] = msg.split(/:(.+)/)

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
        .warn{background:#FFF8E1;color:#E65100;border:0.5px solid #FFB74D;}
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
        .img-prev{width:70px;height:70px;border-radius:8px;object-fit:cover;border:2px solid #F5C842;}
        .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
        .cat-btn{border:1.5px solid #ddd;border-radius:9px;padding:8px 4px;font-size:10px;font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px;}
        .cat-btn i{font-size:18px;color:#aaa;}
        .cat-btn.active{border-color:#F5C842;background:#FFFBEA;color:#111;}
        .cat-btn.active i{color:#E63312;}
        .submit-btn{width:100%;background:#E63312;color:#fff;border:none;border-radius:12px;padding:15px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .15s;}
        .submit-btn:disabled{opacity:.6;cursor:not-allowed;}
      `}</style>

      {/* Marketing: upsell kur arrin kufirin falas (5 shpallje) */}
      {myListingCount >= freeLimit && <PremiumUpsellModal trigger="limit" />}
      {showUpsell && <PremiumUpsellModal trigger="scroll" />}

      <div className="wrap">
        <div className="topbar">
          <button className="back" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" />
          </button>
          <span className="topbar-title">➕ Shto Shpallje</span>
        </div>

        <div className="body">
          {/* Marketing: banner kufiri falas */}
          <FreeTierBanner listingCount={myListingCount} freeLimit={freeLimit} />
          {msg && <div className={`msg-box ${mt}`}>{mm}</div>}
          {uploadProgress && (
            <div style={{ background:'#e8f4fd', border:'1px solid #90caf9', borderRadius:10, padding:'10px 14px', marginBottom:10, fontSize:13, color:'#1565c0', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:16 }}>⏳</span>
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
            <div className="card-title"><i className="ti ti-info-circle" />Informacioni bazë</div>

            <div className="field">
              <label>Titulli *</label>
              <input type="text" placeholder="p.sh. iPhone 13 Pro Max 256GB..." value={form.title} onChange={e => set('title', e.target.value)} maxLength={100} />
            </div>

            <div className="field">
              <label>Përshkrimi</label>
              <textarea placeholder="Përshkruaj artikullin — gjendje, veçori, arsye shitjeje..." value={form.description} onChange={e => set('description', e.target.value)} maxLength={2000} />
            </div>

            <div className="field">
              <label>Çmimi</label>
              <div className="price-row">
                <input type="number" placeholder="0" value={form.price} onChange={e => set('price', e.target.value)} min="0" />
                <select value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option value="ALL">L (Lekë)</option>
                  <option value="EUR">€ (Euro)</option>
                </select>
              </div>
              <p style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>Lër bosh për "Çmim me marrëveshje"</p>
              <button
                type="button"
                onClick={suggestPrice}
                disabled={priceLoading}
                style={{
                  marginTop: 8, background: '#111', color: '#F5C842', border: 'none',
                  borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700,
                  cursor: priceLoading ? 'not-allowed' : 'pointer', display: 'flex',
                  alignItems: 'center', gap: 5, opacity: priceLoading ? 0.7 : 1, fontFamily: 'inherit',
                }}
              >
                {priceLoading ? '⏳' : '🤖'} {priceLoading ? 'Duke menduar...' : 'Sugjero çmimin me Albi'}
              </button>
              {priceSuggestion && !priceSuggestion.startsWith('err:') && (
                <div style={{
                  marginTop: 8, background: '#EAF3DE', border: '0.5px solid #97C459',
                  borderRadius: 9, padding: '10px 13px', fontSize: 12, color: '#3B6D11', lineHeight: 1.6,
                }}>
                  💡 <strong>Albi sugjeron:</strong> {priceSuggestion}
                </div>
              )}
              {priceSuggestion?.startsWith('err:') && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#E63312' }}>{priceSuggestion.slice(4)}</div>
              )}
            </div>

            <div className="field">
              <label>Gjendja</label>
              <div className="cond-row">
                <button className={`cond-btn ${form.condition === 'i_ri' ? 'active' : ''}`} onClick={() => set('condition', 'i_ri')}>✨ I ri</button>
                <button className={`cond-btn ${form.condition === 'i_perdorur' ? 'active' : ''}`} onClick={() => set('condition', 'i_perdorur')}>🔄 I përdorur</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-category" />Kategoria *</div>
            <div className="cat-grid">
              {categories.map(c => (
                <button
                  key={c.id}
                  className={`cat-btn ${form.category_id === c.id ? 'active' : ''}`}
                  onClick={() => set('category_id', c.id)}
                >
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
            <div className="card-title"><i className="ti ti-photo" />Fotot (max {maxImages})</div>
            <label className="img-zone" onClick={() => document.getElementById('img-input')?.click()}>
              <input id="img-input" type="file" accept="image/*" multiple onChange={handleImages} />
              <i className="ti ti-cloud-upload" />
              <p>Kliko për të ngarkuar fotot</p>
              <p style={{ fontSize: 10, marginTop: 4, color: '#bbb' }}>JPG, PNG, WebP · max 5MB secila</p>
            </label>
            {imagePreviews.length > 0 && (
              <div className="img-previews">
                {imagePreviews.map((src, i) => (
                  <img key={i} src={src} className="img-prev" alt="" />
                ))}
              </div>
            )}
          </div>

          <button className="submit-btn" onClick={submit} disabled={loading}>
            {uploadProgress ? `⏳ Foto ${uploadProgress.done}/${uploadProgress.total}...` : loading ? '⏳ Duke publikuar...' : '🚀 Publiko shpalljen falas'}
          </button>
        </div>
      </div>
    </>
  )
}
