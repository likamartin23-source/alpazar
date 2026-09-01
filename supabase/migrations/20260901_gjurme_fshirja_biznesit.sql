-- GJURMË AUDITI PËR FSHIRJEN E VETË-BIZNESIT (§8 + §2.6, Ligji 10273/2010)
--
-- Gjetje e terminalit (mbyllje-2): `delete_own_business` — veprim shkatërrues i
-- pakthyeshëm nga pronari — NUK linte asnjë gjurmë (as admin_log, as audit_logs),
-- ndërsa rruga e adminit (`admin_delete_business`) e regjistron. Në mosmarrëveshje
-- "biznesi im u fshi", s'kishte provë. §8 kërkon gjurmë për çdo veprim shkatërrues;
-- §2.6 e bën `audit_logs` provë të pandryshueshme.
--
-- Përdoret `audit_logs` (jo `admin_log`): pronari s'është admin, dhe `admin_logs.admin_id`
-- është NOT NULL (do të humbte në heshtje — §1.4). `audit_logs.actor_id` lejon çdo aktor.
--
-- Trupi tjetër është IDENTIK me funksionin LIVE (përfshi fshirjen e `reviews` — që
-- migrimet e repo-s nuk e pasqy ronin: drift DB↔repo, i mbyllur këtu). Additive/idempotent.

begin;

create or replace function public.delete_own_business(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_owner uuid;
  v_snap  jsonb;
begin
  select owner_id into v_owner from public.businesses where id = p_business_id;
  if v_owner is null then raise exception 'not_found'; end if;
  if v_owner <> auth.uid() then raise exception 'forbidden'; end if;

  -- 0) GJURMË PARA shkatërrimit — fotografia e biznesit si provë (old_data).
  select to_jsonb(b) into v_snap from public.businesses b where b.id = p_business_id;
  insert into public.audit_logs(actor_id, action, target_type, target_id, old_data)
    values (auth.uid(), 'business.delete_own', 'business', p_business_id, v_snap);

  -- 1) Vlerësimet e shpalljeve të biznesit → fshihen (para se listings.business_id të bjerë).
  delete from public.reviews
    where listing_id in (select id from public.listings where business_id = p_business_id);

  -- 2) Shpalljet → çaktivizim përfundimtar (jo aktive te personal).
  update public.listings
    set is_active = false, status = 'deleted'
    where business_id = p_business_id;

  -- 3) Ndjekësit + harta e nënkategorive → hiqen.
  delete from public.business_followers where business_id = p_business_id;
  delete from public.business_subcategory_map where business_id = p_business_id;

  -- 4) Biznesi → fshihet (FK SET NULL ia heq business_id shpalljeve të çaktivizuara).
  delete from public.businesses where id = p_business_id;
end;
$function$;

commit;

-- VERIFIKIM PAS APLIKIMIT:
--   fshije një biznes prove si pronari → një rresht i ri te `audit_logs` me
--   action='business.delete_own', target_id=<id>, old_data=<snapshot>.
