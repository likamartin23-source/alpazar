import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const code = process.env.GOOGLE_SITE_VERIFICATION || ''
  if (!code) {
    return new NextResponse('google-site-verification: not configured', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  return new NextResponse(`google-site-verification: ${code}`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
