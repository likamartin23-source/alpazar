import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../lib/supabase'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Stable fingerprint so the same error de-dupes instead of flooding the table.
function fingerprint(message: string, stack?: string): string {
  const firstFrame = (stack || '').split('\n').find(l => l.includes('at ')) || ''
  const basis = (message + '|' + firstFrame).slice(0, 500)
  let h = 5381
  for (let i = 0; i < basis.length; i++) h = ((h << 5) + h + basis.charCodeAt(i)) | 0
  return 'fp_' + (h >>> 0).toString(16)
}

/* ── AI diagnosis via Groq (real AI, reuses GROQ_API_KEY) ─────────────── */
async function diagnose(ev: {
  message: string; stack?: string; url?: string; source?: string
}): Promise<null | {
  severity: string; category: string; likely_cause: string
  suggested_fix: string; is_actionable: boolean
}> {
  const key = process.env.GROQ_API_KEY
  if (!key) return null
  const sys =
    'Ti je inxhinier senior që diagnostikon gabime prodhimi për ALPAZAR ' +
    '(Next.js 14 App Router + Supabase + Vercel, TypeScript). Analizo gabimin ' +
    'dhe kthe VETËM JSON sipas skemës. Ji konkret dhe teknik. Shqip te fushat tekst.'
  const user = `Gabim (${ev.source || 'client'}) te ${ev.url || 'n/a'}:
message: ${ev.message}
stack:
${(ev.stack || '').slice(0, 1500)}`
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 700,
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'diagnosis',
            schema: {
              type: 'object',
              properties: {
                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                category: { type: 'string' },
                likely_cause: { type: 'string' },
                suggested_fix: { type: 'string' },
                is_actionable: { type: 'boolean' },
              },
              required: ['severity', 'category', 'likely_cause', 'suggested_fix', 'is_actionable'],
              additionalProperties: false,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content
    if (!raw) return null
    const d = JSON.parse(raw)
    return {
      severity: String(d.severity || 'medium'),
      category: String(d.category || 'unknown').slice(0, 120),
      likely_cause: String(d.likely_cause || '').slice(0, 1000),
      suggested_fix: String(d.suggested_fix || '').slice(0, 1500),
      is_actionable: Boolean(d.is_actionable),
    }
  } catch { return null }
}

async function alertSlack(ev: any, d: any) {
  const hook = process.env.SLACK_WEBHOOK_URL
  if (!hook) return
  try {
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *Alpazar — gabim ${d.severity.toUpperCase()}* (${d.category})`,
        attachments: [{
          color: d.severity === 'critical' ? 'danger' : 'warning',
          fields: [
            { title: 'Mesazhi', value: String(ev.message).slice(0, 300), short: false },
            { title: 'URL', value: ev.url || 'n/a', short: true },
            { title: 'Shkaku i mundshëm', value: String(d.likely_cause).slice(0, 400), short: false },
            { title: 'Rregullim i propozuar', value: String(d.suggested_fix).slice(0, 500), short: false },
          ],
        }],
      }),
      signal: AbortSignal.timeout(8000),
    })
  } catch { /* alerting must never break capture */ }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`monitor:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!rl.allowed) return NextResponse.json({ ok: false }, { status: 429 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }

  const message = String(body?.message ?? '').trim().slice(0, 2000)
  if (!message) return NextResponse.json({ ok: false }, { status: 400 })
  const ev = {
    message,
    stack: body?.stack ? String(body.stack).slice(0, 6000) : null,
    url: body?.url ? String(body.url).slice(0, 500) : null,
    source: ['client', 'server', 'boundary', 'route'].includes(body?.source) ? body.source : 'client',
    level: body?.level === 'warning' ? 'warning' : 'error',
    user_agent: (req.headers.get('user-agent') || '').slice(0, 300),
  }
  const fp = fingerprint(ev.message, ev.stack || undefined)

  try {
    const admin = getSupabaseAdmin()
    const { data: existing } = await admin
      .from('health_events').select('id, count').eq('fingerprint', fp).maybeSingle()

    if (existing) {
      // Known error → just bump the counter (no repeat AI cost / alert spam).
      await admin.from('health_events')
        .update({ count: (existing as any).count + 1, last_seen_at: new Date().toISOString() } as never)
        .eq('id', (existing as any).id)
      return NextResponse.json({ ok: true, deduped: true })
    }

    // New error → store, then diagnose with AI and alert if serious.
    const { data: inserted } = await admin
      .from('health_events')
      .insert({ ...ev, fingerprint: fp } as never)
      .select('id').single()

    const id = (inserted as any)?.id
    if (id && ev.level === 'error') {
      const d = await diagnose(ev)
      if (d) {
        await admin.from('health_events').update({
          severity: d.severity, category: d.category, likely_cause: d.likely_cause,
          suggested_fix: d.suggested_fix, is_actionable: d.is_actionable, status: 'triaged',
        } as never).eq('id', id)
        if (d.severity === 'critical' || d.severity === 'high') await alertSlack(ev, d)
      }
    }
    return NextResponse.json({ ok: true })
  } catch {
    // Monitoring must never surface its own failure to the app.
    return NextResponse.json({ ok: true, stored: false })
  }
}

// Admin-only: list recent AI-triaged events (powers an admin health view).
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Jo i autorizuar' }, { status: 401 })
  try {
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON)
    const { data: { user } } = await anon.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Jo i autorizuar' }, { status: 401 })
    const { data: profile } = await anon.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Jo i autorizuar' }, { status: 403 })

    const admin = getSupabaseAdmin()
    const { data } = await admin.from('health_events')
      .select('*').order('last_seen_at', { ascending: false }).limit(100)
    return NextResponse.json({ events: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Gabim' }, { status: 500 })
  }
}
