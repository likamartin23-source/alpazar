// Supabase Edge Function: `email-otp`
// Gjeneron kod 6-shifror OTP (magiclink email_otp) me service_role që
// injektohet automatikisht në Edge Functions — pa varësi nga Vercel env.
// Dërgimi: Brevo (nëse `brevo_api_key` është vendosur në admin_settings —
// dërgon te KUSHDO) → ndryshe Resend (sandbox: vetëm te email-i i pronarit).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function otpHtml(code: string): string {
  return `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
    <div style="background:#111;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#F5C842;font-size:24px;letter-spacing:3px;margin:0;">ALPAZAR</h1>
    </div>
    <div style="background:#fff;border:1px solid #eee;border-top:none;padding:28px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="color:#666;font-size:14px;margin:0 0 16px;">Kodi yt i konfirmimit:</p>
      <div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#111;background:#FFFBEA;border:1px dashed #F5C842;border-radius:10px;padding:14px 0;">${esc(code)}</div>
      <p style="color:#aaa;font-size:12px;margin:18px 0 0;">Skadon për pak minuta. Nëse nuk e kërkove ti, injoroje këtë email.</p>
    </div>
  </div>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email ?? '').trim().toLowerCase()
    const mode = body.mode === 'register' ? 'register' : 'login'
    const password = typeof body.password === 'string' ? body.password : ''
    const fullName = String(body.full_name ?? '').trim().slice(0, 120)
    const age = body.age != null && body.age !== '' ? parseInt(String(body.age)) : null

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Email i pavlefshëm' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Throttle: 1 kod / 45s për email (tabelë DB, service_role only)
    const { data: thr } = await admin
      .from('otp_email_throttle').select('last_sent').eq('email', email).maybeSingle()
    if (thr?.last_sent) {
      const elapsed = Date.now() - new Date(thr.last_sent).getTime()
      if (elapsed < 45_000) {
        const wait = Math.ceil((45_000 - elapsed) / 1000)
        return json({ error: `Prit ${wait}s para se të kërkosh kod tjetër.`, retry_after: wait }, 429)
      }
    }

    if (mode === 'register') {
      if (!password || password.length < 6) {
        return json({ error: 'Fjalëkalimi duhet të paktën 6 karaktere.' }, 400)
      }
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { ...(fullName ? { full_name: fullName } : {}), ...(age ? { age } : {}) },
      }).catch(() => {})
    }

    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({ type: 'magiclink', email })
    const code = (linkData as any)?.properties?.email_otp
    if (linkErr || !code) {
      const em = (linkErr?.message ?? '').toLowerCase()
      if (mode === 'login' && (em.includes('not') || em.includes('exist') || em.includes('found'))) {
        return json({ error: 'Nuk gjetëm llogari me këtë email. Regjistrohu fillimisht.' }, 400)
      }
      return json({ error: 'Nuk u gjenerua dot kodi. Provo sërish.' }, 500)
    }

    // Çelësat e dërgimit nga admin_settings
    const { data: cfg } = await admin
      .from('admin_settings').select('key, value')
      .in('key', ['brevo_api_key', 'brevo_from_email', 'resend_api_key', 'resend_from_email'])
    const s: Record<string, string> = {}
    for (const row of (cfg ?? []) as { key: string; value: string }[]) s[row.key] = row.value ?? ''

    const subject = `${code} — Kodi yt i konfirmimit Alpazar`
    let sent = false
    let sendError = ''

    // 1) Brevo (dërgon te kushdo; 300/ditë falas)
    if (s.brevo_api_key) {
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': s.brevo_api_key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Alpazar', email: s.brevo_from_email || 'likamartin23@gmail.com' },
          to: [{ email }],
          subject,
          htmlContent: otpHtml(code),
        }),
      })
      if (r.ok || r.status === 201) sent = true
      else sendError = `brevo ${r.status}: ${(await r.text()).slice(0, 200)}`
    }

    // 2) Resend fallback
    if (!sent && s.resend_api_key) {
      const from = s.resend_from_email || 'onboarding@resend.dev'
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${s.resend_api_key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: `Alpazar <${from}>`, to: [email], subject, html: otpHtml(code) }),
      })
      if (r.ok) sent = true
      else sendError = sendError + ` | resend ${r.status}: ${(await r.text()).slice(0, 200)}`
    }

    if (!sent) {
      console.error('email-otp send failed:', sendError || 'no provider configured')
      if (!s.brevo_api_key && !s.resend_api_key) return json({ error: 'email_not_configured' }, 503)
      return json({ error: 'Dërgimi i email-it dështoi. Provo sërish pas pak.' }, 502)
    }

    await admin.from('otp_email_throttle')
      .upsert({ email, last_sent: new Date().toISOString() })

    return json({ success: true })
  } catch (e) {
    console.error('email-otp error:', e)
    return json({ error: 'Gabim i brendshëm.' }, 500)
  }
})
