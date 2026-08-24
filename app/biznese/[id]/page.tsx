import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import BiznesPageClient from './BiznesPageClient'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'

// SSR DINAMIK (jo ISR). ISR-ja (revalidate) shkaktonte "mospershtatje build-i mes
// rrugeve": edge-i sherbente nje prerender te nje deploy-i te VJETER per /biznese
// ndersa / dhe /listing ishin te reja (gjetja e Cowork-ut, §12). force-dynamic =>
// cdo kerkese renderon me kodin e deploy-it aktual => buildId i njejte kudo.
export const dynamic = 'force-dynamic'

const SITE_URL = 'https://alpazar.vercel.app'

async function fetchBizData(id: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  // I njejti fallback si te klienti: id ose owner_id.
  let { data } = await sb.from('businesses').select('*').eq('id', id).maybeSingle()
  if (!data) {
    const res = await sb.from('businesses').select('*').eq('owner_id', id).maybeSingle()
    data = res.data
  }
  return data
}

// SSR-seed i shpalljeve — E NJEJTA query si klienti (BiznesPageClient.fetchBiz).
// Pa kete, shpalljet merreshin VETEM ne klient => paraqitja e pare kishte 0 shpallje
// (gjendja fillestare []), pastaj mbushej ne 3 => flicker-i "1s e re -> bosh -> e re"
// qe pa perdoruesi. RLS lejon anon (`listings_select`: is_active AND business_is_visible),
// ndaj serveri (anon key) i merr sakte => paraqitja e pare eshte tashme e plote.
async function fetchBizListings(businessId: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data } = await sb
    .from('listings')
    .select('id,title,price,currency,images,condition,city,is_premium,views_count,created_at,rank_tier')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('rank_tier', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

// hours -> openingHours ne format schema.org (p.sh. "Mo-Fr 09:00-18:00")
const DAY_MAP: Record<string, string> = {
  hene: 'Mo', marte: 'Tu', merkure: 'We', enjte: 'Th',
  premte: 'Fr', shtune: 'Sa', diele: 'Su',
  mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su',
}
function toOpeningHours(hours: any): string[] {
  if (!hours || typeof hours !== 'object') return []
  const out: string[] = []
  for (const [k, v] of Object.entries(hours as Record<string, any>)) {
    const day = DAY_MAP[String(k).toLowerCase().replace(/[^a-z]/g, '')]
    if (!day || !v) continue
    const open = (v as any).open || (v as any).nga
    const close = (v as any).close || (v as any).deri
    if (open && close) out.push(`${day} ${open}-${close}`)
  }
  return out
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  const biz = await fetchBizData(params.id)
  // Kur biznesi s'gjendet ose s'eshte i dukshem publikisht (RLS): canonical te
  // vetja (jo te lista /biznese) dhe noindex — qe te mos demtohet SEO-ja e as te
  // krijohet canonical i gabuar (gjetja e Cowork-ut, §12).
  if (!biz) {
    return {
      title: 'Biznes — ALPAZAR',
      description: 'Ky biznes nuk eshte i disponueshem publikisht ne ALPAZAR.',
      alternates: { canonical: `${SITE_URL}/biznese/${params.id}` },
      robots: { index: false, follow: true },
    }
  }

  const title = `${biz.name} — ALPAZAR`
  const desc = biz.description?.slice(0, 155)
    || `Vizito dyqanin "${biz.name}"${biz.city ? ` në ${biz.city}` : ''} në ALPAZAR — Platforma #1 shqiptare e tregtisë online.`
  const image = biz.logo_url || `${SITE_URL}/icons/icon-512.png`
  const url = `${SITE_URL}/biznese/${params.id}`

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
      images: [{ url: image, width: 400, height: 400, alt: biz.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [image],
    },
  }
}

export default async function BiznesPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const biz = await fetchBizData(params.id)
  // Shpalljet SSR vetem nese biznesi ekziston (perdorim id-ne reale te biznesit,
  // jo params.id qe mund te jete owner_id nga fallback-u).
  const initialListings = biz ? await fetchBizListings(biz.id) : []

  const jsonLd = biz
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: biz.name,
        url: `${SITE_URL}/biznese/${params.id}`,
        ...(biz.description ? { description: String(biz.description).slice(0, 500) } : {}),
        ...(biz.logo_url ? { image: biz.logo_url, logo: biz.logo_url } : {}),
        ...(biz.phone ? { telephone: biz.phone } : {}),
        ...(biz.email ? { email: biz.email } : {}),
        ...(biz.website ? { sameAs: [biz.website] } : {}),
        ...(biz.address || biz.city
          ? {
              address: {
                '@type': 'PostalAddress',
                ...(biz.address ? { streetAddress: biz.address } : {}),
                ...(biz.city ? { addressLocality: biz.city } : {}),
                addressCountry: 'AL',
              },
            }
          : {}),
        ...(typeof biz.latitude === 'number' && typeof biz.longitude === 'number'
          ? { geo: { '@type': 'GeoCoordinates', latitude: biz.latitude, longitude: biz.longitude } }
          : {}),
        ...(toOpeningHours(biz.hours).length
          ? { openingHours: toOpeningHours(biz.hours) }
          : {}),
      }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      )}
      <BiznesPageClient params={params} initialBiz={biz} initialListings={initialListings} />
    </>
  )
}
