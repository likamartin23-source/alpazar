-- PAGESA P5 (Martinel, 26 gusht 2026): VERSIONIM i funksioneve që ekzistonin VETËM live
-- (pikë e verbër auditimi — Avatar.tsx:55-59 e paralajmëronte). Këtu regjistrohen VERBATIM
-- ashtu si janë në prodhim, që: (a) të rishikohen në kod, (b) të rikthehen (rollback),
-- (c) të rikrijohen në një DB të re. NUK ndryshojnë sjelljen — janë kopje identike e live-it,
-- ndaj re-aplikimi është no-op. E vërteta operative e tier-it = owner_rank_tier; kopja klient
-- tierNgaProfili (Avatar.tsx) DUHET të përputhet me këtë.

-- Tier-i i pronarit (0 free · 1 premium · 2 VIP Ekstra Boost), NDERON skadimin on-read.
create or replace function public.owner_rank_tier(p_user uuid)
returns smallint language sql stable security definer set search_path to 'public' as $function$
  select case
    when coalesce(p.has_boost,false) and (p.boost_expires_at is null or p.boost_expires_at > now())
         and coalesce(p.is_premium,false) and (p.premium_expires_at is null or p.premium_expires_at > now())
      then 2::smallint
    when coalesce(p.is_premium,false) and (p.premium_expires_at is null or p.premium_expires_at > now())
      then 1::smallint
    else 0::smallint end
  from public.profiles p where p.id = p_user
$function$;

-- Prefiks i dimming-ut automatik (dallon errësimin auto nga ai i adminit).
create or replace function public._biz_dim_auto_prefix()
returns text language sql immutable security definer set search_path to 'public'
as $function$ select '[auto] '::text $function$;

-- A duhet të jetë i dukshëm biznesi: aktiv DHE (s'kërkohet premium OSE pronari ka tier>=1).
create or replace function public.business_should_be_visible(p_owner uuid, p_active boolean)
returns boolean language sql stable security definer set search_path to 'public' as $function$
  select coalesce(p_active, true) and (
    coalesce((select nullif(value,'') from public.app_config where key='business_requires_premium'),'true') <> 'true'
    or coalesce(public.owner_rank_tier(p_owner), 0) >= 1
  )
$function$;

-- Propago tier-in te listings.rank_tier/is_premium + rregullo dukshmërinë e bizneseve
-- kur ndryshon entitlementi i pronarit. Trigger AFTER UPDATE OF flamujt/afatet te profiles.
create or replace function public.tg_propagate_rank_to_listings()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare t smallint;
begin
  t := coalesce(public.owner_rank_tier(NEW.id), 0);

  update public.listings
     set rank_tier = t, is_premium = (t >= 1)
   where user_id = NEW.id
     and (rank_tier is distinct from t or is_premium is distinct from (t >= 1));

  update public.businesses b
     set is_visible = public.business_should_be_visible(b.owner_id, b.is_active),
         dimmed_at = case when public.business_should_be_visible(b.owner_id, b.is_active)
                          then null else coalesce(b.dimmed_at, now()) end,
         dim_reason = case when public.business_should_be_visible(b.owner_id, b.is_active)
                           then null else 'abonimi Premium nuk eshte aktiv' end
   where b.owner_id = NEW.id
     and b.is_visible is distinct from public.business_should_be_visible(b.owner_id, b.is_active);

  return null;
end $function$;

drop trigger if exists trg_propagate_rank on public.profiles;
create trigger trg_propagate_rank
  after update of is_premium, has_boost, premium_expires_at, boost_expires_at
  on public.profiles for each row execute function public.tg_propagate_rank_to_listings();
