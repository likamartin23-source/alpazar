import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) return NextResponse.redirect(new URL('/auth/login', req.url))
    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', session.user.id).single()
    if (!profile?.is_admin) return NextResponse.redirect(new URL('/', req.url))
  }
  return res
}
export const config = { matcher: ['/admin/:path*'] }
