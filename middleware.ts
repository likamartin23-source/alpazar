import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Mos ekzekuto middleware per assets statike
  const { pathname } = req.nextUrl
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf|js|css|txt|xml|json)$/)
  ) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })
    // Refresh session — keeps cookies in sync
    const { data: { session } } = await supabase.auth.getSession()

    if (pathname.startsWith('/admin')) {
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
    }
  } catch {
    // Nëse supabase dështon, lejo request të kalojë
    return res
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
