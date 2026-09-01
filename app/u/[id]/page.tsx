import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import UserProfileClient from './UserProfileClient'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'
import { LISTING_SELECT } from '../../../lib/listingSelect'
import { SITE_URL } from '../../../lib/siteConfig'

// /u/<param> pranon UUID ose username. Rrugëzimi i vjetër zgjidhte VETËM me `id`,
// ndaj `/u/likamartin23` jepte "Profili nuk u gjet" (gjetje live O1). Detektojmë
// formatin UUID; nëse s'është, e zgjidhim me `username`. `maybeSingle` => pa përjashtim
// kur s'ka përputhje (username i pasaktë) — thjesht profil bosh, si më parë.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function profileCol(param: string): 'id' | 'username' {
  return UUID_RE.test(param) ? 'id' : 'username'
}

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
    .eq(profileCol(params.id), params.id)
    .maybeSingle()

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
    .select('id,full_name,username,avatar_url,cover_url,bio,city,is_premium,premium_expires_at,has_boost,boost_expires_at,is_verified,trust_score,trust_score_visible,created_at,shop_name,seller_rating,reviews_count,gamification_points,gamification_level')
    .eq(profileCol(id), id)
    .maybeSingle()
  if (!profile) return { profile: null, listings: [], biz: null }

  // Nga këtu përdorim ID-në REALE të profilit (jo `id`-në e URL-së, që mund të jetë username).
  const uid = profile.id
  const [{ data: listings }, { data: biz }] = await Promise.all([
    sb.from('listings')
      .select(LISTING_SELECT)
      .eq('user_id', uid)
      .is('business_id', null)
      .eq('is_active', true)
      .order('rank_tier', { ascending: false })
      .order('last_bumped_at', { ascending: false })
      .limit(60),
    sb.from('businesses')
      .select('id,name,logo_url,is_verified')
      .eq('owner_id', uid)
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
