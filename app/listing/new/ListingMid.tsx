'use client'

import nextDynamic from 'next/dynamic'

const MapPicker = nextDynamic(() => import('../../components/MapPicker').then(m => ({ default: m.MapPicker })), { ssr: false })

export function ListingMid(p: any) {
  const { form, set, setForm, msg, mt, mm, uploadProgress, videoPreview, videoUploading, videoPct, handleVideo, removeVideo, handleImages, imagePreviews, maxImages, categories, catLoading, catSuggested, suggestCategory, priceLoading, priceSuggestion, suggestPrice, descLoading, generateDescription, loading, submit, draftRestored, setDraftRestored, myListingCount, freeLimit, showUpsell } = p
  return (
    <>
          <div className="card">
            <div className="card-title"><i className="ti ti-category" aria-hidden="true" />Kategoria *</div>
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
              {catLoading ? <span aria-hidden='true'>‚è≥</span> : <span aria-hidden='true'>ü§ñ</span>} {catLoading ? 'Duke menduar...' : 'Sugjero kategorine me Albi'}
            </button>
            {catSuggested && (
              <div style={{ margin: '0 0 10px', fontSize: 11, color: '#166534', background: '#F0FDF4', border: '.5px solid #BBF7D0', borderRadius: 8, padding: '6px 10px' }}>
                <span aria-hidden="true">üí°</span> <strong>Albi zgjodhi:</strong> {catSuggested}
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
            <div className="card-title"><i className="ti ti-map-pin" aria-hidden="true" />Vendndodhja *</div>
            <div className="field">
              <label htmlõ‹èHõ\›[ôÀX⁄]Hèî^]]H
è€Xô[Çà[ú]àYHõ\›[ôÀX⁄]HÇà\OHù^ÇàXŸZ€\èHúú⁄à\ò[∞ÍÀ\ú∞Í‹Àõ‹∞ÍÀããàÇà]]–€€\]OHòYô\‹À[]ô[àÇàò[YO^Ÿõ‹õKò⁄]_Bà€ê⁄[ôŸO^ŸHOàŸ]
	ÿ⁄]IÀKù\ôŸ]ùò[YJ_Bàô\]Z\ôYàœÇàŸ]èÇà]à€\‹”ò[YOHôöY[èÇàXô[êYô\ÿHHÿZ›0Í»‹[à›[O^ﬁ»õ€ùŸZY⁄à€€‹éà	»ÿXXI»_Oä‹⁄[€ò[8†%][ô0Í»ô[ô‹Ÿ]YH‘ O‹‹[èè€Xô[ÇàX\X⁄Ÿ\Çà]^Ÿõ‹õKõ]]Y_Bàôœ^Ÿõ‹õKõ€ô⁄]Y_BàYô\‹œ^Ÿõ‹õKõÿÿ][€óÿYô\‹ﬂBà€ê⁄[ôŸO^ ]ôÀYô\‹ HOàŸ]õ‹õJàOà
»ããôã]]YNà]€ô⁄]YNàôÀÿÿ][€óÿYô\‹ŒàYô\‹»JJ_Bà€ê⁄]P⁄[ôŸO^ÿ⁄]HOà»Yà
Yõ‹õKò⁄]JHŸ]õ‹õJàOà
»ããôã⁄]HJJH_BàœÇàŸ]èÇàŸ]èÇÇàœÇà
BüB