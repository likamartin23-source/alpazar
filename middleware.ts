import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabaseConfig'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // Assets statike / API — dil menjëherë (matcher i mbulon, kjo është rrjetë sigurie).
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf|js|css|txt|xml|json)$/)
  ) {
    return res
  }

  // Referral — llogaritet PARA header-ave sepse ndikon te vendimi i cache-it (cookie ⇒ pa cache).
  const refParam = req.nextUrl.searchParams.get('ref')
  const hasRef = !!(refParam && /^[a-zA-Z0-9_-]{3,30}$/.test(refParam))

  // FRESKIA vs SHPEJTËSIA. HTML-ja mbetet `no-store` KUDO — garancia e freskisë (shkaku rrënjësor i
  // "versionit të vjetër" ishte ISR/SWR ~1-vjeçar + SW-ja, tashmë e vrarë). PËRJASHTIM I VETËM:
  // kryefaqja `/` pa `?ref=`. Ajo është SSR me anon-key (pa cookie, pa sesion) → HTML identike për
  // të gjithë → cache i shkurtër në CDN është i SIGURT dhe e shpejton shumë (PageSpeed s'ngec në
  // ngarkim). Vercel e pastron CDN-in në ÇDO deploy → pa "version i vjetër"; klienti përditëson me
  // realtime/refetch brenda pak sekondash. `/listing` NUK cache-het KURRË (middleware i vendos cookie
  // sesioni më poshtë → do rrjedhte sesione). Kthim i menjëhershëm: hiq bllokun `if` → no-store kudo.
  if (pathname === '/' && !hasRef) {
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    res.headers.set('CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    res.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
  } else {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    res.headers.set('CDN-Cache-Control', 'no-store')
    res.headers.set('Vercel-CDN-Cache-Control', 'no-store')
  }

  // Module 7: Referral — ruaj cookie kur dikush hap ?ref=CODE (i lehtë, pa Supabase).
  if (hasRef) {
    res.cookies.set('alpazar_ref', refParam!, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  // Supabase (i rëndë) ekzekutohet VETËM për /admin — pjesa tjetër e faqeve
  // s'ka nevojë për sesion server-side (janë 'use client', menaxhojnë vetë auth-in).
  // Kjo heq një thirrje getSession()+instancim klienti nga çdo ngarkim faqeje.
  if (pathname.startsWith('/admin')) {
    try {
      // Dynamic import — kodi i rëndë Supabase ngarkohet vetëm kur vizitohet /admin,
      // jo për çdo kërkesë të faqes (ul madhësinë e ekzekutuar në edge).
      const { createMiddlewareClient } = await import('@supabase/auth-helpers-nextjs')
      // Vlerat jepen SHPREHIMISHT nga `lib/supabase.ts`, jo nga mjedisi.
      // Pa kete, `createMiddlewareClient()` i lexon vete `NEXT_PUBLIC_SUPABASE_URL`
      // dhe `..._ANON_KEY` dhe HEDH PERJASHTIM kur njeri mungon → bie te `catch`
      // → ridrejtim te hyrja. Pasoja e matur me 31 gusht 2026: faqet publike
      // vazhdonin te punonin (lib/supabase.ts ka vlere rezerve) ndersa CDO
      // kerkese te `/admin` ridrejtohej ne heshtje, pa asnje diagnoze.
      // Tani te dyja shtresat lexojne te njejtin burim; `/api/health` e raporton
      // gjithsesi mungesen e variablit qe konfigurimi te rregullohet.
      const supabase = createMiddlewareClient(
        { req, res },
        { supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_ANON_KEY },
      )
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      // `is_admin()` SECURITY DEFINER — përgjigjet VETËM për thirrësin, s'ekspozon
      // rolin e askujt tjetër. Leximi i drejtpërdrejtë i kolonës `profiles.is_admin`
      // u bllokua nga migrimi `profiles_ngushtimi_pas_deploy` (O6-C) → më parë ky
      // gjykim rrëzonte pronarin jashtë `/admin` (regres §0-bis: fshesa fillestare
      // humbi `middleware.ts` në rrënjë). I njëjti burim si app/admin/page.tsx + api/email.
      // MOS ktheje te `grant select (is_admin)`: RLS e profiles është public_read → do
      // të rihapte §4.6-bis (çdo i kyçur numëron adminët).
      const { data: eshteAdmin } = await supabase.rpc('is_admin')
      if (!eshteAdmin) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch {
      // Fail closed për rrugët admin.
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  } else if (
    pathname === '/messages' || pathname.startsWith('/messages/') ||
    pathname === '/profile'  || pathname.startsWith('/profile/')  ||
    pathname === '/favorites'|| pathname.startsWith('/favorites/')||
    pathname === '/biznese/new' || pathname === '/listing/new'
  ) {
    // Rrugë PRIVATE: kërkojnë sesion. Pa këtë, faqja kthehej 200 dhe rendohej për një çast
    // (flash) para se klienti të ridrejtonte te hyrja — dhe ishte e indeksueshme nga crawler-at.
    // RLS i mbron TË DHËNAT gjithsesi (s'ishte vrimë sigurie); kjo heq flash-in + i fsheh nga SEO.
    // Fail-soft: nëse `getSession()` dështon (rrjet/edge), NUK bllokojmë — klienti e trajton (pa lockout).
    try {
      const { createMiddlewareClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createMiddlewareClient(
        { req, res },
        { supabaseUrl: SUPABASE_URL, supabaseKey: SUPABASE_ANON_KEY },
      )
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return NextResponse.redirect(new URL('/auth/login', req.url))
    } catch { /* fail-soft: mos blloko */ }
  } else if (
    pathname.startsWith('/biznese') ||
    pathname.startsWith('/u/') ||
    pathname.startsWith('/listing')
  ) {
    // RIFRESKIMI I SESIONIT për faqet që përcaktojnë pronar-vs-vizitor NË SERVER (SSR).
    // Pa këtë, `auth-helpers` s'e mban cookie-sesionin të freskët → pas skadimit të
    // access-token-it (~1 orë), `getSession()` server-side kthen NULL edhe kur përdoruesi
    // është i loguar → pronari lexohet gabimisht si vizitor → kërcim/lexim i gabuar
    // (shkaku sistemik i "s'po lexon nëse e hapi pronari apo vizitori"). `getSession()`
    // këtu rifreskon token-in dhe shkruan cookie-n e re te `res`. Fail-soft: çdo dështim
    // → faqja rendon si vizitor (pa regresion). Vetëm rifreskim, PA redirect.
    try {
      const { createMiddlewareClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createMiddlewareClient({ req, res })
      await supabase.auth.getSession()
    } catch { /* fail-soft */ }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Ekzekuto middleware vetëm për rrugët e aplikacionit.
     * Mos ekzekuto për: fajlla statike, _next, API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml|json)$).*)',
  ],
}
