import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// verify-otp — GARANCI SHUMËSHTRESORE (26 gusht 2026)
// Qëllimi: pas konfirmimit të kodit, platforma NJEH GJITHMONË përdoruesin, për çdo
// klient, nga e gjithë bota. Asnjë rrugë pa krye. Shkaku i mëparshëm: createUser me
// `phone`/`phone_confirm` dështonte kur provideri i telefonit në GoTrue është OFF
// ("Phone signups are disabled") → llogaria s'lindte kurrë ndonëse SMS-ja mbërrinte.
//
// Mbrojtjet:
//  1) createUser vetëm-email (synthEmail <numri>@sms.al) — i pavarur nga provideri i tel.
//  2) Riprovim i createUser për gabime kalimtare.
//  3) Vetë-shërim: nëse llogaria ekziston (kodi = provë zotërimi) → hyrje; jetim → riparim.
//  4) ensureProfile: profili UPSERT-ohet gjithmonë (s'mbështetemi te trigeri që gëlltit gabime).
//  5) sessionFor me riprovim.
//  6) Ndërkombëtar: çdo numër me +prefiks nga bota (phoneRaw = shifrat pas +).
// ─────────────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

async function hashCode(code: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: { identifier?: string; code?: string; mode?: string; firstName?: string; lastName?: string; age?: number; referredBy?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { identifier, code, mode, firstName, lastName, age, referredBy } = body;
  if (!identifier || !code || !mode) return json({ error: 'Missing required fields' }, 400);
  if (!/^\d{6}$/.test(code)) return json({ error: 'Kodi duhet të jetë 6 shifra' });

  // ── 1. Verifiko kodin ──────────────────────────────────────────────────────
  const { data: otpRow, error: otpErr } = await admin
    .from('otp_codes')
    .select('*')
    .eq('identifier', identifier)
    .eq('consumed', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpErr || !otpRow) {
    return json({ error: 'Kodi nuk u gjet ose ka skaduar. Ridërgo kodin.' });
  }

  if (otpRow.locked_until && new Date(otpRow.locked_until) > new Date()) {
    const sec = Math.ceil((new Date(otpRow.locked_until).getTime() - Date.now()) / 1000);
    return json({ error: `Shumë tentativa. Provo sërish pas ${sec} sekondave.` });
  }

  if (new Date(otpRow.expires_at) < new Date()) {
    return json({ error: 'Kodi ka skaduar! Klikoje "Ridërgo" për kod të ri.' });
  }

  const inputHash = await hashCode(code);
  if (inputHash !== otpRow.code_hash) {
    const attempts = (otpRow.attempts ?? 0) + 1;
    const upd: Record<string, unknown> = { attempts };
    if (attempts >= 5) upd.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await admin.from('otp_codes').update(upd).eq('id', otpRow.id);
    const rem = Math.max(0, 5 - attempts);
    return json({ error: `Kodi i gabuar!${rem > 0 ? ` ${rem} tentativa mbeten.` : ' Ridërgoni kodin.'}` });
  }

  await admin.from('otp_codes').update({ consumed: true }).eq('id', otpRow.id);

  // ── 2. Identiteti (ndërkombëtar) ────────────────────────────────────────────
  const isPhone      = identifier.startsWith('+');
  const phoneRaw     = isPhone ? identifier.slice(1) : null;   // shifrat pas + (çdo shtet)
  const phoneE164    = isPhone ? identifier : null;
  const synthEmail   = phoneRaw ? `${phoneRaw}@sms.al` : identifier;
  const fullName     = [firstName, lastName].filter(Boolean).join(' ') || undefined;

  async function findUserId(): Promise<string | null> {
    // SCALE-PROOF (miliona përdorues): kërkim O(1) nga email-i kanonik.
    // auth.users.email është UNIK + i indeksuar; për telefon email-i = <numri>@sms.al.
    // Zëvendëson paginimin listUsers (që kishte tavan 5000 → njohja dështonte mbi të).
    try {
      const { data: uid } = await admin.rpc('auth_user_id_by_email', { p_email: synthEmail });
      if (uid) return uid as string;
    } catch (e) { console.error('auth_user_id_by_email rpc error:', e); }
    // Fallback për telefon (raste legacy): profiles.phone (indeks unik).
    if (isPhone) {
      const { data: p1 } = await admin.from('profiles').select('id').eq('phone', phoneE164).maybeSingle();
      if (p1?.id) return p1.id;
      const { data: p2 } = await admin.from('profiles').select('id').eq('phone', phoneRaw).maybeSingle();
      if (p2?.id) return p2.id;
    }
    return null;
  }

  // GARANCI: profili ekziston GJITHMONË (s'mbështetemi te trigeri handle_new_user që
  // i gëlltit gabimet në heshtje). Kjo është thelbi i "platforma njeh gjithmonë përdoruesin".
  async function ensureProfile(uid: string, withData: boolean) {
    const row: Record<string, unknown> = { id: uid };
    if (withData) {
      if (fullName)   row.full_name  = fullName;
      if (phoneE164)  row.phone      = phoneE164;
      if (age)        row.age        = typeof age === 'number' ? age : parseInt(String(age));
      if (referredBy) row.referred_by = referredBy;
    }
    // upsert idempotent: krijon nëse mungon, plotëson fushat kur kemi të dhëna të reja.
    const { error } = await admin.from('profiles').upsert(row, { onConflict: 'id' });
    if (error) console.error('ensureProfile error:', error);
  }

  // Krijon sesion me metodë universale: generateLink (magiclink) -> /auth/v1/verify.
  // Me riprovim — sesioni s'duhet të dështojë nga një gabim kalimtar.
  async function sessionFor(userId: string): Promise<{ access_token: string; refresh_token: string } | { error: string }> {
    let lastErr = 'unknown';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await admin.auth.admin.updateUserById(userId, { email_confirm: true });

        const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: synthEmail,
        });
        const tokenHash = linkData?.properties?.hashed_token;
        if (linkErr || !tokenHash) { lastErr = 'link'; console.error('generateLink error:', linkErr); await sleep(250); continue; }

        const vres = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
          body:    JSON.stringify({ type: 'magiclink', token_hash: tokenHash }),
        });
        if (!vres.ok) { lastErr = 'verify'; const txt = await vres.text().catch(() => ''); console.error('verify error:', vres.status, txt); await sleep(250); continue; }

        const s = await vres.json();
        if (!s.access_token || !s.refresh_token) { lastErr = 'tokens'; console.error('verify no tokens:', s); await sleep(250); continue; }
        return { access_token: s.access_token, refresh_token: s.refresh_token };
      } catch (err) {
        lastErr = 'exception'; console.error('sessionFor exception:', err); await sleep(250);
      }
    }
    return { error: `Gabim gjatë krijimit të sesionit (${lastErr}). Provo sërish.` };
  }

  // ── 3. REGISTER — krijim i garantuar ────────────────────────────────────────
  if (mode === 'register') {
    // Vetë-shërim: nëse llogaria ekziston tashmë, kodi vërteton zotërimin e numrit/email-it
    // → hyrje (jo rrugë pa krye "already registered"). Kjo është identike me rikuperimin me SMS.
    let uid = await findUserId();

    if (!uid) {
      for (let attempt = 0; attempt < 2 && !uid; attempt++) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email:         synthEmail,   // pa `phone`/`phone_confirm` — i pavarur nga provideri i tel.
          email_confirm: true,
          user_metadata: {
            full_name:  fullName,
            first_name: firstName ?? '',
            last_name:  lastName  ?? '',
            age:        age ?? null,
          },
        });
        if (created?.user) { uid = created.user.id; break; }

        const em = (createErr?.message || '').toLowerCase();
        // Garë/dublikatë: dikush u krijua ndërkohë → gjeje dhe hyr.
        if (em.includes('already') || em.includes('registered') || em.includes('exist') || em.includes('duplicate')) {
          uid = await findUserId();
          break;
        }
        console.error(`createUser attempt ${attempt} error:`, createErr);
        await sleep(300);
      }
    }

    if (!uid) return json({ error: 'S’u krijua llogaria për momentin. Provo sërish pas pak.' });

    await ensureProfile(uid, true);
    const result = await sessionFor(uid);
    return json(result);
  }

  // ── 4. FORGOT + LOGIN ───────────────────────────────────────────────────────
  // KUFI I SIGURISË (urdhër pronari, 26 gusht 2026): Rikthimi/Hyrja NUK krijojnë KURRË
  // llogari të re. Hyrja në llogari kërkon që llogaria të EKZISTOJË — përndryshe do të
  // hapej një rrugë e re hyrjeje e pamiratuar dhe do cenoheshin të drejtat e aksesit.
  // Krijimi bëhet VETËM te "Regjistrohu". Nëse llogaria nuk gjendet → mesazh i qartë që
  // udhëzon drejt regjistrimit (klienti shfaq linkun "Nuk ke llogari? Regjistrohu →").
  {
    const existingId = await findUserId();
    if (!existingId) {
      return json({ error: mode === 'forgot'
        ? 'Ky email/numër telefoni nuk është i regjistruar. Regjistrohu fillimisht.'
        : 'Ky numër/email nuk është i regjistruar. Regjistrohu fillimisht.' });
    }
    await ensureProfile(existingId, false); // vetë-shërim i profilit jetim (llogari EKZISTUESE)
    const result = await sessionFor(existingId);
    return json(result);
  }
});
