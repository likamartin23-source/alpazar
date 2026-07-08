import { NextResponse } from 'next/server'
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

  // Module 7: Referral — ruaj cookie kur dikush hap ?ref=CODE (i lehtë, pa Supabase).
  const refParam = req.nextUrl.searchParams.get('ref')
  if (refParam && /^[a-zA-Z0-9_-]{3,30}$/.test(refParam)) {
    res.cookies.set('alpazar_ref', refParam, {
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
      const supabase = createMiddlewareClient({ req, res })
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()
      if (!profile?.is_admin) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch {
      // Fail closed për rrugët admin.
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
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
