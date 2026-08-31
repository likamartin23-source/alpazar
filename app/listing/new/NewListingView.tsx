'use client'

import { PremiumUpsellModal } from '../../components/PremiumUpsell'
import { NEW_LISTING_CSS } from './styles'
import { ListingTop } from './ListingTop'
import { ListingMid } from './ListingMid'
import { ListingMedia } from './ListingMedia'

export function NewListingView({ p }: any) {
  const { myListingCount, freeLimit, showUpsell } = p
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NEW_LISTING_CSS }} />

      {myListingCount >= freeLimit && <PremiumUpsellModal trigger="limit" />}
      {showUpsell && <PremiumUpsellModal trigger="scroll" />}

      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu mbrapa" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <h1 className="topbar-title" style={{ margin: 0 }}><span aria-hidden="true">➕</span> Shto Shpallje</h1>
        </div>

        <div className="body">
          <ListingTop p={p} />
          {p.myBusinesses?.length > 0 && (
            <div style={{ padding: '0 4px', marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>Posto si</label>
              <select value={p.form.business_id || ''} onChange={e => p.setForm((f: any) => ({ ...f, business_id: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 10, padding: '11px 12px', fontSize: 14, background: '#fff', fontFamily: 'inherit' }}>
                <option value="">Vetja ime (shpallje personale)</option>
                {p.myBusinesses.map((b: any) => <option key={b.id} value={b.id}>Biznesi: {b.name}</option>)}
              </select>
            </div>
          )}
          <ListingMid p={p} />
          <ListingMedia p={p} />
        </div>
      </div>
    </>
  )
}
