'use client'

import { FreeTierBanner } from '../../components/PremiumUpsell'

export function ListingTop({ p }: any) {
  const { form, set, setForm, msg, mt, mm, uploadProgress, videoPreview, videoUploading, videoPct, handleVideo, removeVideo, handleImages, imagePreviews, maxImages, categories, catLoading, catSuggested, suggestCategory, priceLoading, priceSuggestion, suggestPrice, descLoading, generateDescription, loading, submit, draftRestored, setDraftRestored, myListingCount, freeLimit, showUpsell } = p
  return (
    <>
          {/* Marketing: banner kufiri falas */}
          <FreeTierBanner listingCount={myListingCount} freeLimit={freeLimit} />
          {draftRestored && (
            <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:10, padding:'8px 14px', marginBottom:10, fontSize:12, color:'#166534', display:'flex', alignItems:'center', gap:8 }}>
              <span aria-hidden="true">💾</span> Draft-i u rikthye automatikisht.
              <button type="button" onClick={() => { localStorage.removeItem('alpazar_listing_draft'); setForm({ title:'', description:'', price:'', currency:'ALL', condition:'', category_id:'', city:'', images:[], latitude:null, longitude:null, location_address:'' }); setDraftRestored(false) }} style={{ marginLeft:'auto', background:'none', border:'none', color:'#166534', cursor:'pointer', fontSize:11, textDecoration:'underline', fontFamily:'inherit' }}>Fshi draft-in</button>
            </div>
          )}
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
              <input id="listing-title" type="text" placeholder="p.sh. iPhone 13 Pro Max 256GB..." value={form.title} onChange={e => set('title', e.target.value)} maxLength={100} required />
              <div style={{ textAlign: 'right', fontSize: 10, color: form.title.length > 85 ? '#E63312' : '#aaa', marginTop: 2 }}>{form.title.length}/100</div>
            </div>

            <div className="field">
              <label htmlFor="listing-description">Përshkrimi</label>
              <textarea id="listing-description" placeholder="Përshkruaj artikullin — gjendje, veçori, arsye shitjeje..." value={form.description} onChange={e => set('description', e.target.value)} maxLength={2000} />
              <div style={{ textAlign: 'right', fontSize: 10, color: form.description.length > 1800 ? '#E63312' : '#aaa', marginTop: 2 }}>{form.description.length}/2000</div>
              <button
                type="button"
                onClick={generateDescription}
                disabled={descLoading}
                style={{
                  marginTop: 6, background: '#111', color: '#F5C842', border: 'none',
                  borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700,
                  cursor: descLoading ? 'not-allowed' : 'pointer', display: 'flex',
                  alignItems: 'center', gap: 5, opacity: descLoading ? 0.7 : 1, fontFamily: 'inherit',
                }}
              >
                {descLoading ? <span aria-hidden='true'>⏳</span> : <span aria-hidden='true'>🤖</span>} {descLoading ? 'Duke gjeneruar...' : 'Gjenero përshkrim me Albi'}
              </button>
            </div>

            <div className="field">
              <label htmlFor="listing-price">Çmimi</label>
              <div className="price-row">
                <input id="listing-price" type="number" placeholder="0" value={form.price} onChange={e => set('price', e.target.value)} min="0" />
                <select aria-label="Monedha" value={form.currency} onChange={e => set('currency', e.target.value)}>
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
                {priceLoading ? <span aria-hidden='true'>⏳</span> : <span aria-hidden='true'>🤖</span>} {priceLoading ? 'Duke menduar...' : 'Sugjero çmimin me Albi'}
              </button>
              {priceSuggestion && !priceSuggestion.startsWith('err:') && (
                <div style={{
                  marginTop: 8, background: '#EAF3DE', border: '0.5px solid #97C459',
                  borderRadius: 9, padding: '10px 13px', fontSize: 12, color: '#3B6D11', lineHeight: 1.6,
                }}>
                  <span aria-hidden="true">💡</span> <strong>Albi sugjeron:</strong> {priceSuggestion}
                </div>
              )}
              {priceSuggestion?.startsWith('err:') && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#C42B0F' }}>{priceSuggestion.slice(4)}</div>
              )}
            </div>

            <div className="field">
              <label>Gjendja</label>
              <div className="cond-row" aria-label="Gjendja">
                <button type="button" aria-pressed={form.condition === 'i_ri'} className={`cond-btn ${form.condition === 'i_ri' ? 'active' : ''}`} onClick={() => set('condition', 'i_ri')}><span aria-hidden="true">✨</span> I ri</button>
                <button type="button" aria-pressed={form.condition === 'i_perdorur'} className={`cond-btn ${form.condition === 'i_perdorur' ? 'active' : ''}`} onClick={() => set('condition', 'i_perdorur')}><span aria-hidden="true">🔄</span> I përdorur</button>
              </div>
            </div>
          </div>

    </>
  )
}
