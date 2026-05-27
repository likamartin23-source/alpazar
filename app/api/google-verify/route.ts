import { NextResponse } from 'next/server'

// Kodi i verifikimit nga Google Search Console
// Ndryshoni GOOGLE_SITE_VERIFICATION në .env.local ose Vercel Environment Variables
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
