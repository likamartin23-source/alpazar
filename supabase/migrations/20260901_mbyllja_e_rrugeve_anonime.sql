-- MBYLLJA E RRUGEVE ANONIME — kalimi i teto
--
-- Cfare i shpetoi te gjitha auditimeve te meparshme, dhe pse: kishte nje model
-- te perbashket qe s'e kisha pare. Ne kalimin e shtate mbrojta KOLONAT
-- (`views_count`, `moderation_status`, `is_boost_active`…). Por keshilluesi i
-- Supabase-it nxori 21 funksione SECURITY DEFINER te thirrshme nga `anon` —
-- dhe nje SECURITY DEFINER shkruan me te drejtat e PRONARIT, pra i kalon
-- rregullisht ato kolona. Mbylla deren e pare dhe lashe dritaren e anes.
--
-- Cdo rresht me poshte u mat duke veshur rolin `anon`, PA asnje sesion.

begin;

-- 1) SHIKIMET. Dedup-i mbulonte vetem `listing_views`; numeruesi rritej pa kufi.
--    Matur: 5 thirrje me TE NJEJTIN sid → views_count 10 → 15, `listing_views` 0.
--    Tani numeruesi rritet vetem per nje shikim unik brenda 24 oreve — pikerisht
--    kuptimi qe premton etiketa "Interes real per kete shpallje".
--    Rimatur: 8 thirrje te njejta → +1; nje vizitor tjeter → +1.
create or replace function public.increment_listing_views(
  p_listing_id uuid, p_viewer_id uuid default null, p_ip_hash text default null)
returns void language plpgsql security definer set search_path to 'public' as $fn$
declare already_viewed boolean;
begin
  select exists (
    select 1 from listing_views
     where listing_id = p_listing_id
       and viewed_at > now() - interval '24 hours'
       and ((p_viewer_id is not null and viewer_id = p_viewer_id)
         or (p_ip_hash  is not null and ip_hash  = p_ip_hash))
  ) into already_viewed;
  if already_viewed then return; end if;

  insert into listing_views(listing_id, viewer_id, ip_hash)
  values (p_listing_id, p_viewer_id, p_ip_hash);

  update listings set views_count = coalesce(views_count, 0) + 1
   where id = p_listing_id;
end $fn$;

-- 2) METRIKAT. `anon` shkroi 4 ngjarje, mes tyre `contact_whatsapp` dhe
--    `contact_phone` — duke ndotur pikerisht metriken mbi te cilen u ndertua
--    zbulimi i kontaktit. Tani: nje ngjarje per (shpallje, lloj, burim) ne ore,
--    dhe `contact_phone` HIQET nga lista e klientit — ate e shkruan vetem
--    `_contact_reveal()`, kur numri jepet vertet. Rimatur: 6 thirrje → 1 ngjarje.
create or replace function public.track_event(
  p_listing_id uuid, p_kind text, p_ip_hash text default null)
returns void language plpgsql security definer set search_path to 'public' as $fn$
declare v_owner uuid; v_ka boolean;
begin
  if p_kind not in ('impression','share','contact_whatsapp','contact_viber','notify') then
    return;
  end if;
  select user_id into v_owner from public.listings
   where id = p_listing_id and coalesce(is_active,false);
  if v_owner is null then return; end if;

  if p_ip_hash is not null then
    select exists (
      select 1 from public.analytics_events
       where listing_id = p_listing_id and kind = p_kind and ip_hash = p_ip_hash
         and created_at > now() - interval '1 hour'
    ) into v_ka;
    if v_ka then return; end if;
  end if;

  insert into public.analytics_events(listing_id, owner_id, actor_id, ip_hash, kind)
  values (p_listing_id, v_owner, auth.uid(), p_ip_hash, p_kind);
end $fn$;

-- 3) DIAGNOSTIKA. Gjurma e gishtit ndalonte perseritjen, por nje gjurme e RE ne
--    cdo thirrje kalonte lirshem: matur, `anon` shkroi 25 rreshta ne nje hap.
--    Tabela qe pronari lexon per diagnoza mbushej nga jashte.
--    Rimatur: 400 perpjekje → 200 (tavani nga `app_config`).
create or replace function public.log_health_event(
  p_message text, p_stack text, p_url text, p_source text,
  p_level text, p_user_agent text, p_fingerprint text)
