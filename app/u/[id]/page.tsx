import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import UserProfileClient from './UserProfileClient'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'
import { SITE_URL } from '../../../lib/siteConfig'

// FIX-3 (Cowork): identiteti i viewer-it NE SERVER nga cookie-sesioni => paraqitja
// e parë rendon degën e saktë (pronar↔vizitor) pa kërcim pas hidratimit. Defensiv:
// çdo dështim => null (= vizitor), default-i aktual, pa regresion.
async function fetchViewerId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const sb = createServerComponentClient({ cookies: () => cookieStore as any })
    const { data: { session } } = await sb.auth.getSession()
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

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
    // Faqja tani renderohet ne SSR (profili + shpalljet ne HTML-in e pare) ->
    // permbajtje e plote -> e indeksueshme.
    robots: { index: true, follow: true },
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

// SSR-seed: profili + shpalljet personale + biznesi — E NJEJTA query si klienti.
// Pa kete, faqja niste me spinner mbi gjithe ekranin (loading=true) dhe shpalljet
// []=0, qe pastaj mbusheshin => flicker "spinner/bosh -> permbajtje" ne cdo ngarkim.
// RLS lejon anon (profiles publike, listings_select is_active). Serveri (anon key)
// i merr sakte => paraqitja e pare eshte e plote.
async function fetchProfileData(id: string) {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: profile } = await sb
    .from('profiles')
    .select('id,full_name,username,avatar_url,cover_url,bio,city,is_premium,premium_expires_at,has_boost,boost_expires_at,is_verified,trust_score,trust_score_visible,created_at,shop_name,seller_rating,reviews_count')
    .eq('id', id)
    .single()
  if (!profile) return { profile: null, listings: [], biz: null }

  const [{ data: listings }, { data: biz }] = await Promise.all([
    sb.from('listings')
      .select('id,title,price,currency,images,city,created_at,is_premium,condition,rank_tier')
      .eq('user_id', id)
      .is('business_id', null)
      .eq('is_active', true)
      .order('rank_tier', { ascending: false })
      .order('last_bumped_at', { ascending: false })
      .limit(60),
    sb.from('businesses')
      .select('id,name,logo_url,is_verified')
      .eq('owner_id', id)
      .maybeSingle(),
  ])
  return { profile, listings: listings ?? [], biz: biz ?? null }
}

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const [{ profile, listings, biz }, viewerId] = await Promise.all([
    fetchProfileData(params.id),
    fetchViewerId(),
  ])
  const initialIsOwn = !!(profile && viewerId && viewerId === profile.id)
  return (
    <UserProfileClient
      params={params}
      initialProfile={profile}
      initialListings={listings}
      initialBiz={biz}
      initialIsOwn={initialIsOwn}
    />
  )
}
