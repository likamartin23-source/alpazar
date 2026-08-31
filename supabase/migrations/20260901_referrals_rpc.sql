-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  PARAKUSHT i profiles_ngushtimi_pas_deploy. Aplikohet PARA ose BASHKE me   │
-- │  narrowing-un e `profiles`. (apply_migration bllokohet nga klasifikuesi i  │
-- │  auto-mode — e ekzekuton pronari ne sesion te autorizuar.)                 │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- my_referrals(): kush u referua nga perdoruesi aktual. Faqja `/referral` e lexonte
-- me `.in('referred_by', codes)` — filter mbi kolonen e ndaluar `referred_by` mbi
-- rreshtat e TE TJEREVE. Pas narrowing-ut ai lexim ndalohet; ky RPC (SECURITY DEFINER)
-- e ben te sigurt dhe e mban vecorine te gjalle. Pa parametra — i llogarit kodet e
-- auth.uid() vete, ndaj s'zbulon dot referrale te dikujt tjeter.

create or replace function public.my_referrals()
returns table(id uuid, full_name text, username text, created_at timestamptz)
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $fn$
  with me as (
    select referral_code, username from public.profiles where id = auth.uid()
  )
  select p.id, p.full_name, p.username, p.created_at
  from public.profiles p, me
  where p.referred_by is not null
    and p.referred_by in (me.referral_code, me.username)
  order by p.created_at desc
  limit 50;
$fn$;

-- §1.1: hiq nga PUBLIC, pastaj jep shprehimisht (modeli {postgres,service_role}+authenticated).
revoke all on function public.my_referrals() from public;
grant execute on function public.my_referrals() to authenticated;
