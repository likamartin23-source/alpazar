import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../lib/supabase'

/** Escape HTML entities — prevents injection in email bodies */
function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function getResend(): Promise<{ client: Resend; from: string } | null> {
  let apiKey = process.env.RESEND_API_KEY || ''
  let fromEmail = 'onboarding@resend.dev'

  if (!apiKey) {
    try {
      // Use service role so anon key cannot reach admin_settings
      const db = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data } = await db
        .from('admin_settings')
        .select('key, value')
        .in('key', ['resend_api_key', 'resend_from_email'])
      if (data) {
        for (const row of data) {
          if (row.key === 'resend_api_key')    apiKey    = row.value
          if (row.key === 'resend_from_email') fromEmail = row.value
        }
      }
    } catch { /* vazhdo */ }
  }

  if (!apiKey) return null
  return { client: new Resend(apiKey), from: `Alpazar <${fromEmail}>` }
}

/** Verify the request has a valid admin session */
async function requireAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return false

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_ANON)
    const { data: { user }, error } = await db.auth.getUser(token)
    if (error || !user) return false
    const { data: profile } = await db
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    return profile?.is_admin === true
  } catch { return false }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  try {
    const body = await req.json()
    const { type } = body

    // ── contact: 5 per 10 minutes per IP ────────────────────────────────
    if (type === 'contact') {
      const rl = rateLimit(`email:contact:${ip}`, { limit: 5, windowMs: 10 * 60_000 })
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Shumë kërkesa. Provo sërisht pas pak minutash.' },
          { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
        )
      }

      const name    = String(body.name    ?? '').trim().slice(0, 200)
      const email   = String(body.email   ?? '').trim().slice(0, 200)
      const subject = String(body.subject ?? '').trim().slice(0, 300)
      const message = String(body.message ?? '').trim().slice(0, 5000)

      if (!name || !email || !message) {
        return NextResponse.json({ error: 'Fushat e detyrueshme mungojnë' }, { status: 400 })
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Email i pavlefshëm' }, { status: 400 })
      }

      const r = await getResend()
      if (!r) return NextResponse.json({ error: 'Email nuk është konfiguruar' }, { status: 503 })

      const { data, error } = await r.client.emails.send({
        from: r.from,
        to: [process.env.ADMIN_EMAIL || ''],
        replyTo: email,
        subject: subject ? `[Kontakt] ${esc(subject)}` : `Mesazh nga ${esc(name)} - Alpazar`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <div style="background:#F5C842;padding:16px 20px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:20px;color:#111;">📬 Mesazh i ri nga Alpazar</h1>
            </div>
            <div style="background:#fff;border:1px solid #eee;border-top:none;padding:20px;border-radius:0 0 12px 12px;">
              <p><strong>Emri:</strong> ${esc(name)}</p>
              <p><strong>Email:</strong> ${esc(email)}</p>
              <p><strong>Subjekti:</strong> ${esc(subject) || '—'}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
              <p style="white-space:pre-wrap;">${esc(message)}</p>
            </div>
            <p style="font-size:11px;color:#aaa;margin-top:12px;text-align:center;">
              Alpazar · Platformë e shpalljeve në Shqipëri
            </p>
          </div>`,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: data?.id })
    }

    // ── welcome: authenticated users only — 10 per minute per IP ──────────
    if (type === 'welcome') {
      // Require a valid session — prevents spamming arbitrary recipients
      const authHeader = req.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
      if (!token) {
        return NextResponse.json({ error: 'Jo i autorizuar' }, { status: 401 })
      }
      const anonDb = createClient(SUPABASE_URL, SUPABASE_ANON)
      const { data: { user: authUser }, error: authErr } = await anonDb.auth.getUser(token)
      if (authErr || !authUser?.email) {
        return NextResponse.json({ error: 'Sesion i pavlefshëm' }, { status: 401 })
      }

      const rl = rateLimit(`email:welcome:${ip}`, { limit: 10, windowMs: 60_000 })
      if (!rl.allowed) return NextResponse.json({ error: 'Shumë kërkesa.' }, { status: 429 })
      const rlUser = rateLimit(`email:welcome:user:${authUser.id}`, { limit: 2, windowMs: 24 * 60 * 60_000 })
      if (!rlUser.allowed) return NextResponse.json({ error: 'Shumë kërkesa.' }, { status: 429 })

      // Always send to the authenticated user's own email — never arbitrary targets
      const to   = authUser.email
      const name = String(body.name ?? '').trim().slice(0, 200)

      const r = await getResend()
      if (!r) return NextResponse.json({ error: 'Email nuk është konfiguruar' }, { status: 503 })

      const { data, error } = await r.client.emails.send({
        from: r.from,
        to,
        subject: '🎉 Mirë se erdhe te Alpazar!',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <div style="background:#111;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#F5C842;font-size:28px;letter-spacing:3px;margin:0;">ALPAZAR</h1>
              <p style="color:#888;margin:8px 0 0;font-size:14px;">Platformë e shpalljeve në Shqipëri</p>
            </div>
            <div style="background:#fff;border:1px solid #eee;border-top:none;padding:28px;border-radius:0 0 12px 12px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">🎉</div>
              <h2 style="color:#111;font-size:22px;margin-bottom:8px;">Mirë se erdhe${name ? `, ${esc(name)}` : ''}!</h2>
              <p style="color:#666;font-size:14px;line-height:1.7;margin-bottom:24px;">
                Llogaria jote te Alpazar është krijuar me sukses.<br>
                Tani mund të postosh shpallje, të kontaktosh shitësit dhe të gjesh gjithçka ke nevojë.
              </p>
              <a href="https://alpazar.vercel.app" style="background:#E63312;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
                Hap Alpazar →
              </a>
              <p style="color:#aaa;font-size:12px;margin-top:24px;">
                Nëse nuk e krijove ti këtë llogari, mund ta injorosh këtë email.
              </p>
            </div>
          </div>`,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: data?.id })
    }

    // ── notification: ADMIN ONLY — 20 per minute ────────────────────────
    if (type === 'notification') {
      const isAdmin = await requireAdmin(req)
      if (!isAdmin) {
        return NextResponse.json({ error: 'Jo i autorizuar' }, { status: 403 })
      }

      const rl = rateLimit(`email:notif:${ip}`, { limit: 20, windowMs: 60_000 })
      if (!rl.allowed) {
        return NextResponse.json({ error: 'Shumë kërkesa.' }, { status: 429 })
      }

      const to      = String(body.to      ?? '').trim()
      const subject = String(body.subject ?? '').trim().slice(0, 500)
      const html    = String(body.html    ?? '').trim()

      if (!to || !subject || !html) {
        return NextResponse.json({ error: 'Fushat e detyrueshme mungojnë' }, { status: 400 })
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return NextResponse.json({ error: 'Email destinacion i pavlefshëm' }, { status: 400 })
      }
      if (html.length > 50_000) {
        return NextResponse.json({ error: 'HTML shumë i gjatë' }, { status: 400 })
      }

      const r = await getResend()
      if (!r) return NextResponse.json({ error: 'Email nuk është konfiguruar' }, { status: 503 })

      const { data, error } = await r.client.emails.send({ from: r.from, to, subject, html })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: data?.id })
    }

    return NextResponse.json({ error: 'Tip i panjohur emaili' }, { status: 400 })

  } catch (err: any) {
    console.error('Email API error:', err)
    return NextResponse.json({ error: 'Gabim i brendshëm i serverit' }, { status: 500 })
  }
}
