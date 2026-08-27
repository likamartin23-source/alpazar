'use client'
// GAP 2 (RESTAURIMI FINAL): faqet SEO të kategorive përdorin KARTËN E PËRBASHKËT ListingCard
// (jo `seo-card` divergjente), që identiteti i biznesit (logo/emër → /biznese), tier-i (★/👑)
// dhe 👁/🔴 të shfaqen njësoj si te feed-et. Komponent klient vetëm për `mounted` (koha relative
// varet nga Date.now() → shmang mospërshtatjen e hidratimit); teksti SEO (titull/çmim/qytet)
// vazhdon të render-ohet në SSR nga ListingCard.
import { useEffect, useState } from 'react'
import ListingCard, { type ListingCardItem } from '../components/ListingCard'

export function ListingGrid({ listings }: { listings: ListingCardItem[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return (
    <div className="listings-grid">
      {listings.map((l, i) => (
        <ListingCard key={l.id} listing={l} index={i} mounted={mounted} />
      ))}
    </div>
  )
}
