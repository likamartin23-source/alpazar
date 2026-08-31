import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

// Burimi i vertete i versionit te ndertimit — perdoret nga UpdatePrompt
// si rrjet sigurie kur Service Worker nuk eshte i disponueshem.
export async function GET() {
  return NextResponse.json(
    { build: process.env.NEXT_PUBLIC_BUILD_ID || 'dev', at: Date.now() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
