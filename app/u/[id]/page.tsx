import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import UserProfileClient from './UserProfileClient'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'
import { SITE_URL } from '../../../lib/siteConfig'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: p } = await sb
    .from('profiles')
    .select('full_name,username,bio,city,avatar_url')
    .eq('id', params.id)
    .single()

  if (!p) return { title: 'Profil — ALPAZAR' }

  const name = p.full_name || p.username || 'Përdorues'
  const title = `${name} — ALPAZAR`
  const desc = p.bio?.slice(0, 155) || `Shiko shpalljet e ${name} në ALPAZAR.`
  const url = `${SITE_URL}/u/${params.id}`

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    // Faqja renderohet ne klient (HTML server bosh) -> permbajtje e holle.
    // Deri sa te behet SSR, mos e indekso por ndiq linqet drejt shpalljeve.
    robots: { index: false, follow: true },
    openGraph: {
      type: 'website',
      url,
      siteName: 'ALPAZAR',
      locale: 'sq_AL',
      title,
      description: desc,
      images: [{ url: p.avatar_url || `${SITE_URL}/icons/icon-512.png` }],
    },
  }
}

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return <UserProfileClient params={params} />
}
