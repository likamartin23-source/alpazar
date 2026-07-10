import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NOTIFY_SECRET = process.env.NOTIFY_WEBHOOK_SECRET
const NOTIFY_EMAIL  = process.env.ADMIN_EMAIL || ''

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

// Accepts Slack Incoming Webhook format — used by GitHub Actions CI
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`notify:${ip}`, { limit: 10, windowMs: 5 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  if (!NOTIFY_SECRET) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }
  // Sekreti preferohet nga header 'x-notify-secret' (s'shfaqet në access-logs si
  // query-param); query '?s=' mbahet për pajtueshmëri me thirrësit ekzistues.
  // Krahasim timing-safe.
  const secret = req.headers.get('x-notify-secret') || req.nextUrl.searchParams.get('s') || ''
  const a = Buffer.from(secret)
  const b = Buffer.from(NOTIFY_SECRET)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any = {}
  try { body = await req.json() } catch { /* ignore */ }

  const text = String(body.text || '').slice(0, 1000)
  const attachments: any[] = Array.isArray(body.attachments) ? body.attachments : []

  const color   = attachments[0]?.color === 'good' ? '#22c55e' : attachments[0]?.color === 'danger' ? '#E63312' : '#F5C842'
  const emoji   = attachments[0]?.color === 'good' ? '✅' : attachments[0]?.color === 'danger' ? '❌' : '🔔'
  const subject = `${emoji} Alpazar CI — ${text.split('.')[0].slice(0, 80)}`

  const fieldsHtml = (attachments[0]?.fields || [])
    .map((f: any) => `<tr><td style="color:#888;padding:4px 8px;white-space:nowrap;">${f.title}</td><td style="padding:4px 8px;font-weight:600;">${f.value}</td></tr>`)
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;">
      <div style="background:#111;padding:16px 20px;border-radius:10px 10px 0 0;display:flex;align-items:center;gap:10px;">
        <span style="font-size:22px;">${emoji}</span>
        <h2 style="color:#F5C842;margin:0;font-size:16px;letter-spacing:2px;">ALPAZAR CI</h2>
      </div>
      <div style="background:#fff;border:1px solid #eee;border-top:none;padding:20px;border-radius:0 0 10px 10px;">
        <p style="margin:0 0 16px;font-size:15px;color:#111;">${text}</p>
        ${fieldsHtml ? `<table style="border-collapse:collapse;width:100%;font-size:13px;">${fieldsHtml}</table>` : ''}
        <div style="margin-top:16px;padding:10px 14px;border-left:4px solid ${color};background:#f9f9f9;border-radius:4px;font-size:12px;color:#555;">
          Ky njoftim u dërgua automatikisht nga GitHub Actions CI/CD pipeline i Alpazar.
        </div>
      </div>
    </div>`

  const resend = getResend()
  if (resend) {
    await resend.emails.send({
      from: 'Alpazar CI <onboarding@resend.dev>',
      to: NOTIFY_EMAIL,
      subject,
      html,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
