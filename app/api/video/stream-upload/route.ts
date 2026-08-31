import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '../../../../lib/rateLimit'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Krijon një "direct creator upload" te Cloudflare Stream (tus) dhe kthen URL-në një-përdorimëshe
// që klienti ngarkon drejtpërdrejt (skedari S'kalon nga serveri ynë). Çelësi rri VETËM në server
// (admin_settings, RLS config.write) — kurrë te klienti. Kur s'është konfiguruar → 501, klienti bie
// te ruajtja standarde. Cloudflare e shndërron çdo kodek (edhe H.265) në H.264 që luhet kudo.
async function getCfConfig(): Promise<{ accountId: string; token: string } | null> {
  try {
    const admin = getSupabaseAdmin()
    const { data } = await admin.from('admin_settings').select('key,value').in('key', ['cf_account_id', 'cf_stream_token'])
    const m: Record<string, string> = {}
    for (const r of (data ?? []) as { key: string; value: string }[]) m[r.key] = (r.value ?? '').trim()
    return (m.cf_account_id && m.cf_stream_token) ? { accountId: m.cf_account_id, token: m.cf_stream_token } : null
  } catch { return null }
}

function b64(s: string): string { return Buffer.from(s, 'utf-8').toString('base64') }

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`stream:${ip}`, { limit: 12, windowMs: 60_000 })
  if (!rl.allowed) return NextResponse.json({ error: 'Shumë kërkesa. Provo pas pak.' }, { status: 429 })

  const cfg = await getCfConfig()
  if (!cfg) return NextResponse.json({ error: 'stream_off' }, { status: 501 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Kërkesë e pavlefshme.' }, { status: 400 }) }

  const size = Number(body?.size)
  if (!Number.isFinite(size) || size <= 0 || size > 2 * 1024 * 1024 * 1024)
    return NextResponse.json({ error: 'Madhësi e pavlefshme.' }, { status: 400 })
  // maxDurationSeconds kërkohet nga Cloudflare për direct creator uploads (1..21600).
  const maxSec = Math.min(Math.max(parseInt(String(body?.maxSeconds ?? '600'), 10) || 600, 1), 21600)
  const name = typeof body?.name === 'string' ? body.name.slice(0, 120) : 'video'

  try {
    const meta = `maxDurationSeconds ${b64(String(maxSec))},name ${b64(name)}`
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfg.accountId}/stream?direct_user=true`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(Math.round(size)),
        'Upload-Metadata': meta,
      },
    })
    if (res.status !== 201) {
      const txt = await res.text().catch(() => '')
      console.error('CF Stream create failed:', res.status, txt.slice(0, 300))
      return NextResponse.json({ error: 'stream_create_' + res.status }, { status: 502 })
    }
    let location = res.headers.get('Location') || res.headers.get('location') || ''
    const uid = res.headers.get('stream-media-id') || ''
    if (!location || !uid) return NextResponse.json({ error: 'stream_no_location' }, { status: 502 })
    return NextResponse.json({ uploadURL: location, uid })
  } catch (e: any) {
    console.error('CF Stream error:', e?.message ?? e)
    return NextResponse.json({ error: 'stream_error' }, { status: 502 })
  }
}
