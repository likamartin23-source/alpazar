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

/*  INVENTARI I VARIABLAVE TE MJEDISIT
 *
 *  Problemi qe e lindi: nje variabel qe mungon te Vercel nuk lajmerohet askund.
 *  Matur me 31 gusht 2026 — pa `NEXT_PUBLIC_SUPABASE_ANON_KEY`, faqet publike
 *  vazhdojne te punojne (lib/supabase.ts ka vlere rezerve) ndersa CDO kerkese te
 *  `/admin` ridrejtohet ne heshtje te hyrja, sepse `createMiddlewareClient()` e
 *  lexon variablin nga mjedisi dhe hedh perjashtim. Zero diagnoze.
 *
 *  Ky seksion e ben mungesen TE DUKSHME me nje URL te vetme. Raporton VETEM
 *  praninë — kurre vleren, kurre gjatesine, kurre prefiksin — ndaj mund te hapet
 *  edhe nga nje monitor i jashtem pa rrjedhur asnje sekret.
 *
 *  `kritik`  = pa te prishet dicka qe perdoruesi e sheh ose nje portë sigurie.
 *  `vecori`  = pa te fiket nje vecori, por asgje nuk prishet (degradim i paster).
 */
const ENV_KRITIK: Array<[string, string]> = [
  ['NEXT_PUBLIC_SUPABASE_URL',      'Lidhja me bazen. Pa te, `/admin` ridrejton ne heshtje.'],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Sesioni server-side. Pa te, `/admin` ridrejton ne heshtje.'],
  ['NEXT_PUBLIC_SITE_URL',          'Baza e canonical/og:url dhe e sitemap-it.'],
  ['CRON_SECRET',                   'Porta e cron-eve (skadim premium, embed, indexnow). Fail-closed.'],
  ['IP_HASH_SALT',                  'Kripa e hash-it te IP-se te analitika. Pa te perdoret nje e paracaktuar publike.'],
]
const ENV_VECORI: Array<[string, string]> = [
  ['SUPABASE_SERVICE_ROLE_KEY', 'Webhook-u i pagesave dhe veprimet me privilegj.'],
  ['PAYMENT_WEBHOOK_SECRET',    'Webhook-u i pagesave. Pa te kthen 503 (fail-closed).'],
  ['NOTIFY_WEBHOOK_SECRET',     'Njoftimet nga CI. Pa te kthen 500.'],
  ['RESEND_API_KEY',            'Email rezerve (Brevo eshte paresor te edge functions).'],
  ['ADMIN_EMAIL',               'Marresi i njoftimeve te administrates.'],
  ['GROQ_API_KEY',              'Albi — modeli paresor.'],
  ['ANTHROPIC_API_KEY',         'Albi — rezerva.'],
  ['PERPLEXITY_API_KEY',        'Kerkimi me AI.'],
  ['NEXT_PUBLIC_SENTRY_DSN',    'Raportimi i gabimeve.'],
  ['SLACK_WEBHOOK_URL',         'Alarmet e monitorit.'],
  ['GOOGLE_SITE_VERIFICATION',  'Verifikimi i Search Console.'],
  ['INDEXNOW_KEY',              'IndexNow. Ka vlere te paracaktuar.'],
]

function kontrolloEnv() {
  const pa = (lista: Array<[string, string]>) =>
    lista.filter(([k]) => !(process.env[k] || '').trim()).map(([k, pse]) => ({ k, pse }))
  const mungojne_kritike = pa(ENV_KRITIK)
  const mungojne_vecori  = pa(ENV_VECORI)
  return {
    ok: mungojne_kritike.length === 0,
    kritike: { gjithsej: ENV_KRITIK.length, mungojne: mungojne_kritike },
    vecori:  { gjithsej: ENV_VECORI.length,  mungojne: mungojne_vecori },
  }
}

/*  A eshte i ndezur transkodimi i videove?
 *
 *  `getCloudinary()` te `lib/uploadImages.ts` kerkon DY celesa:
 *  `cloudinary_cloud_name` DHE `cloudinary_upload_preset`. Nese njeri mungon,
 *  transkodimi bie i fikur ne heshtje dhe pasojat i sheh vetem perdoruesi:
 *  kufiri i madhesise bie ne `video_max_mb` (50 MB) ndersa platforma premton
 *  `video_max_seconds` (5 minuta), dhe videot H.265/HEVC — formati i
 *  parazgjedhur i iPhone-it — refuzohen.
 *
 *  Matur me 31 gusht 2026: ne prodhim ka vetem `cloudinary_cloud_name`.
 *  Ky kontroll e ben gjendjen te dukshme me nje hapje faqeje, qe ndezja te jete
 *  nje celes konfigurimi dhe jo nje zbulim i rastesishem. Kurre nuk kthen vlera.
 */
async function kontrolloMedian(client: any) {
  try {
    const { data } = await client
      .from('app_config')
      .select('key,value')
      .in('key', ['cloudinary_cloud_name', 'cloudinary_upload_preset',
                  'cf_stream_customer_code', 'video_max_mb', 'video_max_seconds'])
      .abortSignal(AbortSignal.timeout(5000))
    const m: Record<string, string> = {}
    for (const r of (data ?? []) as { key: string; value: string }[]) m[r.key] = (r.value ?? '').trim()

    const cloudinary = !!(m.cloudinary_cloud_name && m.cloudinary_upload_preset)
    const stream = !!m.cf_stream_customer_code
    const transkodim = cloudinary || stream
    const mungon: string[] = []
    if (!cloudinary) {
      if (!m.cloudinary_cloud_name) mungon.push('cloudinary_cloud_name')
      if (!m.cloudinary_upload_preset) mungon.push('cloudinary_upload_preset')
    }
    return {
      ok: transkodim,
      transkodim,
      mungon,
      kufi_mb: transkodim ? 100 : Number(m.video_max_mb || 50),
      premtohen_sekonda: Number(m.video_max_seconds || 300),
      pasoja: transkodim ? null
        : 'Transkodimi eshte i fikur: kufiri i madhesise bie ne video_max_mb dhe videot HEVC refuzohen.',
    }
  } catch (e: any) {
    return { ok: false, transkodim: false, mungon: [], kufi_mb: null,
             premtohen_sekonda: null, pasoja: String(e?.message || e) }
  }
}

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

  const [db, realtime, media] = await Promise.all([
    checkDb(client),
    checkRealtime(client),
    kontrolloMedian(client),
  ])

  const env = kontrolloEnv()

  // Uptime = a sherbehet app-i realisht -> lidhet me DB-ne (bërthama e çdo faqeje).
  // Mungesa e nje variabli KRITIK nuk e rrezon uptime-in (faqja mund te sherbehet
  // ende), por raportohet qarte qe monitori dhe pronari ta shohin menjehere.
  const ok = db.ok
  const body = {
    ok,
    build: BUILD,
    at: Date.now(),
    checks: { db, realtime, env, media },
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
