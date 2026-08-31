-- OFERTAT — mbyllja e qarkut
--
-- GJENDJA E MATUR (31 gusht 2026, para kesaj nderhyrjeje):
--   · `offers` ekzistonte me 11 kolona, 4 indekse, 4 politika RLS, 0 rreshta.
--   · `notifications.type` PERMBANTE tashme `offer_received`, `offer_accepted`,
--     `offer_rejected` — pra ofertat jane vecori e projektuar nga pronari, jo
--     dicka e shpikur ketu. Kjo eshte plotesim, jo zgjerim i objektit.
--   · Asnje rresht i `app/` ose `lib/` nuk e prekte tabelen. Asnje funksion.
--
-- TRI VRIMA TE MATURA NE RLS-ne EKZISTUESE (arsyeja pse nuk mjaftonte
-- thjesht t'i vihej nderfaqe siper):
--   1. `status` ishte `text` PA kufizim — cdo vlere e shkruesheme.
--   2. Politika UPDATE `using (buyer_id = uid or seller_id = uid)` pa asnje
--      kufizim per kolonen: BLERESI mund ta pranonte VETE oferten e vet
--      (`status='accepted'`), ose ta ndryshonte `amount` pas pranimit.
--   3. Politika INSERT kontrollonte VETEM `buyer_id = auth.uid()`: `seller_id`
--      dhe `listing_id` vinin nga klienti, pra nje bleres mund te fabrikonte
--      nje oferte kunder nje shitesi qe s'e zoteron shpalljen.
--
-- Nje politike RLS nuk e shpreh dot "OLD.status kunder NEW.status"; prandaj
-- makina e gjendjeve zbatohet me TRIGER, dhe RLS-ja mbetet porta e pare.

begin;

-- ---------------------------------------------------------------- 1. Gjendjet
alter table public.offers drop constraint if exists offers_status_ck;
alter table public.offers add constraint offers_status_ck
  check (status in ('pending','accepted','rejected','withdrawn','expired'));

-- ------------------------------------------------------------ 2. Konfigurimi
-- Rregulli §2.9: asnje cmim a kufi i ngurtesuar ne kod.
insert into public.app_config(key, value, type, description)
select * from (values
  ('offers_enabled',     'true', 'boolean', 'A pranojne shpalljet oferta cmimi.'),
  ('offer_expiry_hours', '48',   'number',  'Sa ore rri e hapur nje oferte pa pergjigje.'),
  ('offer_min_percent',  '0',    'number',  'Kufiri i poshtem i ofertes si perqindje e cmimit. 0 = pa kufi.')
) as v(key,value,type,description)
where not exists (select 1 from public.app_config c where c.key = v.key);

-- --------------------------------------------------- 3. Porta e krijimit
create or replace function public.tg_offer_before_insert()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp' as $fn$
declare v_l record; v_ore int; v_min numeric;
begin
  if coalesce((select value from public.app_config where key='offers_enabled'),'true') <> 'true' then
    raise exception 'Ofertat jane te caktivizuara per momentin.';
  end if;

  select id, user_id, price, currency, is_active, status
    into v_l from public.listings where id = NEW.listing_id;

  if v_l.id is null then
    raise exception 'Shpallja nuk ekziston.';
  end if;
  if not coalesce(v_l.is_active,false) or v_l.status::text <> 'active' then
    raise exception 'Shpallja nuk eshte aktive — nuk pranon oferta.';
  end if;
  if v_l.user_id = NEW.buyer_id then
    raise exception 'Nuk mund te besh oferte per shpalljen tende.';
  end if;

  -- Shitesi dhe monedha NUK merren nga klienti — nxirren nga vete shpallja.
  -- Kjo e mbyll vrimen 3: cfaredo `seller_id` te derguar, mbizoteron pronari real.
  NEW.seller_id := v_l.user_id;
  NEW.currency  := coalesce(v_l.currency, 'ALL')::public.currency_code;
  NEW.status    := 'pending';

  if NEW.amount is null or NEW.amount <= 0 then
    raise exception 'Shuma e ofertes duhet te jete me e madhe se zero.';
  end if;

  v_min := coalesce(nullif((select value from public.app_config where key='offer_min_percent'),'')::numeric, 0);
  if v_min > 0 and v_l.price is not null and v_l.price > 0
     and NEW.amount < v_l.price * v_min / 100 then
    raise exception 'Oferta duhet te jete te pakten % per qind e cmimit te kerkuar.', v_min;
  end if;

  v_ore := coalesce(nullif((select value from public.app_config where key='offer_expiry_hours'),'')::int, 48);
  NEW.expires_at := now() + make_interval(hours => greatest(1, least(v_ore, 720)));

  if exists (select 1 from public.offers o
              where o.listing_id = NEW.listing_id
                and o.buyer_id   = NEW.buyer_id
                and o.status     = 'pending') then
    raise exception 'Ke tashme nje oferte te hapur per kete shpallje.';
  end if;

  return NEW;
end $fn$;

-- ------------------------------------------- 4. Makina e gjendjeve (UPDATE)
create or replace function public.tg_offer_before_update()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp' as $fn$
declare v_aktori uuid := auth.uid();
begin
  -- Permbajtja eshte e pandryshueshme pas dergimit. Nje negociate qe rishkruhet
  -- ne heshtje nuk provon asgje — as per palet, as ne rast mosmarreveshjeje.
  if NEW.listing_id is distinct from OLD.listing_id
     or NEW.buyer_id   is distinct from OLD.buyer_id
     or NEW.seller_id  is distinct from OLD.seller_id
     or NEW.amount     is distinct from OLD.amount
     or NEW.currency   is distinct from OLD.currency
     or NEW.message    is distinct from OLD.message
     or NEW.created_at is distinct from OLD.created_at then
    raise exception 'Permbajtja e ofertes nuk ndryshohet pas dergimit.';
  end if;

  if NEW.status = OLD.status then return NEW; end if;

  if OLD.status <> 'pending' then
    raise exception 'Kjo oferte eshte mbyllur tashme (%).', OLD.status;
  end if;

  -- `auth.uid()` NULL = rruge sistemi (cron / service_role). Rregulli §1.5:
  -- `current_user` do te ishte PRONARI i funksionit, jo thirresi — prandaj
  -- aktori matet me `auth.uid()`.
  if v_aktori is null then
    if NEW.status <> 'expired' then
      raise exception 'Rruga e sistemit mund vetem ta skadoje oferten.';
    end if;
    return NEW;
  end if;

  if v_aktori = OLD.seller_id then
    if NEW.status not in ('accepted','rejected') then
      raise exception 'Shitesi mund vetem ta pranoje ose ta refuzoje oferten.';
    end if;
  elsif v_aktori = OLD.buyer_id then
    if NEW.status <> 'withdrawn' then
      raise exception 'Bleresi mund vetem ta terheqe oferten.';
    end if;
  else
    raise exception 'Nuk je pale ne kete oferte.';
  end if;

  return NEW;
end $fn$;

-- ------------------------------------------------------------ 5. Njoftimet
create or replace function public.tg_offer_notify_insert()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp' as $fn$
declare v_bleresi text; v_avatar text;
begin
  select coalesce(full_name, username, 'Perdorues'), avatar_url
    into v_bleresi, v_avatar from public.profiles where id = NEW.buyer_id;

  insert into public.notifications (user_id, type, title, body, link, ref_id, ref_type, image_url, metadata)
  values (
    NEW.seller_id, 'offer_received', 'Oferte e re',
    v_bleresi || ' ofron ' || trim(to_char(NEW.amount,'FM999G999G999D00')) || ' ' || NEW.currency::text
      || case when coalesce(btrim(NEW.message),'') = '' then ''
              else ' — „' || left(btrim(NEW.message),100) || '"' end,
    '/oferta', NEW.id, 'offer', v_avatar,
    jsonb_build_object('listing_id', NEW.listing_id, 'amount', NEW.amount, 'skadon', NEW.expires_at));
  return NEW;
exception when others then return NEW;  -- njoftimi qe deshton nuk e bllokon oferten
end $fn$;

create or replace function public.tg_offer_notify_update()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp' as $fn$
declare v_marresi uuid; v_tipi public.notif_type; v_titull text; v_trupi text; v_shpallja text;
begin
  if NEW.status = OLD.status then return NEW; end if;
  select title into v_shpallja from public.listings where id = NEW.listing_id;
  v_shpallja := coalesce(nullif(btrim(v_shpallja),''), 'shpallje');

  if NEW.status = 'accepted' then
    v_marresi := NEW.buyer_id;  v_tipi := 'offer_accepted';
    v_titull  := 'Oferta jote u pranua';
    v_trupi   := 'Shitesi pranoi oferten per „' || v_shpallja || '". Vazhdoni biseden per dorezimin dhe pagesen.';
  elsif NEW.status = 'rejected' then
    v_marresi := NEW.buyer_id;  v_tipi := 'offer_rejected';
    v_titull  := 'Oferta jote nuk u pranua';
    v_trupi   := 'Shitesi nuk e pranoi oferten per „' || v_shpallja || '". Mund te dergosh nje oferte te re.';
  elsif NEW.status = 'withdrawn' then
    v_marresi := NEW.seller_id; v_tipi := 'system';
    v_titull  := 'Oferta u terhoq';
    v_trupi   := 'Bleresi terhoqi oferten per „' || v_shpallja || '".';
  elsif NEW.status = 'expired' then
    v_marresi := NEW.buyer_id;  v_tipi := 'system';
    v_titull  := 'Oferta skadoi';
    v_trupi   := 'Oferta per „' || v_shpallja || '" skadoi pa pergjigje.';
  else
    return NEW;
  end if;

  insert into public.notifications (user_id, type, title, body, link, ref_id, ref_type, metadata)
  values (v_marresi, v_tipi, v_titull, v_trupi, '/oferta', NEW.id, 'offer',
          jsonb_build_object('listing_id', NEW.listing_id, 'status', NEW.status));
  return NEW;
exception when others then return NEW;
end $fn$;

drop trigger if exists tg_offer_before_insert on public.offers;
create trigger tg_offer_before_insert before insert on public.offers
  for each row execute function public.tg_offer_before_insert();

drop trigger if exists tg_offer_before_update on public.offers;
create trigger tg_offer_before_update before update on public.offers
  for each row execute function public.tg_offer_before_update();

drop trigger if exists tg_offer_notify_insert on public.offers;
create trigger tg_offer_notify_insert after insert on public.offers
  for each row execute function public.tg_offer_notify_insert();

drop trigger if exists tg_offer_notify_update on public.offers;
create trigger tg_offer_notify_update after update on public.offers
  for each row execute function public.tg_offer_notify_update();

-- ------------------------------------------------------------- 6. Skadimi
create or replace function public.offers_expire_run()
returns integer language plpgsql security definer set search_path to 'public' as $fn$
declare n integer;
begin
  update public.offers
     set status = 'expired'
   where status = 'pending'
     and expires_at is not null
     and expires_at < now();
  get diagnostics n = row_count;
  if n > 0 then
    -- Rregulli §1.4: `admin_log()` e humbet gjurmen ne heshtje nga cron
    -- (`admin_logs.admin_id` NOT NULL, `auth.uid()` NULL). `audit_logs`
    -- e lejon `actor_id` NULL, ndaj gjurma mbijeton pa perdorues.
    insert into public.audit_logs(action, target_type, new_data)
    values ('skadence_ofertash','cron', jsonb_build_object('u_skaduan', n));
  end if;
  return n;
end $fn$;

-- ------------------------------------------------- 7. Leximi per nderfaqen
-- Nje thirrje e vetme per te dyja drejtimet: pa N+1 mbi `listings`/`profiles`.
create or replace function public.my_offers(p_limit integer default 60)
returns jsonb language plpgsql stable security definer set search_path to 'public','pg_temp' as $fn$
declare v_uid uuid := auth.uid(); v_marra jsonb; v_derguara jsonb;
begin
  if v_uid is null then return jsonb_build_object('error','pa_autentikim'); end if;

  with baza as (
    select o.*, l.title, l.images, l.price as cmimi_kerkuar, l.is_active, l.status as status_shpalljeje
      from public.offers o
      join public.listings l on l.id = o.listing_id
     where o.buyer_id = v_uid or o.seller_id = v_uid
     order by o.created_at desc
     limit greatest(1, least(p_limit, 200))
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'id', b.id, 'status', b.status, 'shuma', b.amount, 'monedha', b.currency,
      'mesazhi', b.message, 'krijuar', b.created_at, 'skadon', b.expires_at,
      'shpallja', jsonb_build_object('id', b.listing_id, 'titulli', b.title,
                   'foto', case when b.images is null or array_length(b.images,1) is null
                                then null else b.images[1] end,
                   'cmimi', b.cmimi_kerkuar, 'aktive', coalesce(b.is_active,false)),
      'pala', jsonb_build_object('id', pb.id, 'emri', coalesce(pb.full_name, pb.username, 'Perdorues'),
                   'avatar', pb.avatar_url)
    ) order by b.created_at desc) filter (where b.seller_id = v_uid), '[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object(
      'id', b.id, 'status', b.status, 'shuma', b.amount, 'monedha', b.currency,
      'mesazhi', b.message, 'krijuar', b.created_at, 'skadon', b.expires_at,
      'shpallja', jsonb_build_object('id', b.listing_id, 'titulli', b.title,
                   'foto', case when b.images is null or array_length(b.images,1) is null
                                then null else b.images[1] end,
                   'cmimi', b.cmimi_kerkuar, 'aktive', coalesce(b.is_active,false)),
      'pala', jsonb_build_object('id', ps.id, 'emri', coalesce(ps.full_name, ps.username, 'Perdorues'),
                   'avatar', ps.avatar_url)
    ) order by b.created_at desc) filter (where b.buyer_id = v_uid), '[]'::jsonb)
    into v_marra, v_derguara
  from baza b
  left join public.profiles pb on pb.id = b.buyer_id
  left join public.profiles ps on ps.id = b.seller_id;

  return jsonb_build_object('marra', v_marra, 'derguara', v_derguara);
