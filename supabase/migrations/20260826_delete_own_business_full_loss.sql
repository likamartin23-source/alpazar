-- BLLOKU PËRFUNDIMTAR 2 §B7 (vendim Martinel, konfirmuar 26 gusht 2026): Fshij Biznesin = HUMBJE E PLOTË.
-- Aplikuar live: 26 gusht 2026 (verifikuar: grante anon=false, authenticated=true; skema:
-- reviews.listing_id, business_followers, listings.status/is_active, FK listings_business_id_fkey=SET NULL).
-- Ndryshim nga sjellja e mëparshme (business_id=null që i mbante shpalljet aktive te profili personal):
-- tani shpalljet e biznesit çaktivizohen PËRFUNDIMISHT (status='deleted', is_active=false) — NUK kalojnë
-- aktive te personal; vlerësimet e tyre fshihen; ndjekësit + harta e nënkategorive hiqen; biznesi fshihet.
-- Vetëm-pronar (owner===auth.uid()); anon JO. Të dhënat personale + pagesat s'preken.
-- I kthyeshëm (si përkufizim): riktheje versionin e mëparshëm nga 20260825_business_profile_full_fields.sql.

create or replace function public.delete_own_business(p_business_id uuid)
returns void language plpgsql security definer set search_path=public as $fn$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.businesses where id = p_business_id;
  if v_owner is null then raise exception 'not_found'; end if;
  if v_owner <> auth.uid() then raise exception 'forbidden'; end if;

  -- 1) Vlerësimet e shpalljeve të biznesit → fshihen (para fshirjes së biznesit).
  delete from public.reviews
    where listing_id in (select id from public.listings where business_id = p_business_id);

  -- 2) Shpalljet e biznesit → çaktivizim PËRFUNDIMTAR (jo aktive te personal).
  update public.listings
    set is_active = false, status = 'deleted'
    where business_id = p_business_id;

  -- 3) Ndjekësit + harta e nënkategorive → hiqen.
  delete from public.business_followers where business_id = p_business_id;
  delete from public.business_subcategory_map where business_id = p_business_id;

  -- 4) Biznesi → fshihet (FK SET NULL ia heq business_id shpalljeve tashmë të çaktivizuara).
  delete from public.businesses where id = p_business_id;
end;
$fn$;
revoke all on function public.delete_own_business(uuid) from public;
grant execute on function public.delete_own_business(uuid) to authenticated;
