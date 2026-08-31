-- KAPJE DRIFT-i (26 gusht 2026): dukshmeria e shpalljeve e lidhur me Premium-in e biznesit.
--
-- KONTEKST: gjendja LIVE e prodhimit e ka politiken `listings_select` dhe funksionin
-- `business_is_visible()` te lidhur me `businesses.is_visible` (biznesi erresohet kur bie
-- Premium; rikthehet kur riaktivizohet — model i konfirmuar shprehimisht nga pronari me
-- 26 gusht 2026). POR keto dy objekte ekzistonin VETEM ne baze, jo ne migrimet e repo-s:
-- repo dokumentonte ende `listings_select_active = is_active` te supabase_schema.sql.
-- Nje rindertim nga repo do ta zhbente ne heshtje modelin (bizneset do dukeshin pa Premium).
--
-- QELLIMI: kap besnikerisht gjendjen LIVE ne repo per riprodhueshmeri dhe rishikim.
-- Ky skedar eshte KOPJE BYTE-BESNIKE e objekteve live (matur me pg_get_functiondef /
-- pg_get_expr me 26 gusht 2026). Aplikimi eshte idempotent dhe NUK ndryshon sjelljen live
-- (objektet ekzistojne tashme identike); vlen per rindertim nga zero.
--
-- Sjellja: shpalljet personale (business_id IS NULL) duken gjithnje kur is_active;
-- shpalljet e biznesit duken vetem kur `businesses.is_visible = true`; pronari dhe admini
-- shohin gjithnje te vetat. Fikja/rikthimi i `is_visible` qeveriset nga cron-et e Premium-it
-- (business_should_be_visible → p5_versionim_rank_visibility.sql / p7_cikli_plote_vip.sql).

-- 0) Kolonat e dukshmerise te `businesses` — ekzistojne LIVE por asnje migrim i repo-s s'i
--    krijon; pa to, ky funksion (dhe UPDATE-i i p5 mbi dimmed_at/dim_reason) deshton ne nje
--    rindertim nga zero me "column ... does not exist" (check_function_bodies). Ky skedar renditet
--    para `pagesa_p5` alfabetikisht, ndaj kolonat behen gati per te dyja. Idempotent (no-op live).
alter table public.businesses add column if not exists is_visible boolean not null default true;
alter table public.businesses add column if not exists dimmed_at timestamptz;
alter table public.businesses add column if not exists dim_reason text;

-- 1) Funksioni ndihmes i RLS-se (business_id NULL → true; perndryshe businesses.is_visible)
create or replace function public.business_is_visible(p_business_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select case
    when p_business_id is null then true
    else coalesce((select b.is_visible from public.businesses b where b.id = p_business_id), true)
  end
$function$;

-- 2) Politika e leximit: aktive+biznes-i-dukshem OSE pronar OSE admin
drop policy if exists listings_select on public.listings;
create policy listings_select on public.listings
  for select
  using (
    ((is_active = true) and business_is_visible(business_id))
    or ((select auth.uid()) = user_id)
    or is_admin()
  );