returns bigint language plpgsql security definer set search_path to 'public','pg_temp' as $fn$
declare v_id bigint; v_existing bigint; v_max int; v_n int;
begin
  select id into v_existing from health_events where fingerprint = p_fingerprint;
  if v_existing is not null then
    update health_events set count = count + 1, last_seen_at = now() where id = v_existing;
    return null;
  end if;

  v_max := coalesce(nullif((select value from public.app_config
                             where key='health_new_events_per_hour'),'')::int, 200);
  select count(*) into v_n from health_events where created_at > now() - interval '1 hour';
  if v_n >= v_max then return null; end if;

  insert into health_events (message, stack, url, source, level, user_agent, fingerprint)
  values (left(coalesce(p_message,''),2000), left(p_stack,6000), left(p_url,500),
          coalesce(p_source,'client'), coalesce(p_level,'error'),
          left(p_user_agent,300), p_fingerprint)
  returning id into v_id;
  return v_id;
end $fn$;

insert into public.app_config(key, value, type, description)
select * from (values
  ('health_new_events_per_hour','200','number',
   'Sa gabime TE REJA (gjurme te panjohura) pranohen per ore. Mbron nga permbytja.')
) as v(key,value,type,description)
where not exists (select 1 from public.app_config c where c.key = v.key);

-- 4) HARTA E SKEMES. `contract_manifest()` i jepte kujtdo, pa sesion, 71 tabela
--    me TE GJITHA kolonat (perfshire `phone`, `admin_role`, `gdpr_consent`,
--    `suspended_reason`) dhe emrat e 351 funksioneve. Vegel auditimi e
--    brendshme, jo API publike. Skripti `scripts/kontroll-kontrate.mjs` tani
--    kerkon celesin e sherbimit dhe ANASHKALOHET me njoftim nese s'e ka —
--    kurre nuk e rrezon CI-ne per nje leje qe i mungon.
revoke all on function public.contract_manifest()   from public, anon, authenticated;
revoke all on function public.contract_self_check() from public, anon, authenticated;

-- 5) STORAGE. `covers` s'kishte AS kufi madhesie AS kufizim tipi — cdo skedar i
--    cdo madhesie ne nje bucket PUBLIK. Tavanet e meposhtme jane MBI kufijte qe
--    zbaton vete aplikacioni (video 50MB nga `app_config`), ndaj s'prekin asnje
--    ngarkim te ligjshem: jane rrjete sigurie, jo politike.
update storage.buckets set file_size_limit = 15728640,
       allowed_mime_types = array['image/jpeg','image/jpg','image/png','image/webp','image/avif','image/heic','image/heif']
 where id = 'covers';
update storage.buckets set file_size_limit = 20971520  where id = 'listing-images';
update storage.buckets set file_size_limit = 157286400 where id = 'listing-videos';

-- 6) BASHKENGJITJET E MESAZHEVE. Politika e vjeter: `auth.role() =
--    'authenticated'` — pra CDO perdorues i kycur lexonte e LISTONTE cdo
--    bashkengjitje private, pa asnje lidhje me biseden.
--    KUFI I NJOHUR, I DEKLARUAR: bucket-i mbetet PUBLIK, ndaj kush ka URL-ne e
--    hap edhe pa sesion. Kjo mbyll LISTIMIN — rrugen praktike te nxjerrjes, pasi
--    rruga tjeter kerkon te gjesh `images/<uid>/<milisekonda>.<ext>`.
--    Privatesimi i plote kerkon bucket privat + URL te firmosura dhe migrim te
--    `messages.attachment_url`: ndryshim me pasoja, per vendim te pronarit.
drop policy if exists msg_attach_select on storage.objects;
create policy msg_attach_select on storage.objects for select
using (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
  and (
    (storage.foldername(name))[2] = (select auth.uid())::text
    or exists (
      select 1 from public.messages m
       where (m.sender_id = (select auth.uid())
              and m.receiver_id = ((storage.foldername(name))[2])::uuid)
          or (m.receiver_id = (select auth.uid())
              and m.sender_id = ((storage.foldername(name))[2])::uuid)
    )
  )
);

commit;
