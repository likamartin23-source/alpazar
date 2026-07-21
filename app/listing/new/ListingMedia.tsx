'use client'

export function ListingMedia({ p }: any) {
  const { form, set, setForm, msg, mt, mm, uploadProgress, videoPreview, videoUploading, videoPct, handleVideo, removeVideo, handleImages, imagePreviews, maxImages, categories, catLoading, catSuggested, suggestCategory, priceLoading, priceSuggestion, suggestPrice, descLoading, generateDescription, loading, submit, draftRestored, setDraftRestored, myListingCount, freeLimit, showUpsell } = p
  return (
    <>
          <div className="card">
            <div className="card-title"><i className="ti ti-photo" aria-hidden="true" />Fotot <span style={{ fontWeight: 400, color: imagePreviews.length >= maxImages ? '#E63312' : '#888', fontSize: 12 }}>({imagePreviews.length}/{maxImages})</span></div>
            <label className="img-zone" onClick={() => document.getElementById('img-input')?.click()}>
              <input id="img-input" type="file" accept="image/*" multiple onChange={handleImages} />
              <i className="ti ti-cloud-upload" aria-hidden="true" />
              <p>Kliko për të ngarkuar fotot</p>
              <p style={{ fontSize: 10, marginTop: 4, color: '#bbb' }}>Cdo format · pa kufi madhesie · kompresim automatik</p>
            </label>
            {imagePreviews.length > 0 && (
              <div className="img-previews">
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={src} className="img-prev" alt={`Foto ${i + 1}`} loading="lazy" />
                    {i === 0 && (
                      <span style={{ position: 'absolute', top: 4, left: 4, background: '#F5C842', color: '#111', fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 4, lineHeight: 1.4, pointerEvents: 'none' }}>
                        Kryesore
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-video" aria-hidden="true" />Video <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>(opsionale · pa kufi madhesie)</span></div>
            {!videoPreview ? (
              <label className="img-zone" onClick={() => document.getElementById('vid-input')?.click()}>
                <input id="vid-input" type="file" accept="video/*" onChange={handleVideo} />
                <i className="ti ti-video" aria-hidden="true" />
                <p>Shto nje video te produktit</p>
                <p style={{ fontSize: 10, marginTop: 4, color: '#bbb' }}>Cdo format video · pa kufi · shpallje qe shiten me shpejt</p>
              </label>
            ) : (
              <div style={{ position: 'relative' }}>
                <video src={videoPreview} controls playsInline style={{ width: '100%', maxHeight: 260, borderRadius: 12, background: '#000', display: 'block' }} />
                <button type="button" onClick={removeVideo} aria-label="Hiq videon" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 999, width: 30, height: 30, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                {videoUploading && <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 8 }}>Duke ngarkuar videon... {videoPct}%</div>}
              </div>
            )}
          </div>

          <button type="submit" className="submit-btn" onClick={submit} disabled={loading}>
            {videoUploading ? <><span aria-hidden='true'>⏳</span> {`Video ${videoPct}%...`}</> : uploadProgress ? <><span aria-hidden='true'>⏳</span> {`Foto ${uploadProgress.done}/${uploadProgress.total}...`}</> : loading ? <><span aria-hidden='true'>⏳</span> Duke publikuar...</> : <><span aria-hidden='true'>🚀</span> Publiko shpalljen falas</>}
          </button>
    </>
  )
}
