import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import BiznesPageClient from './BiznesPageClient'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'

// ISR: te dhenat e biznesit ndryshojne rralle; klienti rifreskon ne mount.
export const revalidate = 300

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
  if (!biz) return { title: 'Biznes — ALPAZAR' }

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
      <BiznesPageClient params={params} initialBiz={biz} />
    </>
  )
}
