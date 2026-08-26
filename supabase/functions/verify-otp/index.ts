import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

  const isPhone      = identifier.startsWith('+');
  const phoneRaw     = isPhone ? identifier.slice(1) : null;
  const phoneE164    = isPhone ? identifier : null;
  const synthEmail   = phoneRaw ? `${phoneRaw}@sms.al` : identifier;

  async function findUserId(): Promise<string | null> {
    if (isPhone) {
      const { data: p1 } = await admin.from('profiles').select('id').eq('phone', phoneE164).maybeSingle();
      if (p1?.id) return p1.id;
      const { data: p2 } = await admin.from('profiles').select('id').eq('phone', phoneRaw).maybeSingle();
      if (p2?.id) return p2.id;
    }
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 });
    const found = list?.users?.find(u => u.email === synthEmail || u.email === identifier);
    return found?.id ?? null;
  }

  // Krijon sesion me metodë universale: generateLink (magiclink) -> /auth/v1/verify me token_hash.
  // Zevendëson admin.createSession që s'mbështetet nga ky version GoTrue (shkaktonte 500).
  async function sessionFor(userId: string): Promise<{ access_token: string; refresh_token: string } | { error: string }> {
    try {
      await admin.auth.admin.updateUserById(userId, { email_confirm: true });

      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: synthEmail,
      });
      const tokenHash = linkData?.properties?.hashed_token;
      if (linkErr || !tokenHash) {
        console.error('generateLink error:', linkErr);
        return { error: 'Gabim gjatë krijimit të sesionit (link).' };
      }

      const vres = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
        body:    JSON.stringify({ type: 'magiclink', token_hash: tokenHash }),
      });
      if (!vres.ok) {
        const txt = await vres.text().catch(() => '');
        console.error('verify error:', vres.status, txt);
        return { error: 'Gabim gjatë krijimit të sesionit (verify).' };
      }
      const s = await vres.json();
      if (!s.access_token || !s.refresh_token) {
        console.error('verify no tokens:', s);
        return { error: 'Gabim gjatë krijimit të sesionit (tokens).' };
      }
      return { access_token: s.access_token, refresh_token: s.refresh_token };
    } catch (err) {
      console.error('sessionFor exception:', err);
      return { error: 'Gabim i brendshëm gjatë sesionit.' };
    }
  }

  // REGISTER
  if (mode === 'register') {
    const existingId = await findUserId();
    if (existingId) return json({ error: 'already registered' });

    const fullName = [firstName, lastName].filter(Boolean).join(' ') || undefined;

    // KUJDES (rregullim 26 gusht 2026): NUK i kalojmë `phone`/`phone_confirm` createUser-it.
    // Provideri i telefonit në GoTrue është i ÇAKTIVIZUAR ("Phone logins are disabled"),
    // ndaj createUser me phone_confirm dështonte ("Phone signups are disabled") dhe asnjë
    // përdorues nuk krijohej — kodi SMS mbërrinte, por llogaria nuk lindte kurrë.
    // Numri ruhet te profiles.phone më poshtë; hyrja e mëpasme bëhet me email-in e derivuar
    // `<numri>@sms.al` + fjalëkalim (fallback-u ekzistues te login()). Kështu regjistrimi
    // është i pavarur nga konfigurimi i provider-it të telefonit.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email:         synthEmail,
      email_confirm: true,
      user_metadata: {
        full_name:  fullName,
        first_name: firstName ?? '',
        last_name:  lastName  ?? '',
        age:        age ?? null,
      },
    });

    if (createErr || !created?.user) {
      console.error('createUser error:', createErr);
      return json({ error: createErr?.message ?? 'Database error creating new user' });
    }

    const uid = created.user.id;

    const profileUpd: Record<string, unknown> = {};
    if (phoneE164) profileUpd.phone       = phoneE164;
    if (age)       profileUpd.age         = typeof age === 'number' ? age : parseInt(String(age));
    if (referredBy) profileUpd.referred_by = referredBy;
    if (Object.keys(profileUpd).length) {
      await admin.from('profiles').update(profileUpd).eq('id', uid);
    }

    const result = await sessionFor(uid);
    return json(result);
  }

  // FORGOT + LOGIN
  {
    const existingId = await findUserId();
    if (!existingId) {
      return json({ error: mode === 'forgot'
        ? 'Ky email/numër telefoni nuk është i regjistruar.'
        : 'Ky numër/email nuk është i regjistruar. Regjistrohu fillimisht.' });
    }
    const result = await sessionFor(existingId);
    return json(result);
  }
});
