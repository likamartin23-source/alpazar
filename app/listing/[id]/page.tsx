import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import ListingPageClient from './ListingPageClient'

export const revalidate = 60

const SITE_URL = 'https://alpazar.vercel.app'

async function fetchListingData(id: string) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await sb
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const listing = await fetchListingData(params.id)
  if (!listing) return { title: 'Shpallje — ALPAZAR' }

  const title = `${listing.title} — ALPAZAR`
  const desc = listing.description?.slice(0, 155)
    || `Bli "${listing.title}" në ALPAZAR — Platforma #1 shqiptare e tregtisë online.`
  const image = listing.images?.[0] || `${SITE_URL}/icons/icon-512.png`
  const url = `${SITE_URL}/listing/${params.id}`

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: 'ALPAZAR',
      locale: 'sq_AL',
      title,
      description: desc,
      images: [{ url: image, width: 800, height: 600, alt: listing.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [image],
    },
  }
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await fetchListingData(params.id)

  const jsonLd = listing
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: listing.title,
        description: listing.description || listing.title,
        image: listing.images || [],
        url: `${SITE_URL}/listing/${params.id}`,
        offers: {
          '@type': 'Offer',
          price: listing.price || 0,
          priceCurrency: listing.currency === 'EUR' ? 'EUR' : 'ALL',
          availability: listing.is_active
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: `${SITE_URL}/listing/${params.id}`,
        },
      })
    : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      )}
      <ListingPageClient params={params} initialListing={listing} />
    </>
  )
}
