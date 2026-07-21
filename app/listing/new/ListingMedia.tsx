'use client'

export function ListingMedia(p: any) {
  const { form, set, setForm, msg, mt, mm, uploadProgress, videoPreview, videoUploading, videoPct, handleVideo, removeVideo, handleImages, imagePreviews, maxImages, categories, catLoading, catSuggested, suggestCategory, priceLoading, priceSuggestion, suggestPrice, descLoading, generateDescription, loading, submit, draftRestored, setDraftRestored, myListingCount, freeLimit, showUpsell } = p
  return (
    <>
          <div className="card">
            <div className="card-title"><i className="ti ti-photo" aria-hidden="true" />Fotot <span style={{ fontWeight: 400, color: imagePreviews.length >= maxImages ? '#E63312' : '#888', fontSize: 12 }}>({imagePreviews.length}/{maxImages})</span></div>
            <label className="img-zone" onClick={() => document.getElementById('img-input')?.click()}>
              <input id="img-input" type="file" accept="image/*" multiple onChange={handleImages} />
              <i className="ti ti-cloud-upload" aria-hidden="true" />
              <p>Kliko pÃ«r tÃ« ngarkuar fotot</p>
              <p style={{ fontSize: 10, marginTop: 4, color: '#bbb' }}>Cdo format Â· pa kufi madhesie Â· kompresim automatik</p>
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
            <div className="card-title"><i className="ti ti-video" aria-hidden="true" />Video <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>(opsionale Â· pa kufi madhesie)</span></div>
            {!videoPreview ? (
              <label classX[YOHš[YË^›Û™HˆÛÛXÚÏ^Ê
HOˆØÝ[Y[™Ù][[Y[žRY
	ÝšYZ[œ]	ÊOË˜ÛXÚÊ
_O‚ˆ[œ]YHšYZ[œ]ˆ\OH™š[HˆXØÙ\HšY[ËÊˆˆÛÚ[™ÙO^Ú[™UšY[ßHÏ‚ˆHÛ\ÜÓ˜[YOHHK]šY[Èˆ\šXKZY[HYHˆÏ‚ˆ”ÚÈš™HšY[ÈH›ÙZÝ]Ü‚ˆÝ[O^ÞÈ›ÛÚ^™NˆLX\™Ú[•ÜˆÛÛÜŽˆ	ÈØ˜˜‰È_OÙÈ›Ü›X]šY[È0­ÈHÝYšH0­ÈÚ[™HYHÚ][ˆYHÚZÜ‚ˆÛX™[‚ˆ
Hˆ
ˆ]ˆÝ[O^ÞÈÜÚ][ÛŽˆ	Ü™[]]™IÈ_O‚ˆšY[ÈÜ˜Ï^ÝšY[Ô™]šY]ßHÛÛ›ÛÈ^\Ò[›[™HÝ[O^ÞÈÚYˆ	ÌL	IËX^ZYÚˆŒ›Ü™\”˜Y]\ÎˆL‹˜XÚÙÜ›Ý[™ˆ	ÈÌ	Ë\Ü^Nˆ	Ø›ØÚÉÈ_HÏ‚ˆ]Ûˆ\OH˜]ÛˆˆÛÛXÚÏ^Ü™[[Ý™UšY[ßH\šXK[X™[H’\HšY[ÛˆˆÝ[O^ÞÈÜÚ][ÛŽˆ	ØXœÛÛ]IËÜˆšYÚˆ˜XÚÙÜ›Ý[™ˆ	Ü™Ø˜JŠIËÛÛÜŽˆ	ÈÙ™™‰Ë›Ü™\Žˆ	Û›Û™IË›Ü™\”˜Y]\ÎˆNNKÚYˆÌZYÚˆÌÝ\œÛÜŽˆ	ÜÚ[\‰Ë›ÛÚ^™NˆM‹[™RZYÚˆH_O°åÏØ]Û‚ˆÝšY[Õ\ØY[™È	‰ˆ]ˆÝ[O^ÞÈÜÚ][ÛŽˆ	ØXœÛÛ]IË›ÝÛNˆYˆšYÚˆ˜XÚÙÜ›Ý[™ˆ	Ü™Ø˜JŠIËÛÛÜŽˆ	ÈÙ™™‰Ë›ÛÚ^™NˆLKY[™Îˆ	Í	Ë›Ü™\”˜Y]\Îˆ_O‘ZÙH™Ø\šÝX\ˆšY[Û‹‹‹ˆÝšY[ÔÝIOÙ]ŸBˆÙ]‚ˆ
_BˆÙ]‚‚ˆ]Ûˆ\OHœÝX›Z]ˆÛ\ÜÖÖSÒ'7V&Ö—BÖ'Fâ"öä6Æ–6³×·7V&Ö—GÒF—6&ÆVC×¶ÆöF–æwÓà¢·f–FVõWÆöF–æròÃãÇ7â&–Ö†–FFVãÒwG'VRsî(û3Â÷7ãâ¶f–FVòG·f–FVõ7GÒRââæÓÂóâ¢WÆöE&öw&W72òÃãÇ7â&–Ö†–FFVãÒwG'VRsî(û3Â÷7ãâ¶f÷FòG·WÆöE&öw&W72æFöæWÒòG·WÆöE&öw&W72çF÷FÇÒââæÓÂóâ¢ÆöF–æròÃãÇ7â&–Ö†–FFVãÒwG'VRsî(û3Â÷7ãâGV¶RV&Æ–·V"ââãÂóâ¢ÃãÇ7â&–Ö†–FFVãÒwG'VRsï	ù¨Â÷7ãâV&Æ–¶ò6‡ÆÆ¦VâfÆ3ÂóçÐ¢Âö'WGFöãà¢Âóà¢§Ð