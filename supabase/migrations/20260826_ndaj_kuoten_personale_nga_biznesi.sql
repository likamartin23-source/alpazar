-- Ndaje kuoten personale (keep-newest-10) nga shpalljet e biznesit (model B, dukshmeri).
-- URDHER PRONARI (26 gusht 2026): "mos e gaterroni shpalljen e biznesit me shpalljen si
-- perdorues premium (pezullimi i tyre me perjashtim 10 te fundit)".
--
-- Dy modele te ndara, qe s'duhen ngaterruar:
--   * BIZNES (business_id NOT NULL): erresohet/rikthehet TERESISHT nga businesses.is_visible
--     (RLS listings_select — shih 20260826_kap_drift_listings_visibility.sql). Kur bie Premium
--     biznesi zhduket; kur rinovon, rikthehet automatikisht.
--   * PERSONAL (business_id NULL): kur bie Premium, mbahen aktive 10 shpalljet me te rejat
--     (free_listings_limit) dhe te tjerat pauzohen.
--
-- BUG-u i rregulluar: te dyja funksionet e kuotes filtronin vetem me user_id, ndaj shpalljet e
-- biznesit te nje pronari numeroheshin dhe PAUZOHESHIN nga kuota personale kur i binte Premium
-- (is_active=false, status='expired'). Ato NUK riktheheshin kur rikthehej Premium-i, sepse
-- rikthimi behet permes dukshmerise (RLS kerkon is_active=true) — cenonte modelin B
-- ("premium aktivizohet, gjithcka aktivizohet serisht"). Tani biznesi eshte plotesisht jashte
-- kuotes personale. Provuar empirikisht: 13 personale + 2 biznesi, limit 10 → 3 personale me te
-- vjetra pauzohen, 0 shpallje biznesi te prekura.

-- 1) Demotimi pas skadimit: prek VETEM shpalljet personale.
create or replace function public.demote_free_keep_newest(p_user uuid)
 returns integer
 language plpgsql security definer
 set search_path to 'public'
as $function$
declare v_max int; n int;
begin
  select coalesce(nullif(value,'')::int, 10) into v_max from public.app_config where key='free_listings_limit';
  v_max := coalesce(v_max, 10);
  if v_max < 0 then return 0; end if;
  update public.listings l set is_active=false, status='expired'
   where l.user_id=p_user and l.business_id is null and coalesce(l.is_active,false) and l.status='active'
     and l.id not in (
       select id from public.listings
        where user_id=p_user and business_id is null and coalesce(is_active,false) and status='active'
        order by created_at desc limit v_max);
  get diagnostics n = row_count;
  if n > 0 then
    insert into public.audit_logs(action, target_type, target_id, new_data)
    values ('kuote_demotim_premium','profile', p_user, jsonb_build_object('u_pauzuan', n, 'mbajtur', v_max));
    insert into public.notifications(id, user_id, type, title, body, link, created_at, is_read)
    values (gen_random_uuid(), p_user, 'system',
            'Plani Premium përfundoi — shpalljet u kufizuan',
            format('U mbajtën aktive %s shpalljet më të fundit; %s të tjera u pauzuan. Riaktivizoji duke kaluar sërish në Premium ose duke pauzuar të tjera.', v_max, n),
            '/profile?tab=listings', now(), false);
  end if;
  return n;
end $function$;

-- 2) Kufiri ne krijim/aktivizim: shpalljet e biznesit jashte kuotes; numerimi vetem personal.
create or replace function public.tg_enforce_listing_quota()
 returns trigger
 language plpgsql security definer
 set search_path to 'public'
as $function$
declare v_tier smallint; v_max int; v_n int;
begin
  -- Shpalljet e biznesit nuk i nenshtrohen kurre kuotes personale (qeverisen nga dukshmeria e biznesit).
  if NEW.business_id is not null then return NEW; end if;

  if TG_OP = 'UPDATE' then
    if coalesce(OLD.is_active,false) or not coalesce(NEW.is_active,false) then
      return NEW;  -- vetem kalimi joaktiv->aktiv kontrollohet
    end if;
  end if;

  v_tier := coalesce(public.owner_rank_tier(NEW.user_id), 0);
  if v_tier >= 1 then return NEW; end if;   -- Premium/Boost: pa limit

  select coalesce(nullif(value,'')::int, -1) into v_max
    from public.app_config where key = 'free_listings_limit';
  if coalesce(v_max,-1) < 0 then return NEW; end if;

  select count(*) into v_n from public.listings
   where user_id = NEW.user_id and business_id is null and coalesce(is_active,false)
     and (TG_OP = 'INSERT' or id <> NEW.id);
  if v_n >= v_max then
    raise exception 'KUFI_SHPALLJESH: llogaria pa pagese lejon % shpallje aktive. Ke %. Cakto nje shpallje si joaktive ose kalo ne Premium.',
      v_max, v_n using errcode = 'check_violation';
  end if;
  return NEW;
end $function$;
