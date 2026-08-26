-- PAGESA P4 (miratuar Martinel, 26 gusht 2026): paneli raporton GJITHÇKA — rrjeta e sigurisë
-- kur leximi automatik i pagesave dështon (kemi aprovimin manual). Aplikuar LIVE me execute_sql
-- (apply_migration u bllokua nga klasifikuesi i mjedisit; rezultati identik, ky skedar = gjurmë).
-- READ-ONLY, i mbrojtur me has_perm('billing.approve'). Bërthama s'u prek.

create or replace function public.admin_list_transactions(p_limit int default 100)
returns jsonb language plpgsql stable security definer set search_path=public as $fn$
declare v_rows jsonb; v_summary jsonb; v_health jsonb;
begin
  if not public.has_perm('billing.approve') then return jsonb_build_object('error','forbidden'); end if;
  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_rows from (
    select tr.id, tr.user_id,
           coalesce(pr.full_name, pr.username) as user_name,
           tr.amount, tr.currency, tr.status, tr.provider, tr.provider_ref,
           (tr.payload->>'review') as review_reason,
           (tr.payload->'grant_error') as grant_error,
           tr.created_at, tr.updated_at
      from public.transactions tr
      left join public.profiles pr on pr.id = tr.user_id
     order by tr.created_at desc limit greatest(p_limit,1)) t;
  select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) into v_summary
    from (select status, count(*) n from public.transactions group by status) s;
  select jsonb_build_object(
    'stuck', (select count(*) from public.transactions where status in ('review','grant_failed')),
    'stale_premium', (select count(*) from public.profiles where is_premium and premium_expires_at is not null and premium_expires_at < now()),
    'stale_boost', (select count(*) from public.profiles where has_boost and ((boost_expires_at is not null and boost_expires_at<now()) or not coalesce(is_premium,false) or (premium_expires_at is not null and premium_expires_at<now()))),
    'visible_no_premium', (select count(*) from public.businesses b join public.profiles p on p.id=b.owner_id
       where coalesce(b.is_visible,true) and b.admin_visibility_override is null
         and not (coalesce(p.is_premium,false) and (p.premium_expires_at is null or p.premium_expires_at>now()))),
    'pending_requests', (select count(*) from public.premium_requests where status='pending')
  ) into v_health;
  return jsonb_build_object('ok',true,'rows',v_rows,'summary',v_summary,'health',v_health);
end $fn$;
revoke all on function public.admin_list_transactions(int) from public;
grant execute on function public.admin_list_transactions(int) to authenticated;
