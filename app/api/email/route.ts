import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Lazy init — nuk instancohet gjatë build time
function resend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

const FROM = 'Alpazar <noreply@alpazar.al>'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body
    const r = resend()

    if (type === 'contact') {
      const { name, email, subject, message } = body
      if (!name || !email || !message) {
        return NextResponse.json({ error: 'Fushat e detyrueshme mungojnë' }, { status: 400 })
      }

      const { data, error } = await r.emails.send({
        from: FROM,
        to: ['info@alpazar.al'],
        replyTo: email,
        subject: subject || `Mesazh nga ${name} - Alpazar`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <div style="background:#F5C842;padding:16px 20px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:20px;color:#111;">📬 Mesazh i ri nga Alpazar</h1>
            </div>
            <div style="background:#fff;border:1px solid #eee;border-top:none;padding:20px;border-radius:0 0 12px 12px;">
              <p><strong>Emri:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Subjekti:</strong> ${subject || '—'}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
              <p style="white-space:pre-wrap;">${message}</p>
            </div>
            <p style="font-size:11px;color:#aaa;margin-top:12px;text-align:center;">
              Alpazar · Platformë e shpalljeve në Shqipëri
            </p>
          </div>`,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: data?.id })
    }

    if (type === 'welcome') {
      const { email: to, name } = body
      if (!to) return NextResponse.json({ error: 'Email mungon' }, { status: 400 })

      const { data, error } = await r.emails.send({
        from: FROM,
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
              <h2 style="color:#111;font-size:22px;margin-bottom:8px;">Mirë se erdhe${name ? `, ${name}` : ''}!</h2>
              <p style="color:#666;font-size:14px;line-height:1.7;margin-bottom:24px;">
                Llogaria jote te Alpazar është krijuar me sukses.<br>
                Tani mund të postosh shpallje, të kontaktosh shitësit dhe të gjesh gjithçka ke nevojë.
              </p>
              <a href="https://alpazar.al" style="background:#E63312;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
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

    if (type === 'notification') {
      const { to, subject, html } = body
      if (!to || !subject || !html) {
        return NextResponse.json({ error: 'Fushat e detyrueshme mungojnë' }, { status: 400 })
      }
      const { data, error } = await r.emails.send({ from: FROM, to, subject, html })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: data?.id })
    }

    return NextResponse.json({ error: 'Tip i panjohur emaili' }, { status: 400 })
  } catch (err: any) {
    console.error('Email API error:', err)
    return NextResponse.json({ error: 'Gabim i brendshëm i serverit' }, { status: 500 })
  }
}
