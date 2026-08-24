-- BLLOKU FAZA 4 — Kuota & skadimi (Skema 1). Additive; i kthyeshem.
-- Aplikuar live me apply_migration me 22 gusht 2026 (prova ne docs/RAPORT_CODE_BLLOKU.md).
-- Rikthimi: rikrijo tg_enforce_listing_quota/expire_premium_run/expire_listings_run ne
-- versionet e meparshme + cron.unschedule('alpazar_premium_grace')
-- + drop function demote_free_keep_newest(uuid), premium_grace_notices_run().

-- 1) Demotimi premium->falas: mban N me te fundit aktive, tepricen e pauzon (status='expired').
create or replace function public.demote_free_keep_newest(p_user uuid) returns integer
language plpgsql security definer set search_path to 'public' as $fn$
declare v_max int; n int;
begin
  select coalesce(nullif(value,'')::int, 10) into v_max from public.app_config where key='free_listings_limit';
  v_max := coalesce(v_max, 10);
  if v_max < 0 then return 0; end if;
  update public.listings l set is_active=false, status='expired'
   where l.user_id=p_user and coalesce(l.is_active,false) and l.status='active'
     and l.id not in (select id from public.listings where user_id=p_user and coalesce(is_active,false) and status='active' order by created_at desc limit v_max);
  get diagnostics n = row_count;
  if n > 0 then
    insert into public.audit_logs(action, target_type, target_id, new_data)
    values ('kuote_demotim_premium','profile', p_user, jsonb_build_object('u_pauzuan', n, 'mbajtur', v_max));
    insert into public.notifications(id, user_id, type, title, body, link, created_at, is_read)
    values (gen_random_uuid(), p_user, 'system',
            'Plani Premium përfundoi — shpalljet u kufizuan',
            format('U mbajtën aktive %s shpalljet më të fundit; %s të tjera u pauzuan. Riaktivizoji duke kaluar sërish në Premium ose duke pauzuar të tjera.', v_max, n),
            '/profile?tab=listings', now(), false);
  end if;
  return n;
end $fn$;
revoke execute on function public.demote_free_keep_newest(uuid) from public, anon, authenticated;

-- 2) expire_premium_run: si me pare + demotim i shpalljeve per userat qe humbin premium.
create or replace function public.expire_premium_run() returns integer
language plpgsql security definer set search_path to 'public', 'pg_temp' as $fn$
declare n integer; nb integer; r record; v_grace int; v_demoted uuid[]; v_u uuid;
begin
  select coalesce(nullif(value,'')::int, 0) into v_grace
    from public.app_config where key = 'subscription_grace_days';
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
    update public.profiles
       set is_premium = false, premium_expires_at = null
     where is_premium = true and premium_expires_at is not null
       and premium_expires_at < now() - make_interval(days => v_grace)
     returning id
  ) select coalesce(array_agg(id), '{}') into v_demoted from dem;
  n := coalesce(array_length(v_demoted,1), 0);

  update public.profiles
     set has_boost = false, boost_expires_at = null
   where has_boost = true
     and ((boost_expires_at is not null and boost_expires_at < now() - make_interval(days => v_grace))
          or coalesce(is_premium,false) = false);
  get diagnostics nb = row_count;

  perform set_config('app.skip_privilege_guard','false', true);

  foreach v_u in array v_demoted loop
    begin
      perform public.demote_free_keep_newest(v_u);
    exception when others then null;
    end;
  end loop;

  return n + nb;
end $fn$;

-- 3) Njoftimet grace T-7/-3/-1 para skadimit te premium (dedup me bucket ditor).
create or replace function public.premium_grace_notices_run() returns integer
language plpgsql security definer set search_path to 'public' as $fn$
declare n int;
begin
  with kand as (
    select p.id as user_id, p.premium_expires_at,
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
           format('Plani yt Premium skadon më %s. Rinovo që shpalljet dhe përparësitë të mos ndalen.', to_char(k.premium_expires_at at time zone 'Europe/Tirane', 'DD.MM.YYYY HH24:MI')),
           '/billing', jsonb_build_object('dite', k.dite), now(), false
      from kand k
     where not exists (
       select 1 from public.notifications x
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
revoke execute on function public.premium_grace_notices_run() from public, anon, authenticated;

select cron.schedule('alpazar_premium_grace', '0 8 * * *', 'select public.premium_grace_notices_run();')
 where not exists (select 1 from cron.job where jobname='alpazar_premium_grace');

-- 4) Kuota mbron edhe RIAKTIVIZIMIN (jo vetem INSERT). Krahason OLD/NEW; idempotent.
create or replace function public.tg_enforce_listing_quota() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare v_tier smallint; v_max int; v_n int;
begin
  if TG_OP = 'UPDATE' then
    if coalesce(OLD.is_active,false) or not coalesce(NEW.is_active,false) then
      return NEW;
    end if;
  end if;

  v_tier := coalesce(public.owner_rank_tier(NEW.user_id), 0);
  if v_tier >= 1 then return NEW; end if;

  select coalesce(nullif(value,'')::int, -1) into v_max
    from public.app_config where key = 'free_listings_limit';
  if coalesce(v_max,-1) < 0 then return NEW; end if;

  select count(*) into v_n from public.listings
   where user_id = NEW.user_id and coalesce(is_active,false)
     and (TG_OP = 'INSERT' or id <> NEW.id);
  if v_n >= v_max then
    raise exception 'KUFI_SHPALLJESH: llogaria pa pagese lejon % shpallje aktive. Ke %. Cakto nje shpallje si joaktive ose kalo ne Premium.',
      v_max, v_n using errcode = 'check_violation';
  end if;
  return NEW;
end $fn$;

drop trigger if exists trg_listing_quota on public.listings;
create trigger trg_listing_quota
  before insert or update of is_active on public.listings
  for each row execute function public.tg_enforce_listing_quota();

-- 5) Gjurma e skadimit ditor te audit_logs (admin_log nga cron humbet ne heshtje — kurthi #4).
create or replace function public.expire_listings_run() returns integer
language plpgsql security definer set search_path to 'public' as $fn$
declare n integer;
begin
  update public.listings
     set is_active = false, status = 'expired'
   where coalesce(is_active,false)
     and expires_at is not null
     and expires_at < now();
  get diagnostics n = row_count;
  if n > 0 then
    insert into public.audit_logs(action, target_type, new_data)
    values ('skadence_shpalljesh','cron', jsonb_build_object('u_caktivizuan', n));
    perform public.admin_log('skadence_shpalljesh','listing', null, null,
            jsonb_build_object('u_caktivizuan', n));
  end if;
  return n;
end $fn$;
