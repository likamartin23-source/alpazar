import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'

// FAZA 0 e harnesit (urdheri i Cowork-ut §6/§10): nje endpoint i vetem shendeti
// qe monitori i jashtem (UptimeRobot etc., 30-60s) e godet dhe qe rojtari
// `verifiko-live.mjs` mund ta lexoje. Kthen buildId-in (== commit-i i deploy-it),
// nje DB-ping real dhe nje realtime-ping real, me latenca te matura.
//
// Kontrata: HTTP 200 kur DB-ja pergjigjet (app-i sherbehet); 503 kur DB bie
// (monitori alarmon). Realtime raportohet si nen-gjendje (degraded pa e rrezuar
// te gjithen) qe nje lidhje ws e ngadalte te mos ndezi alarm te rreme uptime.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

const BUILD = process.env.NEXT_PUBLIC_BUILD_ID || 'dev'

type Check = { ok: boolean; ms: number; reason?: string }

async function checkDb(client: any): Promise<Check> {
  const start = Date.now()
  try {
    // app_config lexohet PUBLIKISHT (CLAUDE.md §2.7) — ping i sigurt pa RLS.
    const { error } = await client
      .from('app_config')
      .select('*')
      .limit(1)
      .abortSignal(AbortSignal.timeout(5000))
    const ms = Date.now() - start
    if (error) return { ok: false, ms, reason: error.message }
    return { ok: true, ms }
  } catch (e: any) {
    return { ok: false, ms: Date.now() - start, reason: String(e?.message || e) }
  }
}

async function checkRealtime(client: any): Promise<Check> {
  const start = Date.now()
  return await new Promise<Check>((resolve) => {
    let done = false
    const ch = client.channel('health-' + Math.random().toString(36).slice(2))
    const finish = (ok: boolean, reason?: string) => {
      if (done) return
      done = true
      try { client.removeChannel(ch) } catch { /* pa lidhje — vazhdo */ }
      resolve({ ok, ms: Date.now() - start, ...(reason ? { reason } : {}) })
    }
    const timer = setTimeout(() => finish(false, 'timeout'), 4000)
    ch.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer)
        finish(true)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timer)
        finish(false, status)
      }
    })
  })
}

export async function GET() {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 1 } },
  })

  const [db, realtime] = await Promise.all([
    checkDb(client),
    checkRealtime(client),
  ])

  // Uptime = a sherbehet app-i realisht -> lidhet me DB-ne (bërthama e çdo faqeje).
  const ok = db.ok
  const body = {
    ok,
    build: BUILD,
    at: Date.now(),
    checks: { db, realtime },
  }

  return NextResponse.json(body, {
    status: ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  })
}
