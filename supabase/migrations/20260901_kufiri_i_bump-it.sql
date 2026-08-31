-- KUFIRI I RIFRESKIMIT (BUMP)
--
-- GJENDJA E MATUR (31 gusht 2026): `created_at` dhe `last_bumped_at` te
-- `listings` jane te shkrueshme nga klienti — dhe kjo eshte E QELLIMSHME:
-- "Rifresko" e ngre shpalljen ne krye duke rivendosur moshen e saj
-- (`profile/page.tsx:418`, `BiznesPageClient:397`, `ListingPageClient:213`).
-- Vecoria eshte e projektuar; ajo qe mungonte ishte KUFIRI. Pa te, nje shpallje
-- rri perhere e para me nje cikel te thjeshte klikimesh, dhe renditja
-- kronologjike — premtimi i heshtur i cdo tregu — pushon se qeni e vertete.
--
-- PSE KETU NJE TRIGER PUNON, NDERSA TE METRIKAT JO:
-- rregullimi i metrikave u desh me te drejta kolonash sepse ato kolona i
-- shkruajne edhe rruget e sistemit (`increment_listing_views` etj.), dhe nje
-- triger nuk e dallon dot sistemin nga klienti. Bump-i nuk ka rruge sistemi:
-- e shkruan VETEM klienti. Prandaj krahasimi `OLD`/`NEW` mjafton, dhe eshte
-- me i mire — jep mesazh te lexueshem ne shqip, jo "permission denied".
--
-- SHKALLEZIMI eshte leve monetizimi, jo denim: falas 24 ore, Premium 6, VIP 3.
-- Vlerat rrine te `app_config` (§2.9), qe pronari t'i ndryshoje pa kod.

begin;

insert into public.app_config(key, value, type, description)
select * from (values
  -- 168 ore = 7 dite: SJELLJA E SOTME e produktit, qe ishte e ngurtesuar te
  -- `profile/page.tsx` (`canBump`). Nje auditim nuk e ndryshon fshehurazi nje
  -- vendim tregtar; Premium dhe VIP marrin perparesine.
  ('bump_min_hours_free',    '168', 'number', 'Sa ore mes dy rifreskimeve — llogari pa pagese (7 dite).'),
  ('bump_min_hours_premium', '24',  'number', 'Sa ore mes dy rifreskimeve — Premium.'),
  ('bump_min_hours_vip',     '6',   'number', 'Sa ore mes dy rifreskimeve — VIP Ekstra Boost.')
) as v(key,value,type,description)
where not exists (select 1 from public.app_config c where c.key = v.key);

create or replace function public.guard_listing_bump()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp' as $fn$
declare
  v_tier smallint;
  v_ore  numeric;
  v_i_fundit timestamptz;
  v_mbetur numeric;
begin
  -- Rifreskim = ngritja e `last_bumped_at` OSE rivendosja e `created_at`.
  if NEW.last_bumped_at is not distinct from OLD.last_bumped_at
     and NEW.created_at is not distinct from OLD.created_at then
    return NEW;
  end if;

  -- Rruget e sistemit dhe moderatoret kalojne.
  if coalesce(current_setting('app.skip_privilege_guard', true), '') = 'true' then return NEW; end if;
  if current_setting('role', true) = 'service_role' then return NEW; end if;
  if public.has_perm('content.moderate') then return NEW; end if;

  v_tier := coalesce(public.owner_rank_tier(NEW.user_id), 0);
  v_ore := coalesce(nullif((select value from public.app_config where key =
             case when v_tier >= 2 then 'bump_min_hours_vip'
                  when v_tier >= 1 then 'bump_min_hours_premium'
                  else 'bump_min_hours_free' end), '')::numeric,
           case when v_tier >= 2 then 6 when v_tier >= 1 then 24 else 168 end);

  if v_ore <= 0 then return NEW; end if;

  v_i_fundit := greatest(coalesce(OLD.last_bumped_at, OLD.created_at), OLD.created_at);
  if v_i_fundit is null then return NEW; end if;

  if v_i_fundit > now() - make_interval(mins => (v_ore * 60)::int) then
    -- Kufizuar te `v_ore`: pa te, `now()` (koha e transaksionit) kundrejt nje
    -- vlere te shkruar nga klienti jep nje ore me shume se kufiri.
    v_mbetur := least(v_ore, greatest(1,
      ceil(extract(epoch from (v_i_fundit + make_interval(mins => (v_ore * 60)::int) - now())) / 3600.0)));
    if v_mbetur >= 48 then
      raise exception 'Shpallja u rifreskua se fundmi. Provo perseri pas % ditesh.', ceil(v_mbetur / 24.0)
        using errcode = 'check_violation';
    else
      raise exception 'Shpallja u rifreskua se fundmi. Provo perseri pas % ore.', v_mbetur
        using errcode = 'check_violation';
    end if;
  end if;

  return NEW;
end $fn$;

drop trigger if exists trg_guard_listing_bump on public.listings;
create trigger trg_guard_listing_bump
  before update on public.listings
  for each row execute function public.guard_listing_bump();

revoke all on function public.guard_listing_bump() from public, anon, authenticated;

-- BURIM I VETEM: `get_my_entitlements()` — RPC-ja qe tashme pergjigjet "cilat
-- jane kufijte e mi" — merr edhe `bump_min_hours`, me TE NJEJTIN zinxhir
-- vendimi si trigeri. Nderfaqja e lexon prej andej; asnje numer nuk rri me i
-- ngurtesuar ne kod. (Perkufizimi i plote u aplikua me migrimin
-- `bump_burim_i_vetem`; shihe me `pg_get_functiondef`.)

commit;
