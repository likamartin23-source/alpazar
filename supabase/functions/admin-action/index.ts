// Supabase Edge Function: `admin-action`
//
// Veprimet e panelit admin me service_role — kalon RLS-ne is_admin() qe
// bllokonte veprimet kur admini hyn me PIN (jo me sesion Supabase).
//
// KUJDES ARKITEKTUROR: kjo rruge anashkalon RLS-ne, matricen e lejeve
// (`has_perm`/`perm_matrix`) dhe trigerin `guard_profile_privileges`, i cili
// e perjashton shprehimisht `service_role`. Prandaj cdo veprim ketu DUHET te
// lere gjurme — pa te, veprimi eshte i padukshem dhe i paprovueshem.
//
// Hapi tjeter i planifikuar: zevendesimi i PIN-it me sesion te vertete dhe
// `has_perm()`, qe kjo rruge te mos jete me e privilegjuar se paneli vete.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const pin = String(body.pin ?? '')
    const action = String(body.action ?? '')
    const p = body.params ?? {}

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'

    /* Gjurma e cdo veprimi. Shkruhet edhe kur veprimi deshton, edhe kur PIN-i
       eshte i gabuar — perpjekjet e deshtuara jane po aq te rendesishme sa ato
       te suksesshmet. Nuk e ndalon kurre veprimin nese vete shkrimi deshton. */
    async function logAction(act: string, ok: boolean, detail: Record<string, unknown> = {}) {
      try {
        await db.from('admin_logs').insert({
          admin_id: null,                       // rruga me PIN s'ka identitet perdoruesi
          action: `pin.${act}`,
          target_type: String(detail.target_type ?? 'system'),
          target_id: detail.target_id ?? null,
          new_value: { ok, ip, params: p, ...detail },
          ip_address: ip,
          user_agent: req.headers.get('user-agent') ?? null,
        })
      } catch { /* gjurma nuk duhet te bllokoje kurre veprimin */ }
    }

    async function setting(key: string, fallback: string): Promise<string> {
      const { data } = await db.from('admin_settings').select('value').eq('key', key).maybeSingle()
      const v = (data as { value?: string } | null)?.value
      return v && v.trim() ? v : fallback
    }

    // ── Throttle per IP ──
    const { data: thr } = await db.from('admin_action_throttle').select('attempts, window_start').eq('ip', ip).maybeSingle()
    let attempts = 0
    if (thr) {
      const elapsed = Date.now() - new Date((thr as { window_start: string }).window_start).getTime()
      if (elapsed < 600_000) {
        attempts = (thr as { attempts: number }).attempts
        if (attempts >= 30) {
          await logAction('throttled', false, { attempts })
          return json({ ok: false, error: 'Shumë përpjekje. Prit ~10 min.' }, 429)
        }
      } else {
        await db.from('admin_action_throttle').update({ attempts: 0, window_start: new Date().toISOString() }).eq('ip', ip)
      }
    }

    // ── PIN ──
    const { data: pinRow } = await db.from('admin_settings').select('value').eq('key', 'admin_pin').maybeSingle()
    if (!pinRow || (pinRow as { value: string }).value !== pin) {
      await db.from('admin_action_throttle').upsert({
        ip, attempts: attempts + 1,
        window_start: thr ? (thr as { window_start: string }).window_start : new Date().toISOString(),
      })
      await logAction('pin_i_gabuar', false, { attempts: attempts + 1, action_kerkuar: action })
      return json({ ok: false, error: 'PIN i gabuar' }, 401)
    }
    await db.from('admin_action_throttle').upsert({ ip, attempts: 0, window_start: new Date().toISOString() })

    async function run(): Promise<{ ok: boolean; error?: string }> {
      switch (action) {
        case 'verify_pin':
          return { ok: true }

        case 'resolve_report': {
          const { error } = await db.from('reports').update({ status: p.status }).eq('id', p.report_id)
          /* Trigeri `trg_report_closes_queue` e mbyll vete zerin perkates te
             `moderation_queue`. Me pare ai mbetej 'pending' pergjithmone. */
          return { ok: !error, error: error?.message }
        }

        case 'remove_listing': {
          /* Vendoset edhe `moderation_status`, jo vetem `is_active` — qe gjendja
             e moderimit te mos rrije e shkeputur nga dukshmeria reale. */
          const { error: e1 } = await db.from('listings')
            .update({ is_active: false, moderation_status: 'removed', moderated_at: new Date().toISOString() })
            .eq('id', p.listing_id)
          if (e1) return { ok: false, error: e1.message }

          if (p.seller_id) {
            const email = await setting('company_email', 'alpazarsuport@gmail.com')
            await db.from('notifications').insert({
              user_id: p.seller_id,
              type: 'listing_removed',
              title: 'Shpallja jote u çaktivizua',
              body: `Shpallja jote u çaktivizua pas shqyrtimit të një raporti. `
                  + `Nëse mendon se është gabim, shkruaj te ${email} dhe do ta rishikojmë.`,
              link: `/listing/${p.listing_id}`,
            })
          }
          if (p.report_id) await db.from('reports').update({ status: 'resolved' }).eq('id', p.report_id)
          return { ok: true }
        }

        case 'resolve_takedown': {
          const { error } = await db.from('takedown_requests').update({
            status: p.status, resolver_note: p.note ?? '', resolved_at: new Date().toISOString(),
          }).eq('id', p.id)
          return { ok: !error, error: error?.message }
        }

        case 'sub_status': {
          /* KORRIGJIM: shkruhej te `premium_subscriptions` — tabela e vjeter me
             0 rreshta. Sistemi i gjalle eshte `subscriptions`. */
          const { error: e1 } = await db.from('subscriptions')
            .update({ status: p.status, updated_at: new Date().toISOString() })
            .eq('id', p.id)
          if (e1) return { ok: false, error: e1.message }

          if (p.status === 'active' && p.user_id)
            await db.from('profiles').update({ is_premium: true, premium_expires_at: p.end_date ?? null }).eq('id', p.user_id)
          if ((p.status === 'canceled' || p.status === 'cancelled' || p.status === 'suspended' || p.status === 'expired') && p.user_id)
            await db.from('profiles').update({ is_premium: false }).eq('id', p.user_id)
          return { ok: true }
        }

        case 'premium_request': {
          const { error: e1 } = await db.from('premium_requests').update({ status: p.action }).eq('id', p.id)
          if (e1) return { ok: false, error: e1.message }
          if (p.action === 'approved' && p.user_id) {
            const exp = new Date(); exp.setDate(exp.getDate() + (Number(p.days) || 30))
            await db.from('profiles').update({ is_premium: true, premium_expires_at: exp.toISOString() }).eq('id', p.user_id)
            /* Shenohet shprehimisht: Premium u dha PA krijuar abonim dhe PA
               faturë. `system_integrity_check()` e kap si `premium_pa_abonim`.
               Ligji 87/2019, neni 4, e kerkon faturen pavaresisht qarkullimit. */
            await logAction('premium_pa_abonim_dhe_pa_fature', true, {
              target_type: 'user', target_id: p.user_id, dite: Number(p.days) || 30,
            })
          }
          return { ok: true }
        }

        case 'gift_premium': {
          const days = Number(p.days)
          if (!days || days <= 0) return { ok: false, error: 'ditë të pavlefshme' }
          const exp = new Date(); exp.setDate(exp.getDate() + days)
          const { error } = await db.from('profiles')
            .update({ is_premium: true, premium_expires_at: exp.toISOString() })
            .eq('id', p.user_id)
          if (error) return { ok: false, error: error.message }
          await logAction('premium_pa_abonim_dhe_pa_fature', true, {
            target_type: 'user', target_id: p.user_id, dite: days,
          })
          return { ok: true }
        }

        case 'toggle_method': {
          const { error } = await db.from('payment_methods').update({ is_active: !!p.active }).eq('id', p.id)
          return { ok: !error, error: error?.message }
        }

        default:
          return { ok: false, error: 'veprim i panjohur' }
      }
    }

    const r = await run()
    await logAction(action, r.ok, {
      target_type: p.listing_id ? 'listing' : p.user_id ? 'user' : p.id ? 'record' : 'system',
      target_id: p.listing_id ?? p.user_id ?? p.id ?? null,
      error: r.error ?? null,
    })
    return json(r, r.ok ? 200 : 500)
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message ?? e) }, 500)
  }
})
