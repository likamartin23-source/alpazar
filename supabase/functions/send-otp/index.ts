import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// send-otp — me MBROJTJE ANTI-ABUZIM (26 gusht 2026, gjetja K1 e auditit)
// Përpara: s'kishte asnjë throttle → kushdo mund të bombardonte një numër me SMS
// (kosto + bezdi) ose të digjte kuotën Brevo. Tani:
//   • Cooldown per-identifier (nderon app_config.otp_resend_cooldown_s, default 60s).
//   • Dritare per-IP (max IP_MAX kërkesa / IP_WINDOW_MIN minuta).
//   • 429 me mesazh të qartë; regjistrim te otp_send_throttle (RLS-deny, service_role).
// ─────────────────────────────────────────────────────────────────────────────

const OTP_SECONDS = 120; // NDRYSHO KURRË
const IP_MAX = 10;         // kërkesa max për IP brenda dritares
const IP_WINDOW_MIN = 60;  // gjatësia e dritares (minuta)

function generateOtp(): string {
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b % 10).join('');
}

async function hashCode(code: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase     = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: { identifier?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { identifier, mode } = body;
  if (!identifier) return json({ error: 'Missing identifier' }, 400);

  const isPhone = identifier.startsWith('+') || /^00\d{9,}$/.test(identifier);
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();

  // ── ANTI-ABUZIM (K1) ────────────────────────────────────────────────────────
  // Cooldown-i i konfigurueshëm nga app_config (publik, pa sekret).
  let cooldown = 60;
  try {
    const { data: ac } = await supabase.from('app_config').select('value').eq('key', 'otp_resend_cooldown_s').maybeSingle();
    const parsed = parseInt(ac?.value ?? '');
    if (Number.isFinite(parsed) && parsed > 0) cooldown = parsed;
  } catch { /* default 60 */ }

  // 1) Cooldown per-identifier — nuk lejohet kod i ri para se të kalojë cooldown-i.
  try {
    const { data: idRow } = await supabase.from('otp_send_throttle').select('last_sent').eq('k', `id:${identifier}`).maybeSingle();
    if (idRow?.last_sent) {
      const elapsed = (now - new Date(idRow.last_sent).getTime()) / 1000;
      if (elapsed < cooldown) {
        const wait = Math.ceil(cooldown - elapsed);
        return json({ error: `Prit ${wait}s para se të kërkosh një kod tjetër.`, retry_after: wait }, 429);
      }
    }
  } catch { /* fail-open në lexim; regjistrimi më poshtë mbetet mbrojtja */ }

  // 2) Dritare per-IP — kufizon bombardimin e shumë numrave nga një burim (bot/AI-scraper).
  let ipCount = 1;
  let ipWindowStart = new Date(now).toISOString();
  try {
    const { data: ipRow } = await supabase.from('otp_send_throttle').select('count, window_start').eq('k', `ip:${ip}`).maybeSingle();
    if (ipRow?.window_start) {
      const age = now - new Date(ipRow.window_start).getTime();
      if (age < IP_WINDOW_MIN * 60 * 1000) {
        ipCount = (ipRow.count ?? 0) + 1;
        ipWindowStart = ipRow.window_start;
        if (ipCount > IP_MAX) {
          return json({ error: 'Shumë kërkesa nga kjo pajisje. Provo më vonë.', retry_after: 600 }, 429);
        }
      }
    }
  } catch { /* fail-open në lexim */ }

  // Regjistro menjëherë (para dërgimit) që edhe dështimet/të ngadaltat të mos anashkalojnë limitin.
  const nowIso = new Date(now).toISOString();
  try {
    await supabase.from('otp_send_throttle').upsert({ k: `id:${identifier}`, last_sent: nowIso }, { onConflict: 'k' });
    await supabase.from('otp_send_throttle').upsert({ k: `ip:${ip}`, last_sent: nowIso, count: ipCount, window_start: ipWindowStart }, { onConflict: 'k' });
  } catch (e) { console.error('throttle upsert error:', e); }

  // ── Gjenero + ruaj OTP ──────────────────────────────────────────────────────
  const code     = generateOtp();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(now + OTP_SECONDS * 1000).toISOString();

  await supabase.from('otp_codes').delete().eq('identifier', identifier).eq('consumed', false);

  const { error: insertErr } = await supabase.from('otp_codes').insert({
    identifier,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (insertErr) {
    console.error('OTP insert error:', insertErr);
    return json({ error: 'database_error' }, 500);
  }

  const { data: rows } = await supabase.from('admin_settings').select('key, value');
  const cfg: Record<string, string> = {};
  for (const r of rows ?? []) cfg[r.key] = r.value;

  // ── PHONE → SMS via sms-gate.app ──
  if (isPhone) {
    const smsUrl   = (cfg['sms_gateway_url']     || Deno.env.get('SMS_GATEWAY_URL')      || '').trim();
    const smsLogin = (cfg['sms_gateway_login']    || Deno.env.get('SMS_GATEWAY_LOGIN')    || 'ONL3QR').trim();
    const smsPass  = (cfg['sms_gateway_password'] || Deno.env.get('SMS_GATEWAY_PASSWORD') || '').trim();

    if (!smsUrl || !smsPass) {
      console.warn('SMS gateway not configured');
      return json({ error: 'sms_not_configured' });
    }

    const message = `Kodi juaj Alpazar: ${code}. Skadon pas 2 minutave.`;
    const auth    = btoa(`${smsLogin}:${smsPass}`);

    try {
      const res = await fetch(`${smsUrl}/3rdparty/v1/message`, {
        method:  'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message, phoneNumbers: [identifier] }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('SMS gateway error:', res.status, txt);
        return json({ error: 'sms_not_configured' });
      }
      return json({ success: true, method: 'sms' });
    } catch (err) {
      console.error('SMS fetch exception:', err);
      return json({ error: 'sms_not_configured' });
    }
  }

  // ── EMAIL ──
  const actionText = mode === 'forgot'
    ? 'rivendosni fjalëkalimin'
    : mode === 'register'
      ? 'konfirmoni regjistrimin'
      : 'hyni në llogarinë tuaj';

  const subject = mode === 'forgot'
    ? `${code} — Rivendos fjalëkalimin Alpazar`
    : `${code} — Konfirmo llogarinë Alpazar`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#111;font-size:20px;margin-bottom:8px;">Kodi juaj Alpazar</h2>
      <p style="color:#555;font-size:14px;margin-bottom:20px;">Përdorni kodin e mëposhtëm për të ${actionText}:</p>
      <div style="background:#FFFBEA;border:2px solid #F5C842;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
        <span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#E63312;font-variant-numeric:tabular-nums;">${code}</span>
      </div>
      <p style="color:#888;font-size:12px;">Ky kod skadon pas <strong>2 minutave</strong>. Mos e ndani me askënd.</p>
    </div>`;

  const brevoKey  = (cfg['brevo_api_key']    || Deno.env.get('BREVO_API_KEY')    || '').trim();
  const brevoFrom = (cfg['brevo_from_email'] || Deno.env.get('BREVO_FROM_EMAIL') || '').trim();

  // PRIMËR: Brevo (dërgon te kushdo, pa verifikim domaini)
  if (brevoKey && brevoFrom) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify({
          sender: { name: 'Alpazar', email: brevoFrom },
          to:     [{ email: identifier }],
          subject,
          htmlContent: html,
        }),
      });
      if (res.ok) {
        return json({ success: true, method: 'email' });
      }
      const txt = await res.text().catch(() => '');
      console.error('Brevo error:', res.status, txt);
    } catch (err) {
      console.error('Brevo fetch exception:', err);
    }
  }

  // REZERVË: Resend (vetëm te pronari në test-mode)
  const resendKey  = (cfg['resend_api_key']    || Deno.env.get('RESEND_API_KEY')    || '').trim();
  const resendFrom = (cfg['resend_from_email'] || Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev').trim();
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ from: resendFrom, to: [identifier], subject, html }),
      });
      if (res.ok) {
        return json({ success: true, method: 'email' });
      }
      const txt = await res.text().catch(() => '');
      console.error('Resend error:', res.status, txt);
      if (res.status === 403 || res.status === 422 ||
          txt.includes('testing') || txt.includes('domain') || txt.includes('validation_error')) {
        return json({ error: 'email_not_configured' });
      }
      return json({ error: 'email_send_failed' });
    } catch (err) {
      console.error('Resend fetch exception:', err);
    }
  }

  return json({ error: 'email_not_configured' });
});
