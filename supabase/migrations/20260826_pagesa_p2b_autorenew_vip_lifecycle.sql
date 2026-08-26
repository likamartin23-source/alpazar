-- PAGESA P2b (Martinel, 26 gusht 2026): cikli i plotë i "VIP Ekstra Boost" në auto-rinovim.
-- Korrigjon auto_renew_run (P2) për të gjitha rastet e boost-it (VIP kërkon Premium aktiv):
--   1) Boost s'paguhet/skadon, Premium aktiv → bie në Premium (auto: owner_rank_tier/expire).
--   2) Premium skadon, Boost "aktiv" → bien TË DYJA (VIP kërkon Premium).
--   3) Të dyja njëkohësisht → free.
-- Të meta të rregulluara në auto-rinovim:
--   A) RENDI: Premium rinovohet PARA Boost (order by tier) — përndryshe grant_premium('boost')
--      dështonte me 'premium_required' kur boost-i falas përpunohej i pari.
--   B) REZULTATI: njoftimi "u rinovua ✅" jepet VETËM kur grant_premium s'kthen error; për
--      boost pa premium jepet njoftim i saktë ("kërkon Premium aktiv"), pa e shënuar rinovim.
-- Aplikuar LIVE me execute_sql; provuar: {auto:0,failed:0,requests:0} (asnjë brenda 24h).

create or replace function public.auto_renew_run()
returns jsonb language plpgsql security definer set search_path=public, pg_temp as $fn$
declare r record; n_auto int := 0; n_req int := 0; n_fail int := 0; v_res jsonb; v_label text;
begin
  for r in
    select s.id, s.user_id, s.plan_id, s.price_paid,
           pp.tier as plan_tier, pp.duration_days, pp.price_eur
      from public.subscriptions s
      join public.premium_plans pp on pp.id = s.plan_id
     where s.status = 'active'
       and coalesce(s.cancel_at_period_end,false) = false
       and s.current_period_end is not null
       and s.current_period_end > now()
       and s.current_period_end <= now() + interval '1 day'
     order by case when pp.tier = 'boost' then 1 else 0 end  -- Premium PARA Boost (VIP kërkon Premium aktiv)
  loop
    v_label := case when r.plan_tier = 'boost' then 'VIP Ekstra Boost' else 'Premium' end;
    if coalesce(r.price_paid,0) = 0 then
      v_res := public.grant_premium(r.user_id, 'gift', coalesce(r.duration_days,30), r.plan_id,
                                    0, 'auto_renew', coalesce(r.plan_tier,'premium'));
      if v_res ? 'error' then
        n_fail := n_fail + 1;
        insert into public.notifications(user_id, type, title, body, link)
        values (r.user_id, 'subscription', v_label || ' nuk u rinovua',
                case when r.plan_tier = 'boost'
                     then 'VIP Ekstra Boost kërkon Premium aktiv. Rinovo Premium-in që të rikthehet edhe VIP.'
                     else 'Rinovimi automatik dështoi. Provo manualisht te faturimi.' end, '/billing');
      else
        n_auto := n_auto + 1;
        insert into public.notifications(user_id, type, title, body, link)
        values (r.user_id, 'subscription', v_label || ' u rinovua automatikisht ✅',
                'Plani yt u rinovua pa ndërprerje.', '/billing');
      end if;
    elsif not exists (select 1 from public.premium_requests where user_id = r.user_id and status='pending') then
      insert into public.premium_requests(user_id, plan_id, days_requested, amount, payment_method, status)
      values (r.user_id, r.plan_id, coalesce(r.duration_days,30), r.price_eur, 'auto-rinovim', 'pending');
      n_req := n_req + 1;
      insert into public.notifications(user_id, type, title, body, link)
      values (r.user_id, 'subscription', 'Rinovim automatik — konfirmo pagesën',
              'Nisëm rinovimin e ' || v_label || '. Kryeje pagesën te faturimi që aksesi të mos ndërpritet.', '/billing');
    end if;
  end loop;
  insert into public.audit_logs(action, target_type, new_data)
  values ('auto_renew_run','cron', jsonb_build_object('auto', n_auto, 'requests', n_req, 'failed', n_fail));
  return jsonb_build_object('ok', true, 'auto', n_auto, 'requests', n_req, 'failed', n_fail);
end $fn$;
