'use client'

import nextDynamic from 'next/dynamic'

const MapPicker = nextDynamic(() => import('../../components/MapPicker').then(m => ({ default: m.MapPicker })), { ssr: false })

export function ListingMid({ p }: any) {
  const { form, set, setForm, msg, mt, mm, uploadProgress, videoPreview, videoUploading, videoPct, handleVideo, removeVideo, handleImages, imagePreviews, maxImages, categories, catLoading, catSuggested, suggestCategory, priceLoading, priceSuggestion, suggestPrice, descLoading, generateDescription, loading, submit, draftRestored, setDraftRestored, myListingCount, freeLimit, showUpsell } = p
  return (
    <>
          <div className="card">
            <div className="section-title"><i className="ti ti-category" aria-hidden="true" />Kategoria *</div>
            <button
              type="button"
              onClick={suggestCategory}
              disabled={catLoading}
              style={{
                margin: '0 0 10px', background: '#111', color: '#F5C842', border: 'none',
                borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700,
                cursor: catLoading ? 'not-allowed' : 'pointer', display: 'flex',
                alignItems: 'center', gap: 5, opacity: catLoading ? 0.7 : 1, fontFamily: 'inherit',
              }}
            >
              {catLoading ? <span aria-hidden='true'>⏳</span> : <span aria-hidden='true'>🤖</span>} {catLoading ? 'Duke menduar...' : 'Sugjero kategorine me Albi'}
            </button>
            {catSuggested && (
              <div style={{ margin: '0 0 10px', fontSize: 11, color: '#166534', background: '#F0FDF4', border: '.5px solid #BBF7D0', borderRadius: 8, padding: '6px 10px' }}>
                <span aria-hidden="true">💡</span> <strong>Albi zgjodhi:</strong> {catSuggested}
              </div>
            )}
            <div className="cat-grid">
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={form.category_id === c.id}
                  className={`cat-btn ${form.category_id === c.id ? 'active' : ''}`}
                  onClick={() => set('category_id', c.id)}
                >
                  <i className={`ti ti-${c.icon}`} aria-hidden="true" />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title"><i className="ti ti-map-pin" aria-hidden="true" />Vendndodhja *</div>
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
              <label>Adresa e saktë <span style={{ fontWeight: 400, color: '#555' }}>(opsional — mund të vendoset me GPS)</span></label>
              <MapPicker
                lat={form.latitude}
                lng={form.longitude}
                address={form.location_address}
                onChange={(lat, lng, address) => setForm(f => ({ ...f, latitude: lat, longitude: lng, location_address: address }))}
                onCityChange={city => { if (!form.city) setForm(f => ({ ...f, city })) }}
              />
            </div>
          </div>

    </>
  )
}
