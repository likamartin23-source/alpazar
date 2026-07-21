'use client'

import { PremiumUpsellModal } from '../../components/PremiumUpsell'
import { NEW_LISTING_CSS } from './styles'
import { ListingTop } from './ListingTop'
import { ListingMid } from './ListingMid'
import { ListingMedia } from './ListingMedia'

export function NewListingView(p: any) {
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
          <ListingMid p={p} />
          <ListingMedia p={p} />
        </div>
      </div>
    </>
  )
}
