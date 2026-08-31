-- Faza 6 (DB): numerimi i shpalljeve TE SHITURA — biznes dhe person.
-- Social proof (jo fshehje): sa shitje ka kryer nje entitet. status='sold'
-- ekziston tashme te listing_status enum; agregim me funksion (jo N+1).
-- Additive, read-only, SECURITY DEFINER (numri shfaqet publikisht si reputacion).
--
-- Person: vetem shpalljet personale (business_id is null) — perputhet me ndarjen
-- e identitetit te Fazes 1 (profili tregon vetem personalen; biznesi ka faqen e vet).
create or replace function public.business_sold_count(p_business uuid)
returns integer language sql stable security definer set search_path=public as $f$
  select count(*)::int from public.listings where business_id=p_business and status='sold'
$f$;

create or replace function public.user_sold_count(p_user uuid)
returns integer language sql stable security definer set search_path=public as $f$
  select count(*)::int from public.listings where user_id=p_user and status='sold' and business_id is null
$f$;

revoke all on function public.business_sold_count(uuid) from public;
revoke all on function public.user_sold_count(uuid) from public;
grant execute on function public.business_sold_count(uuid) to anon, authenticated;
grant execute on function public.user_sold_count(uuid) to anon, authenticated;
