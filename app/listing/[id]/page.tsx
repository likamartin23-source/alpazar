import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import ListingPageClient from './ListingPageClient'
import { ListingMediaProvider } from '../../components/ListingMediaContext'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'
import { SITE_URL } from '../../../lib/siteConfig'

// SSR DINAMIK (jo ISR). ISR-ja mund te sherbente nje prerender te nje deploy-i te
// vjeter (mospershtatje build-i mes rrugeve — gjetja e Cowork-ut §12). force-dynamic
// => cdo rruge renderon me kodin e deploy-it aktual => buildId i njejte kudo, pa staleness.
export const dynamic = 'force-dynamic'

async function fetchListingData(id: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data } = await sb
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

function videoList(listing: any): string[] {
  const out: string[] = []
  const arr = Array.isArray(listing?.videos) ? listing.videos : []
  for (const v of arr) {
    if (!v) continue
    if (typeof v === 'string') out.push(v)
    else if (v.url) out.push(String(v.url))
  }
  if (out.length === 0 && listing?.video_url) out.push(String(listing.video_url))
  return out
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  const listing = await fetchListingData(params.id)
  if (!listing) return { title: 'Shpallje — ALPAZAR' }

  const title = `${listing.title} — ALPAZAR`
  const desc = listing.description?.slice(0, 155)
    || `Bli "${listing.title}" në ALPAZAR — Platforma #1 shqiptare e tregtisë online.`
  const image = listing.images?.[0] || `${SITE_URL}/icons/icon-512.png`
  const url = `${SITE_URL}/listing/${params.id}`
  const vids = videoList(listing)

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
      ...(vids.length ? { videos: vids.map(v => ({ url: v })) } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [image],
    },
  }
}

export default async function ListingPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const listing = await fetchListingData(params.id)
  const vids = videoList(listing)

  const jsonLd = listing
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: listing.title,
        description: listing.description || listing.title,
        image: (listing.images && listing.images.length)
          ? listing.images
          : [`${SITE_URL}/icons/icon-512.png`],
        url: `${SITE_URL}/listing/${params.id}`,
        ...(listing.condition === 'i_ri' || listing.condition === 'i_perdorur'
          ? { itemCondition: listing.condition === 'i_ri'
              ? 'https://schema.org/NewCondition'
              : 'https://schema.org/UsedCondition' }
          : {}),
        // Video e shpalljes -> rich result me miniature video ne Google.
        ...(vids.length
          ? {
              subjectOf: vids.map((v: string) => ({
                '@type': 'VideoObject',
                name: listing.title,
                description: (listing.description || listing.title).slice(0, 200),
                contentUrl: v,
                thumbnailUrl: listing.video_poster || listing.images?.[0] || `${SITE_URL}/icons/icon-512.png`,
                uploadDate: listing.created_at || new Date().toISOString(),
              })),
            }
          : {}),
        // Offer vetem kur ka cmim real — price:"0" e bente Offer-in invalid
        // (shpalljet "me marreveshje" humbisnin te gjithe rich-result-in).
        ...(Number(listing.price) > 0
          ? {
              offers: {
                '@type': 'Offer',
                price: listing.price,
                priceCurrency: listing.currency === 'EUR' ? 'EUR' : 'ALL',
                availability: listing.is_active
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
                url: `${SITE_URL}/listing/${params.id}`,
              },
            }
          : {}),
      }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      )}
      <ListingMediaProvider videos={listing?.videos} legacy={listing?.video_url} poster={listing?.video_poster}>
        <ListingPageClient params={params} initialListing={listing} />
      </ListingMediaProvider>
    </>
  )
}