end $fn$;

-- Gjendja e ofertes per NJE shpallje — e thirrur nga faqja e shpalljes.
create or replace function public.listing_offer_state(p_listing_id uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public','pg_temp' as $fn$
declare v_uid uuid := auth.uid(); v_l record; v_o public.offers;
begin
  select id, user_id, price, currency, is_active, status
    into v_l from public.listings where id = p_listing_id;
  if v_l.id is null then return jsonb_build_object('error','nuk_ekziston'); end if;

  if v_uid is not null then
    select * into v_o from public.offers
     where listing_id = p_listing_id and buyer_id = v_uid
     order by created_at desc limit 1;
  end if;

  return jsonb_build_object(
    'aktive', coalesce((select value from public.app_config where key='offers_enabled'),'true') = 'true',
    'jam_pronari', v_uid is not null and v_uid = v_l.user_id,
    'shpallja_aktive', coalesce(v_l.is_active,false) and v_l.status::text = 'active',
    'cmimi', v_l.price, 'monedha', v_l.currency,
    'kufi_perqind', coalesce(nullif((select value from public.app_config where key='offer_min_percent'),'')::numeric, 0),
    'oferta_ime', case when v_o.id is null then null else jsonb_build_object(
        'id', v_o.id, 'status', v_o.status, 'shuma', v_o.amount,
        'krijuar', v_o.created_at, 'skadon', v_o.expires_at) end,
    'ne_pritje', (select count(*) from public.offers
                   where listing_id = p_listing_id and status = 'pending'
                     and v_uid is not null and seller_id = v_uid));
end $fn$;

-- ----------------------------------------------------------- 8. Te drejtat
-- Rregulli §1.1: heqja nga `anon` nuk ka efekt kur e drejta vjen nga PUBLIC,
-- dhe `authenticated` e mban shpesh si GRANT te shprehur nga
-- `alter default privileges` i Supabase-it. Duhen te dyja.
revoke all on function public.tg_offer_before_insert()  from public, anon, authenticated;
revoke all on function public.tg_offer_before_update()  from public, anon, authenticated;
revoke all on function public.tg_offer_notify_insert()  from public, anon, authenticated;
revoke all on function public.tg_offer_notify_update()  from public, anon, authenticated;
revoke all on function public.offers_expire_run()       from public, anon, authenticated;

grant execute on function public.my_offers(integer)        to authenticated;
grant execute on function public.listing_offer_state(uuid) to authenticated, anon;

-- Fshirja e nje oferte eshte fshirje prove. Bleresi TERHIQET (`withdrawn`),
-- nuk fshin. Rregulli §2: cdo veprim shkaterrues me arsye e gjurme.
drop policy if exists offers_delete on public.offers;
create policy offers_delete on public.offers for delete
  using (has_perm('content.moderate'));

-- Politika UPDATE pa `with check` e perdor `using`-un si kontroll; e shkruajme
-- shprehimisht qe qellimi te mos varet nga nje e paracaktuar e Postgres-it.
drop policy if exists offers_update on public.offers;
create policy offers_update on public.offers for update
  using      (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()))
  with check (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));

commit;

-- ------------------------------------------------- 9. Korrigjim i matur pas aplikimit
-- `grant execute ... to authenticated` NUK e hoqi te drejten e `anon`: ajo vinte
-- nga PUBLIC (rregulli §1.1). Matur me `has_function_privilege('anon', …)`,
-- jo me sy. Modeli i pastër arrihet vetem me heqjen nga PUBLIC + grant i shprehur.
revoke all on function public.my_offers(integer) from public, anon, authenticated;
grant execute on function public.my_offers(integer) to authenticated;
revoke all on function public.listing_offer_state(uuid) from public, anon, authenticated;
grant execute on function public.listing_offer_state(uuid) to authenticated, anon;

-- Cron-i i skadimit (regjistruar me cron.schedule, jo me DDL):
--   alpazar_expire_offers · '10 * * * *' · select public.offers_expire_run();
