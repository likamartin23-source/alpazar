-- BLLOKU PËRFUNDIMTAR §3.8 — Fushat e plota profesionale të biznesit.
-- Additive, nullable, backward-compatible. S'prek RLS as të dhënat ekzistuese.
-- Aplikuar: 25 gusht 2026 (verifikuar në transaksion rollback: 12 kolona shtohen).
-- Rollback: alter table public.businesses drop column <col>; (për secilën më poshtë).
--
-- Ekzistojnë tashmë: logo_url, cover_url, description, hours(jsonb), city, address,
-- latitude, longitude, phone, email, website, nipt, withdrawal_days, type.

alter table public.businesses
  add column if not exists tagline text,            -- Slogan/Moto
  add column if not exists founded_year smallint,   -- Viti i themelimit
  add column if not exists whatsapp text,           -- WhatsApp/Viber
  add column if not exists contact_person text,      -- Personi i kontaktit
  add column if not exists gallery jsonb,           -- Galeria (array URL)
  add column if not exists socials jsonb,           -- {instagram,facebook,tiktok}
  add column if not exists service_area text,        -- Zona e shërbimit
  add column if not exists delivery jsonb,          -- {ka:bool, detaje:text}
  add column if not exists legal_form text,          -- Forma ligjore
  add column if not exists payment_methods jsonb,   -- array metodash
  add column if not exists return_policy text,       -- Politika e kthimit
  add column if not exists warranty text;            -- Garancia

-- §3.9 — Fshirja e biznesit, VETËM pronari (server-side owner===auth.uid()).
-- GDPR-safe: shpalljet shkëputen (business_id=null), s'fshihen. Vercel s'ka
-- service_role → RPC SECURITY DEFINER. anon JO (verifikuar). Rollback:
-- drop function public.delete_own_business(uuid);
create or replace function public.delete_own_business(p_business_id uuid)
returns void language plpgsql security definer set search_path=public as $fn$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.businesses where id = p_business_id;
  if v_owner is null then raise exception 'not_found'; end if;
  if v_owner <> auth.uid() then raise exception 'forbidden'; end if;
  update public.listings set business_id = null where business_id = p_business_id;
  delete from public.business_subcategory_map where business_id = p_business_id;
  delete from public.follows where following_id = p_business_id;
  delete from public.businesses where id = p_business_id;
end;
$fn$;
revoke all on function public.delete_own_business(uuid) from public;
grant execute on function public.delete_own_business(uuid) to authenticated;
