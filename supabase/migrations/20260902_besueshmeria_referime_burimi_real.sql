-- KORRIGJIM FUNKSIONAL (2 shtator 2026): referimet reale ndodhen te profiles.referred_by
-- (fn_award_referral_points e përdor atë), JO te tabela `referrals` (bosh — zbatim paralel §6).
-- Modeli i besueshmërisë duhet të numërojë burimin REAL, përndryshe inputi i referimeve = 0.
-- I aplikuar LIVE me apply_migration; ky skedar është gjurma në repo (§0-bis).

create or replace function public.recompute_trust_score(p_user_id uuid)
returns numeric language plpgsql security definer
set search_path to 'public','pg_temp' as $function$
declare v_verified boolean; v_created timestamptz; v_age_m numeric;
        v_delivered int; v_avg numeric; v_revn int; v_resp numeric; v_reports int;
        v_ref int; v_points int; v_code text; v_uname text; v_score numeric := 0;
begin
  select is_verified, created_at, coalesce(response_rate,0), coalesce(gamification_points,0),
         referral_code, username
    into v_verified, v_created, v_resp, v_points, v_code, v_uname
  from profiles where id = p_user_id;
  if not found then return null; end if;
  select count(*) into v_delivered from orders where seller_id=p_user_id and status='delivered';
  select coalesce(avg(rating),0), count(*) into v_avg, v_revn from reviews where seller_id=p_user_id;
  select count(*) into v_reports from moderation_queue
    where ref_type='user' and ref_id=p_user_id and status in ('pending','open');
  select count(*) into v_ref from profiles r
    where r.id <> p_user_id and coalesce(r.referred_by,'') <> ''
      and (r.referred_by = v_code or r.referred_by = v_uname);

  if coalesce(v_verified,false) then v_score := v_score + 18; end if;
  v_age_m := greatest(0, extract(epoch from (now()-v_created))/(30.0*86400));
  v_score := v_score + least(12, v_age_m/12.0*12);
  v_score := v_score + least(18, ln(1+v_delivered)*5);
  if v_revn>0 then v_score := v_score + greatest(0,(v_avg-1)/4.0*22); end if;
  v_score := v_score + least(8, ln(1+v_revn)*3);
  v_score := v_score + least(8, coalesce(v_resp,0)*8);
  v_score := v_score + least(8, ln(1+v_ref)*4);
  v_score := v_score + least(6, ln(1+v_points)*1.3);
  v_score := v_score - least(30, v_reports*10);
  v_score := greatest(0, least(100, round(v_score,2)));
  perform set_config('app.skip_privilege_guard','true',true);
  update profiles set trust_score=v_score where id=p_user_id;
  return v_score;
exception when others then raise warning 'recompute_trust_score: %', sqlerrm; return null; end; $function$;

drop trigger if exists trg_trust_referral on public.referrals;
create or replace function public.tg_trust_referral_profile() returns trigger language plpgsql
security definer set search_path to 'public','pg_temp' as $function$
declare v_ref uuid;
begin
  if coalesce(NEW.referred_by,'') = '' then return null; end if;
  select id into v_ref from public.profiles
    where referral_code = NEW.referred_by or username = NEW.referred_by limit 1;
  if v_ref is not null and v_ref <> NEW.id then perform public.recompute_trust_score(v_ref); end if;
  return null;
end $function$;
revoke all on function public.tg_trust_referral_profile() from public, anon, authenticated;
drop trigger if exists trg_trust_referral_profile on public.profiles;
create trigger trg_trust_referral_profile
  after insert or update of referred_by on public.profiles
  for each row execute function public.tg_trust_referral_profile();

-- Cron javor për freskimin e moshës (aplikuar live): cron.schedule('besueshmeria_freskim_javor','0 3 * * 0', ...).
select public.recompute_all_trust_scores();
