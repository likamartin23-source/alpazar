-- PAGESA P6 (Martinel, 26 gusht 2026): ZBULIM + ALARMIM ("kap kur dështon"). Aplikuar LIVE
-- me execute_sql; ky skedar = gjurmë + fresh-setup. Additive, service_role only.
-- Cron ditor: numëron transaksionet e ngecura (review/grant_failed) + provat e koherencës
-- flag↔realitet; nëse >0, njofton adminët (një herë / ~20h) + gjurmë te audit_logs.
-- Normalisht = 0 (expire_premium_run /15min i vetë-shëron flamujt; stuck = sinjali kryesor).

create or replace function public.payments_health_check_run()
returns jsonb language plpgsql security definer set search_path=public, pg_temp as $fn$
declare v_stuck int; v_sp int; v_sb int; v_vnp int; v_total int;
begin
  select count(*) into v_stuck from public.transactions where status in ('review','grant_failed');
  select count(*) into v_sp from public.profiles where is_premium and premium_expires_at is not null and premium_expires_at < now();
  select count(*) into v_sb from public.profiles where has_boost and ((boost_expires_at is not null and boost_expires_at<now()) or not coalesce(is_premium,false) or (premium_expires_at is not null and premium_expires_at<now()));
  select count(*) into v_vnp from public.businesses b join public.profiles p on p.id=b.owner_id
    where coalesce(b.is_visible,true) and b.admin_visibility_override is null
      and not (coalesce(p.is_premium,false) and (p.premium_expires_at is null or p.premium_expires_at>now()));
  v_total := v_stuck + v_sp + v_sb + v_vnp;
  insert into public.audit_logs(action, target_type, new_data)
  values ('payments_health_check','cron', jsonb_build_object('stuck',v_stuck,'stale_premium',v_sp,'stale_boost',v_sb,'visible_no_premium',v_vnp));
  if v_total > 0 then
    insert into public.notifications(user_id, type, title, body, link)
    select a.id, 'system', '⚠️ Shëndeti i pagesave kërkon vëmendje',
      format('Ngecur:%s · Premium i vjetruar:%s · Boost i vjetruar:%s · Biznes pa premium:%s. Shiko panelin.', v_stuck, v_sp, v_sb, v_vnp),
      '/admin'
    from public.profiles a
    where coalesce(a.is_admin,false)
      and not exists (select 1 from public.notifications x where x.user_id=a.id and x.type='system'
        and x.title='⚠️ Shëndeti i pagesave kërkon vëmendje' and x.created_at > now() - interval '20 hours');
  end if;
  return jsonb_build_object('ok',true,'issues',v_total,'stuck',v_stuck,'stale_premium',v_sp,'stale_boost',v_sb,'visible_no_premium',v_vnp);
end $fn$;
revoke all on function public.payments_health_check_run() from public;
grant execute on function public.payments_health_check_run() to service_role;

select cron.unschedule('alpazar_payments_health')
 where exists (select 1 from cron.job where jobname='alpazar_payments_health');
select cron.schedule('alpazar_payments_health','30 8 * * *','select public.payments_health_check_run();');
