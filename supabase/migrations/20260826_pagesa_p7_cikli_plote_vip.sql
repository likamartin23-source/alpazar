-- PAGESA P7 (Martinel, 26 gusht 2026): cikli i PLOTË VIP — njoftime + rinovim pas pagese +
-- restaurim. Aplikuar LIVE me execute_sql; provuar empirikisht (test me rollback):
--   demote-paused (afat i pambaruar) → RIAKTIVOHET; time-expired (afat i kaluar) → JO.
-- Additive; ruan gjithë logjikën ekzistuese, shton VETËM njoftime + restaurim.

-- 1) Paralajmërim proaktiv VIP: kur skadon Premium, VIP Ekstra Boost bie bashkë me të.
create or replace function public.premium_grace_notices_run()
returns integer language plpgsql security definer set search_path to 'public' as $fn$
declare n int;
begin
  with kand as (
    select p.id as user_id, p.premium_expires_at,
           coalesce(p.has_boost,false) and (p.boost_expires_at is null or p.boost_expires_at > now()) as ka_vip,
           case when p.premium_expires_at <= now() + interval '1 day' then 1
                when p.premium_expires_at <= now() + interval '3 days' then 3
                else 7 end as dite
      from public.profiles p
     where coalesce(p.is_premium,false)
       and p.premium_expires_at is not null
       and p.premium_expires_at > now()
       and p.premium_expires_at <= now() + interval '7 days'
  ), ins as (
    insert into public.notifications(id, user_id, type, title, body, link, metadata, created_at, is_read)
    select gen_random_uuid(), k.user_id, 'premium_expiring',
           format('Premium skadon pas %s dite', k.dite),
           format('Plani yt Premium skadon më %s. Rinovo që shpalljet dhe përparësitë të mos ndalen.%s',
                  to_char(k.premium_expires_at at time zone 'Europe/Tirane', 'DD.MM.YYYY HH24:MI'),
                  case when k.ka_vip then ' KUJDES: bashkë me Premium-in bie edhe VIP Ekstra Boost — VIP kërkon Premium aktiv.' else '' end),
           '/billing', jsonb_build_object('dite', k.dite, 'vip', k.ka_vip), now(), false
      from kand k
     where not exists (select 1 from public.notifications x
        where x.user_id = k.user_id and x.type = 'premium_expiring'
          and coalesce(x.metadata->>'dite','') = k.dite::text
          and x.created_at > now() - interval '9 days')
    returning 1
  ) select count(*) into n from ins;
  if n > 0 then
    insert into public.audit_logs(action, target_type, new_data)
    values ('premium_grace_njoftime','cron', jsonb_build_object('u_derguan', n));
  end if;
  return n;
end $fn$;

-- 2) expire_premium_run: njofto (A) kur bien Premium+VIP, (B) kur bie vetëm VIP (Premium vazhdon).
create or replace function public.expire_premium_run()
returns integer language plpgsql security definer set search_path to 'public' as $fn$
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
     returning id, coalesce(has_boost,false) as pat_vip
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
    begin perform public.demote_free_keep_newest(v_u);
    exception when others then null; end;
  end loop;

  return n + nb;
end $fn$;

-- 3) tg_propagate_rank_to_listings: RINOVIM PAS PAGESE restauron shpalljet e pauzuara nga demotimi.
create or replace function public.tg_propagate_rank_to_listings()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
declare t smallint;
begin
  t := coalesce(public.owner_rank_tier(NEW.id), 0);

  update public.listings
     set rank_tier = t, is_premium = (t >= 1)
   where user_id = NEW.id
     and (rank_tier is distinct from t or is_premium is distinct from (t >= 1));

  -- Kur pronari bëhet sërish Premium/VIP: riaktivo shpalljet e pauzuara nga demotimi
  -- (status='expired' me afat të pambaruar) — JO ato vërtet të skaduara në kohë, as ato
  -- të pauzuara/shitura me dorë. Provuar: demote→riaktivohet; time-expired→jo.
  if t >= 1 then
    update public.listings
       set is_active = true, status = 'active'
     where user_id = NEW.id and coalesce(is_active,false) = false and status = 'expired'
       and (expires_at is null or expires_at > now());
  end if;

  update public.businesses b
     set is_visible = public.business_should_be_visible(b.owner_id, b.is_active),
         dimmed_at = case when public.business_should_be_visible(b.owner_id, b.is_active)
                          then null else coalesce(b.dimmed_at, now()) end,
         dim_reason = case when public.business_should_be_visible(b.owner_id, b.is_active)
                           then null else 'abonimi Premium nuk eshte aktiv' end
   where b.owner_id = NEW.id
     and b.is_visible is distinct from public.business_should_be_visible(b.owner_id, b.is_active);

  return null;
end $fn$;
