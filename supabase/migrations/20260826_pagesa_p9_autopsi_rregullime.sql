-- PAGESA P9 (Martinel, 26 gusht 2026): RREGULLIME NGA AUTOPSIA e bllokut (rishikim adversarial).
-- Aplikuar LIVE me execute_sql. Additive; korrigjon 2 gjetje reale + provon 1 alarm të rremë.
--
-- #1 (alarm i rremë, i mbyllur me provë): auto_renew_run për abonime falas thërret grant_premium,
--     i cili AVANCON subscriptions.current_period_end (+N ditë) → rreshti del nga dritarja 24h,
--     s'ka "runaway". Provë live (rollback): before=2027-08-19 → after=2027-09-18 (+30 ditë).
-- #3 (REGRESION, i rregulluar këtu): kontrollet e shëndetit (P4/P6) NUK e nderonin grace-in 24h
--     → çdo skadim normal shfaqej "i vjetruar" (i kuq) + spam njoftimesh te adminët për ≤24h.
--     Tani të tria provat përdorin pragun `now() - grace`.
-- #6 (precizion, i rregulluar këtu): expire_premium_run.pat_vip nderon boost_expires_at
--     (një boost i skaduar më parë s'e etiketon njoftimin si "VIP ra bashkë me Premium").
-- Mbeten (të raportuara, jashtë këtij fiksi): #2 versionimi i plotë i bërthamës së pagesave
--     (tabelat subscriptions/premium_plans/transactions + grant_premium/process_payment_event)
--     kërkon një schema-dump të mirëfilltë; #4 modeli një-kërkesë-pending-për-përdorues (me qëllim).

-- #3a
create or replace function public.admin_list_transactions(p_limit int default 100)
returns jsonb language plpgsql stable security definer set search_path=public as $fn$
declare v_rows jsonb; v_summary jsonb; v_health jsonb; v_grace int;
begin
  if not public.has_perm('billing.approve') then return jsonb_build_object('error','forbidden'); end if;
  select coalesce(nullif(value,'')::int,0) into v_grace from public.app_config where key='subscription_grace_days';
  v_grace := coalesce(v_grace,0);
  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_rows from (
    select tr.id, tr.user_id, coalesce(pr.full_name, pr.username) as user_name,
           tr.amount, tr.currency, tr.status, tr.provider, tr.provider_ref,
           (tr.payload->>'review') as review_reason, (tr.payload->'grant_error') as grant_error,
           tr.created_at, tr.updated_at
      from public.transactions tr left join public.profiles pr on pr.id = tr.user_id
     order by tr.created_at desc limit greatest(p_limit,1)) t;
  select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) into v_summary
    from (select status, count(*) n from public.transactions group by status) s;
  select jsonb_build_object(
    'stuck', (select count(*) from public.transactions where status in ('review','grant_failed')),
    'stale_premium', (select count(*) from public.profiles where is_premium and premium_expires_at is not null and premium_expires_at < now() - make_interval(days=>v_grace)),
    'stale_boost', (select count(*) from public.profiles where has_boost and ((boost_expires_at is not null and boost_expires_at < now()-make_interval(days=>v_grace)) or (premium_expires_at is not null and premium_expires_at < now()-make_interval(days=>v_grace)) or not coalesce(is_premium,false))),
    'visible_no_premium', (select count(*) from public.businesses b join public.profiles p on p.id=b.owner_id
       where coalesce(b.is_visible,true) and b.admin_visibility_override is null
         and not (coalesce(p.is_premium,false) and (p.premium_expires_at is null or p.premium_expires_at > now()-make_interval(days=>v_grace)))),
    'pending_requests', (select count(*) from public.premium_requests where status='pending')
  ) into v_health;
  return jsonb_build_object('ok',true,'rows',v_rows,'summary',v_summary,'health',v_health);
end $fn$;

-- #3b
create or replace function public.payments_health_check_run()
returns jsonb language plpgsql security definer set search_path=public, pg_temp as $fn$
declare v_stuck int; v_sp int; v_sb int; v_vnp int; v_total int; v_grace int;
begin
  select coalesce(nullif(value,'')::int,0) into v_grace from public.app_config where key='subscription_grace_days';
  v_grace := coalesce(v_grace,0);
  select count(*) into v_stuck from public.transactions where status in ('review','grant_failed');
  select count(*) into v_sp from public.profiles where is_premium and premium_expires_at is not null and premium_expires_at < now() - make_interval(days=>v_grace);
  select count(*) into v_sb from public.profiles where has_boost and ((boost_expires_at is not null and boost_expires_at < now()-make_interval(days=>v_grace)) or (premium_expires_at is not null and premium_expires_at < now()-make_interval(days=>v_grace)) or not coalesce(is_premium,false));
  select count(*) into v_vnp from public.businesses b join public.profiles p on p.id=b.owner_id
    where coalesce(b.is_visible,true) and b.admin_visibility_override is null
      and not (coalesce(p.is_premium,false) and (p.premium_expires_at is null or p.premium_expires_at > now()-make_interval(days=>v_grace)));
  v_total := v_stuck + v_sp + v_sb + v_vnp;
  insert into public.audit_logs(action, target_type, new_data)
  values ('payments_health_check','cron', jsonb_build_object('stuck',v_stuck,'stale_premium',v_sp,'stale_boost',v_sb,'visible_no_premium',v_vnp,'grace',v_grace));
  if v_total > 0 then
    insert into public.notifications(user_id, type, title, body, link)
    select a.id, 'system', '⚠️ Shëndeti i pagesave kërkon vëmendje',
      format('Ngecur:%s · Premium i vjetruar:%s · Boost i vjetruar:%s · Biznes pa premium:%s. Shiko panelin.', v_stuck, v_sp, v_sb, v_vnp),
      '/admin'
    from public.profiles a where coalesce(a.is_admin,false)
      and not exists (select 1 from public.notifications x where x.user_id=a.id and x.type='system'
        and x.title='⚠️ Shëndeti i pagesave kërkon vëmendje' and x.created_at > now() - interval '20 hours');
  end if;
  return jsonb_build_object('ok',true,'issues',v_total,'stuck',v_stuck,'stale_premium',v_sp,'stale_boost',v_sb,'visible_no_premium',v_vnp);
end $fn$;

-- #6: expire_premium_run.pat_vip nderon boost_expires_at (ndryshim i vetëm rreshti pat_vip;
-- pjesa tjetër identike me P7).
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
    begin perform public.demote_free_keep_newest(v_u);
    exception when others then null; end;
  end loop;

  return n + nb;
end $fn$;
