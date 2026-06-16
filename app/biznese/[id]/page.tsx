import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import BiznesPageClient from './BiznesPageClient'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://alpazar.vercel.app'

async function fetchBizData(id: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data } = await sb
    .from('businesses')
    .select('name,description,logo_url,city')
    .eq('id', id)
    .single()
  return data
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
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

export default function BiznesPage({ params }: { params: { id: string } }) {
  return <BiznesPageClient params={params} />
}
