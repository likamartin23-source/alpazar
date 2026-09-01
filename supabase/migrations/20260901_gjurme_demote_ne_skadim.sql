-- GJURMË PËR DËSHTIMIN E DEMOTE-IT NË SKADIM (§9 / §1.4) — RREGULLIM C nga raporti i terminalit
--
-- Gjetja: te `expire_premium_run()`, cikli që heq shpalljet mbi kufirin falas për një
-- përdorues që humbi Premium-in mbështillej me `exception when others then null` —
-- pra dështimi zhdukej pa gjurmë. Pasoja: një përdorues i degraduar mund të mbetej me
-- MË SHUMË shpallje aktive se kufiri falas (rrjedhje monetizimi e fshehur, modeli §9/F7).
--
-- Rregullimi: në vend të `then null`, fut një rresht te `audit_logs` (actor_id NULL lejohet
-- — §1.4: cron/service_role s'ka `auth.uid()`; `admin_logs.admin_id` do të humbte në heshtje).
-- Cikli NUK ndërpritet nga një dështim individual (mbahet `begin/exception` per-përdorues),
-- por tani çdo dështim lë provë me SQLERRM. Trupi tjetër është IDENTIK me LIVE.
--
-- Prova që definer→audit_logs punon: demote_free_keep_newest, auto_renew_run,
-- expire_listings_run, offers_expire_run, premium_grace_notices_run tashmë e bëjnë live.
-- Additive/idempotent (create or replace). I kthyeshëm (rikthe handler-in te `then null`).

begin;

create or replace function public.expire_premium_run()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare n integer; nb integer; r record; v_grace int;
        v_demoted uuid[]; v_vip_lost uuid[]; v_vip_only uuid[]; v_u uuid;
begin
  select coalesce(nullif(value,'')::int, 0) into v_grace from public.app_config where key = 'subscription_grace_days';
  v_grace := coalesce(v_grace, 0);

  for r in select * from public.subscriptions
            where status='active' and current_period_end < now() - make_interval(days => v_grace) loop
    update public.subscriptions
       set status = case when r.cancel_at_period_end then 'canceled' else 'expired' end
     where id = r.id;
    perform public._sub_event(r.id, r.user_id,
            case when r.cancel_at_period_end then 'canceled' else 'expired' end,
            jsonb_build_object('period_end', r.current_period_end, 'tier', r.tier, 'grace_days', v_grace));
  end loop;

  perform set_config('app.skip_privilege_guard','true', true);

  with dem as (
    update public.profiles set is_premium = false, premium_expires_at = null
     where is_premium = true and premium_expires_at is not null
       and premium_expires_at < now() - make_interval(days => v_grace)
     returning id, (coalesce(has_boost,false) and (boost_expires_at is null or boost_expires_at > now())) as pat_vip
  ) select coalesce(array_agg(id),'{}'), coalesce(array_agg(id) filter (where pat_vip),'{}')
      into v_demoted, v_vip_lost from dem;
  n := coalesce(array_length(v_demoted,1), 0);

  with br as (
    update public.profiles set has_boost = false, boost_expires_at = null
     where has_boost = true
       and ((boost_expires_at is not null and boost_expires_at < now() - make_interval(days => v_grace))
            or coalesce(is_premium,false) = false)
     returning id, coalesce(is_premium,false) as ende_premium
  ) select coalesce(count(*),0), coalesce(array_agg(id) filter (where ende_premium),'{}')
      into nb, v_vip_only from br;

  perform set_config('app.skip_privilege_guard','false', true);

  insert into public.notifications(user_id, type, title, body, link)
  select u, 'subscription',
    case when u = any(v_vip_lost) then 'Premium & VIP Ekstra Boost përfunduan' else 'Premium përfundoi' end,
    case when u = any(v_vip_lost)
      then 'Abonimi Premium skadoi, ndaj ra edhe VIP Ekstra Boost (VIP kërkon Premium aktiv). Rinovo Premium-in për rikthim.'
      else 'Abonimi Premium skadoi. Rinovo për të rikthyer përparësitë.' end,
    '/billing'
  from unnest(v_demoted) as u;

  insert into public.notifications(user_id, type, title, body, link)
  select u, 'subscription', 'VIP Ekstra Boost përfundoi',
    'VIP Ekstra Boost skadoi; Premium-i yt vazhdon. Rinovo VIP për vend të parë absolut.', '/billing'
  from unnest(v_vip_only) as u
  where not (u = any(v_demoted));

  foreach v_u in array v_demoted loop
    begin
      perform public.demote_free_keep_newest(v_u);
    exception when others then
      -- §9: mos e gëllit dështimin. Lë gjurmë (actor_id NULL — cron pa auth.uid(), §1.4)
      -- pa e ndërprerë ciklin për përdoruesit e tjerë.
      insert into public.audit_logs(actor_id, action, target_type, target_id, new_data)
        values (null, 'expire_premium.demote_failed', 'profile', v_u,
                jsonb_build_object('error', SQLERRM, 'sqlstate', SQLSTATE, 'at', clock_timestamp()));
    end;
  end loop;

  return n + nb;
end $function$;

commit;

-- VERIFIKIM PAS APLIKIMIT:
--   1) `select public.expire_premium_run();` → duhet të kthejë numër pa gabim (sjellja e njëjtë).
--   2) Për të provuar gjurmën: fut përkohësisht një dështim te demote_free_keep_newest në një
--      transaksion të kthyer mbrapsht, thirr expire_premium_run, dhe kontrollo që audit_logs
--      merr një rresht 'expire_premium.demote_failed'. (Mos e lër ndryshimin e provës.)
