-- PAGESA P8 (Martinel, 26 gusht 2026): harmonizim i sistemit REFERRAL + DHURIM me Premium/VIP.
-- Aplikuar LIVE me execute_sql; ky skedar mbyll DRIFT-in (kolonat + funksioni + trigeri
-- ekzistonin VETËM live). Additive/idempotent.
--
-- Gjendja reale e matur (jo supozime):
--   • admin_gift_subscription: EXECUTE për authenticated = TRUE (JO i bllokuar) — dhurimi i
--     Premium DHE VIP Ekstra Boost (premium bazë + boost) punon përmes grant_premium.
--   • referral_code: i mbushur për të gjithë (jo null).
--   • Trigeri fn_award_referral_points jep 50 pikë + njoftim + milestone — punonte live.
-- Të meta të rregulluara këtu:
--   1) Milestone 50 referalë shkruante te tabela LEGACY premium_subscriptions dhe vendoste
--      is_premium=true PA premium_expires_at → premium i PËRHERSHËM (jo 1 muaj), jashtë sistemit.
--      Tani: grant_premium(...,30,...,'premium') → abonim + skadim 30-ditor + njoftim + restaurim.
--   2) Pa mbrojtje kundër vetë-referimit → shtuar guard v_referrer_id = NEW.id.
-- Shënim i mbetur (jo këtu): rruga PIN 'gift_premium' te edge-function admin-action mbishkruan
--   skadimin dhe s'njofton; rruga e saktë është admin_gift_subscription (PeopleTab). Për konsolidim.

-- Drift closure: kolonat referral (ekzistojnë live; idempotent).
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by text;

-- Funksioni i harmonizuar (kopje e live-it të rregulluar).
create or replace function public.fn_award_referral_points()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
declare v_referrer_id uuid; v_referrer_points int; v_referral_count int; v_prem_plan uuid;
begin
  if NEW.referred_by is null or NEW.referred_by = '' then return NEW; end if;

  select id, coalesce(gamification_points,0) into v_referrer_id, v_referrer_points
  from public.profiles where referral_code = NEW.referred_by or username = NEW.referred_by limit 1;

  if v_referrer_id is null then return NEW; end if;
  if v_referrer_id = NEW.id then return NEW; end if;  -- ANTI-ABUZ: pa vetë-referim

  update public.profiles set gamification_points = v_referrer_points + 50 where id = v_referrer_id;

  insert into public.notifications(user_id, type, title, body, link, ref_id, ref_type, is_read)
  values (v_referrer_id, 'referral_reward', '🎁 Referim i suksesshëm!',
    coalesce(NEW.full_name, NEW.username, 'Një mik') || ' u regjistrua përmes linkut tënd. Ke fituar 50 pikë!',
    '/referral', NEW.id, 'profile', false);

  select count(*) into v_referral_count from public.profiles
   where referred_by = NEW.referred_by
      or referred_by = (select username from public.profiles where id = v_referrer_id limit 1);

  if v_referral_count = 50 then
    select id into v_prem_plan from public.premium_plans
      where coalesce(tier,'premium')='premium' and is_active order by price_eur nulls last limit 1;
    perform public.grant_premium(v_referrer_id, 'gift', 30, v_prem_plan, 0, 'Shpërblim referral: 50 miq', 'premium');
    insert into public.notifications(user_id, type, title, body, link, ref_id, ref_type, is_read)
    values (v_referrer_id, 'badge_earned', '🥇 Ke arritur 50 referalë!',
      'Urime! Ke fituar 1 muaj Premium FALAS për 50 referalë!', '/premium', v_referrer_id, 'profile', false);
  end if;

  return NEW;
end $fn$;

drop trigger if exists trg_award_referral_points on public.profiles;
create trigger trg_award_referral_points
  after insert on public.profiles for each row execute function public.fn_award_referral_points();
