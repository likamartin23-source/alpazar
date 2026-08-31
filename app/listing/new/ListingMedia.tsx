'use client'

function dur(s: number) {
  if (!s || !isFinite(s)) return ''
  const m = Math.floor(s / 60)
  const r = Math.round(s % 60)
  return m + ':' + String(r).padStart(2, '0')
}

export function ListingMedia({ p }: any) {
  const { uploadProgress, vid, handleImages, imagePreviews, maxImages, loading, submit, mt, mm } = p
  const imgCap = maxImages < 0 ? '∞' : maxImages
  const vidCap = vid.maxVideos < 0 ? '∞' : vid.maxVideos
  const full = vid.maxVideos >= 0 && vid.count >= vid.maxVideos

  return (
    <>
      <div className="card">
        <div className="card-title">
          <i className="ti ti-photo" aria-hidden="true" />Fotot{' '}
          <span style={{ fontWeight: 400, color: (maxImages >= 0 && imagePreviews.length >= maxImages) ? '#C42305' : '#888', fontSize: 12 }}>
            ({imagePreviews.length}/{imgCap})
          </span>
        </div>
        <label className="img-zone" onClick={() => document.getElementById('img-input')?.click()}>
          <input id="img-input" type="file" accept="image/*" multiple onChange={handleImages} />
          <i className="ti ti-cloud-upload" aria-hidden="true" />
          <p>Kliko për të ngarkuar fotot</p>
          <p style={{ fontSize: 10, marginTop: 4, color: '#555' }}>Cdo format · pa kufi madhesie · kompresim automatik</p>
        </label>
        {imagePreviews.length > 0 && (
          <div className="img-previews">
            {imagePreviews.map((src: string, i: number) => (
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
        <div className="card-title">
          <i className="ti ti-video" aria-hidden="true" />Video{' '}
          <span style={{ fontWeight: 400, color: full ? '#C42305' : '#888', fontSize: 12 }}>
            ({vid.count}/{vidCap})
          </span>
        </div>

        {!full && (
          <label className="img-zone" onClick={() => document.getElementById('vid-input')?.click()}>
            <input id="vid-input" type="file" accept="video/*" multiple onChange={vid.add} />
            <i className="ti ti-video" aria-hidden="true" />
            <p>Shto video të produktit</p>
            <p style={{ fontSize: 10, marginTop: 4, color: '#555' }}>
              Deri në {vid.maxMin} minuta secila · deri {vid.maxMb}MB secila · max {vidCap} video
            </p>
          </label>
        )}

        {full && (
          <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, padding: '10px 12px', fontSize: 11.5, color: '#856404', lineHeight: 1.5 }}>
            Ke arritur kufirin prej {vid.maxVideos} videosh.
            {!vid.isPremium && <> Me <a href="/premium" style={{ color: '#C42B0F', fontWeight: 700 }}>Premium</a> ngarkon deri në 10 video për shpallje.</>}
          </div>
        )}

        {vid.count > 0 && (
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {vid.items.map((it: any, i: number) => (
              <div key={i} style={{ position: 'relative' }}>
                <video src={it.preview} controls playsInline preload="metadata"
                  style={{ width: '100%', maxHeight: 220, borderRadius: 12, background: '#000', display: 'block' }} />
                <button type="button" onClick={() => vid.remove(i)} aria-label={`Hiq videon ${i + 1}`}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.62)', color: '#fff', border: 'none', borderRadius: 999, width: 30, height: 30, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                  ×
                </button>
                {!!dur(it.duration) && (
                  <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, lineHeight: 1.6 }}>
                    {dur(it.duration)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {vid.uploading && (
          <div style={{ marginTop: 10, background: '#e8f4fd', border: '1px solid #90caf9', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#1565c0' }}>
            Duke ngarkuar videot… {vid.pct}%
            <div style={{ background: '#bbdefb', borderRadius: 4, height: 6, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ background: '#1976d2', height: '100%', width: `${vid.pct}%`, transition: 'width .3s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Mesazhi i gabimit/statusit shfaqet EDHE këtu te butoni — më parë dilte vetëm në krye
          (ListingTop), ndaj kur validimi dështonte (p.sh. titull/kategori/qytet bosh) përdoruesi
          poshtë te butoni s'e shihte dhe dukej sikur "butoni nuk punon". */}
      {mm && (
        <div className={`msg-box ${mt}`} role="alert" style={{ marginBottom: 10 }}>{mm}</div>
      )}

      <button type="submit" className="submit-btn" onClick={submit} disabled={loading}>
        {vid.uploading
          ? <><span aria-hidden="true">⏳</span> {`Video ${vid.pct}%...`}</>
          : uploadProgress
            ? <><span aria-hidden="true">⏳</span> {`Foto ${uploadProgress.done}/${uploadProgress.total}...`}</>
            : loading
              ? <><span aria-hidden="true">⏳</span> Duke publikuar...</>
              : <><span aria-hidden="true">🚀</span> Publiko shpalljen falas</>}
      </button>
    </>
  )
}
