-- PAGESA P2 (miratuar nga Martinel, 26 gusht 2026): grace 24h + rinovim manual para
-- skadimit + auto-rinovim (model Claude, i përshtatur pa arkëtim live).
-- ADDITIVE + i kthyeshëm. Bërthama e shkrimit (process_payment_event/grant_premium/webhook)
-- NUK preket; këtu shtohen VETËM: (a) konfigurim grace, (b) RPC rinovimi për përdoruesin,
-- (c) funksion+cron auto-rinovimi. Testuar: një abonim aktiv ekziston (dhuratë, period_end 2027)
-- → auto_renew_run s'e prek (jashtë dritares 24h).

-- (a) GRACE 24 orë. Sapo skadon, on-read entitlementi bie menjëherë (get_my_entitlements/
-- owner_rank_tier nuk nderojnë grace), POR cron-i i skadimit pret 24h para se të FSHEHË
-- biznesin / PAUZOJË shpalljet — 24h kohë për rinovim, me njoftim (premium_grace_notices_run).
insert into public.app_config(key, value)
values ('subscription_grace_days','1')
on conflict (key) do update set value = excluded.value;

-- (b) RINOVIM MANUAL PARA SKADIMIT — përdoruesi hap kërkesë rinovimi për planin aktual
-- pa e prekur abonimin ekzistues (aktivizohet në aprovim → tg_activate zgjat periudhën).
-- Ndryshe nga request_subscription (që kthen 'already_active'), ky LEJON rinovimin e aktivit.
create or replace function public.renew_my_subscription()
returns jsonb language plpgsql security definer set search_path=public as $fn$
declare v_uid uuid := auth.uid(); v_sub public.subscriptions; v_plan public.premium_plans;
begin
  if v_uid is null then return jsonb_build_object('error','unauthenticated'); end if;
  select * into v_sub from public.subscriptions
   where user_id = v_uid and status in ('active','pending')
   order by case status when 'active' then 0 else 1 end, current_period_end asc nulls last
   limit 1;
  if v_sub.id is null then return jsonb_build_object('error','no_subscription'); end if;
  select * into v_plan from public.premium_plans
   where id = coalesce(v_sub.pending_plan_id, v_sub.plan_id) and is_active = true;
  if v_plan.id is null then return jsonb_build_object('error','plan_not_found'); end if;

  if exists (select 1 from public.premium_requests where user_id = v_uid and status='pending') then
    update public.premium_requests
       set plan_id = v_plan.id, days_requested = v_plan.duration_days,
           amount = v_plan.price_eur, payment_method = 'rinovim'
     where user_id = v_uid and status='pending';
  else
    insert into public.premium_requests(user_id, plan_id, days_requested, amount, payment_method, status)
    values (v_uid, v_plan.id, v_plan.duration_days, v_plan.price_eur, 'rinovim', 'pending');
  end if;

  perform public._sub_event(v_sub.id, v_uid, 'renewal_requested',
          jsonb_build_object('plan', v_plan.slug, 'tier', coalesce(v_plan.tier,'premium')));
  return jsonb_build_object('ok', true, 'status','pending', 'plan', v_plan.name,
                            'tier', coalesce(v_plan.tier,'premium'));
end $fn$;
revoke all on function public.renew_my_subscription() from public;
grant execute on function public.renew_my_subscription() to authenticated;

-- (c) AUTO-RINOVIM (model Claude, pa arkëtim live). Për abonimet aktive që NUK janë anuluar
-- (cancel_at_period_end=false) dhe janë brenda 24h nga skadimi:
--   • Falas/dhuratë (price_paid=0): rinovim AUTOMATIK i vërtetë (grant_premium) — pa ndërprerje.
--   • Me pagesë: hap kërkesë rinovimi (rrjeta manuale e aprovimit) + njoftim — nuk lihet të bjerë heshtazi.
-- Idempotent: falas → period_end kalon +N ditë (del nga dritarja); me pagesë → nuk dublon kërkesën.
create or replace function public.auto_renew_run()
returns jsonb language plpgsql security definer set search_path=public, pg_temp as $fn$
declare r record; n_auto int := 0; n_req int := 0;
begin
  for r in
    select s.id, s.user_id, s.plan_id, s.price_paid,
           pp.tier as plan_tier, pp.duration_days, pp.price_all, pp.price_eur
      from public.subscriptions s
      join public.premium_plans pp on pp.id = s.plan_id
     where s.status = 'active'
       and coalesce(s.cancel_at_period_end,false) = false
       and s.current_period_end is not null
       and s.current_period_end > now()
       and s.current_period_end <= now() + interval '1 day'
  loop
    if coalesce(r.price_paid,0) = 0 then
      -- Rinovim automatik i vërtetë (dhuratë/falas): pa pagesë, pa ndërprerje.
      perform public.grant_premium(r.user_id, 'gift', coalesce(r.duration_days,30), r.plan_id,
                                   0, 'auto_renew', coalesce(r.plan_tier,'premium'));
      n_auto := n_auto + 1;
      insert into public.notifications(user_id, type, title, body, link)
      values (r.user_id, 'subscription', 'Abonimi u rinovua automatikisht ✅',
              'Plani yt u rinovua pa ndërprerje.', '/billing');
    elsif not exists (select 1 from public.premium_requests where user_id = r.user_id and status='pending') then
      -- Me pagesë: nis rinovimin te rrjeta e aprovimit manual + njofto.
      insert into public.premium_requests(user_id, plan_id, days_requested, amount, payment_method, status)
      values (r.user_id, r.plan_id, coalesce(r.duration_days,30), r.price_eur, 'auto-rinovim', 'pending');
      n_req := n_req + 1;
      insert into public.notifications(user_id, type, title, body, link)
      values (r.user_id, 'subscription', 'Rinovim automatik — konfirmo pagesën',
              'Nisëm rinovimin e planit tënd. Kryeje pagesën te faturimi që aksesi të mos ndërpritet.', '/billing');
    end if;
  end loop;
  -- Gjurmë e sigurt nga cron (audit_logs lejon actor NULL; admin_log do të humbte heshtazi).
  insert into public.audit_logs(action, target_type, new_data)
  values ('auto_renew_run','cron', jsonb_build_object('auto', n_auto, 'requests', n_req));
  return jsonb_build_object('ok', true, 'auto', n_auto, 'requests', n_req);
end $fn$;
revoke all on function public.auto_renew_run() from public;
grant execute on function public.auto_renew_run() to service_role;

-- Cron çdo orë (idempotent: heq punën e vjetër me të njëjtin emër para rikrijimit).
select cron.unschedule('alpazar_auto_renew')
 where exists (select 1 from cron.job where jobname = 'alpazar_auto_renew');
select cron.schedule('alpazar_auto_renew','0 * * * *','select public.auto_renew_run();');
