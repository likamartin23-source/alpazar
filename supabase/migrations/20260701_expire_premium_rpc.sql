-- expire-premium cron without a service-role key (SECURITY DEFINER, idempotent).
create or replace function public.expire_premium_run()
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  update profiles
     set is_premium = false, premium_expires_at = null
   where is_premium = true and premium_expires_at is not null and premium_expires_at < now();
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.expire_premium_run() from public;
grant  execute on function public.expire_premium_run() to anon, authenticated;
