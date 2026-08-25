-- BLLOKU I PËRMIRËSUAR — Sistemi i gjurmimit të metrikave të analitikës
-- (impresione, reach, ndarje, kontakt i ndarë). Additive, i kthyeshëm.
-- Aplikuar: 25 gusht 2026 (verifikuar: RLS on, authenticated EXECUTE, anon JO).
--
-- Vizitat gjurmohen tashmë te `listing_views`; kontaktet (mesazhe) te `messages`;
-- saves te `favorites`; followers te `follows`. Kjo shton VETËM ngjarjet që
-- mungonin: impression/share/contact_whatsapp/contact_viber/contact_phone/notify.
--
-- Rollback: drop function public.analytics_extra(int);
--           drop table public.analytics_events;

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  listing_id uuid references public.listings(id) on delete cascade,
  owner_id uuid not null,
  actor_id uuid,
  ip_hash text,
  kind text not null check (kind in ('impression','share','contact_whatsapp','contact_viber','contact_phone','notify')),
  created_at timestamptz not null default now()
);
create index if not exists idx_ae_owner_kind_time on public.analytics_events (owner_id, kind, created_at desc);
create index if not exists idx_ae_listing_kind_time on public.analytics_events (listing_id, kind, created_at desc);

-- RLS: pronari lexon vetëm ngjarjet e veta; klientët NUK fusin dot (vetëm
-- /api/track me service_role e bën insert, që të mos falsifikohet owner_id).
alter table public.analytics_events enable row level security;
drop policy if exists ae_owner_select on public.analytics_events;
create policy ae_owner_select on public.analytics_events for select to authenticated using (owner_id = auth.uid());

-- Agregim i efektshëm në SQL (jo tërheqje rreshtash), i kufizuar te auth.uid().
create or replace function public.analytics_extra(p_days int)
returns json language sql security definer set search_path=public stable as $fn$
  with lim as (select greatest(least(coalesce(p_days,30),90),1) as d),
  since as (select now() - ((select d from lim) || ' days')::interval as t),
  ev as (
    select kind, actor_id, ip_hash from public.analytics_events
    where owner_id = auth.uid() and created_at >= (select t from since)
  )
  select json_build_object(
    'impressions', (select count(*) from ev where kind='impression'),
    'reach', (select count(distinct coalesce(actor_id::text, ip_hash)) from ev where kind='impression'),
    'shares', (select count(*) from ev where kind='share'),
    'contacts_whatsapp', (select count(*) from ev where kind='contact_whatsapp'),
    'contacts_viber', (select count(*) from ev where kind='contact_viber'),
    'contacts_phone', (select count(*) from ev where kind='contact_phone'),
    'notify', (select count(*) from ev where kind='notify'),
    'saves', (select count(*) from public.favorites f join public.listings l on l.id=f.listing_id where l.user_id=auth.uid() and f.created_at >= (select t from since)),
    'followers', (select count(*) from public.follows fo where fo.following_id = auth.uid())
  );
$fn$;
-- Kurthi #1: revoke nga PUBLIC, pastaj grant shprehimisht vetëm authenticated.
revoke all on function public.analytics_extra(int) from public;
grant execute on function public.analytics_extra(int) to authenticated;

-- Ingestion: Vercel S'KA service_role → përdorim RPC SECURITY DEFINER (si
-- expire_premium). Kalon RLS-në; owner_id derivohet nga listing (s'falsifikohet);
-- actor_id = auth.uid() (null për anon); ip_hash vjen nga /api/track. Kind i
-- pavlefshëm ose listing i panjohur → injorohet (fail-soft). Grant anon+authenticated
-- sepse impresionet vijnë edhe nga vizitorë të pakyçur.
create or replace function public.track_event(p_listing_id uuid, p_kind text, p_ip_hash text default null)
returns void language plpgsql security definer set search_path=public as $fn$
declare v_owner uuid;
begin
  if p_kind not in ('impression','share','contact_whatsapp','contact_viber','contact_phone','notify') then
    return;
  end if;
  select user_id into v_owner from public.listings where id = p_listing_id;
  if v_owner is null then return; end if;
  insert into public.analytics_events(listing_id, owner_id, actor_id, ip_hash, kind)
  values (p_listing_id, v_owner, auth.uid(), p_ip_hash, p_kind);
end;
$fn$;
revoke all on function public.track_event(uuid,text,text) from public;
grant execute on function public.track_event(uuid,text,text) to anon, authenticated;
-- Rollback shtesë: drop function public.track_event(uuid,text,text);
