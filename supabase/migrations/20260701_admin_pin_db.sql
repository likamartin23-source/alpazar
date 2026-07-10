-- Admin PIN in DB (admin_settings.admin_pin) verified via SECURITY DEFINER RPC,
-- so /api/admin/verify needs no ADMIN_PIN env or service-role key. Value = 000000.
insert into admin_settings(key, value) values ('admin_pin', '000000')
  on conflict (key) do update set value = excluded.value;

create or replace function public.verify_admin_pin(p_pin text)
returns boolean
language sql security definer set search_path = public, pg_temp as $$
  select exists (select 1 from admin_settings where key = 'admin_pin' and value = p_pin);
$$;
revoke execute on function public.verify_admin_pin(text) from public;
grant  execute on function public.verify_admin_pin(text) to anon, authenticated;
