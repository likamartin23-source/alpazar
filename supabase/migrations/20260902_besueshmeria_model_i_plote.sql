-- BESUESHMËRIA — modeli i plotë i LIDHUR (urdhër pronari, 2 shtator 2026).
-- I aplikuar te prodhimi me apply_migration; ky skedar është gjurma në repo (§0-bis).
--
-- Gjendja e gjetur: `recompute_trust_score(p_user_id)` EKZISTONTE me model të pasur
-- (vlerësime+porosi+raportime+verifikim+moshë+përgjigje) POR (a) i mungonin REFERIMET dhe
-- PIKËT (të dyja FALAS), (b) nuk thirrej KURRË → trust_score mbetej 0 (F1/F3: e ndërtuar, e palidhur).
-- Këtu: shtohen referimet+pikët (balancuar ≤100), DHE lidhet me triggera + backfill.
-- TË GJITHA sinjalet janë FALAS (aktivitet/histori) — asnjë s'varet nga premium.

create or replace function public.recompute_trust_score(p_user_id uuid)
returns numeric language plpgsql security definer
set search_path to 'public','pg_temp' as $function$
declare v_verified boolean; v_created timestamptz; v_age_m numeric;
        v_delivered int; v_avg numeric; v_revn int; v_resp numeric; v_reports int;
        v_ref int; v_points int; v_score numeric := 0;
begin
  select is_verified, created_at, coalesce(response_rate,0), coalesce(gamification_points,0)
    into v_verified, v_created, v_resp, v_points
  from profiles where id = p_user_id;
  if not found then return null; end if;
  select count(*) into v_delivered from orders where seller_id=p_user_id and status='delivered';
  select coalesce(avg(rating),0), count(*) into v_avg, v_revn from reviews where seller_id=p_user_id;
  select count(*) into v_reports from moderation_queue
    where ref_type='user' and ref_id=p_user_id and status in ('pending','open');
  select count(*) into v_ref from referrals where referrer_id=p_user_id and completed_at is not null;

  if coalesce(v_verified,false) then v_score := v_score + 18; end if;   -- verifikim me dokument
  v_age_m := greatest(0, extract(epoch from (now()-v_created))/(30.0*86400));
  v_score := v_score + least(12, v_age_m/12.0*12);                       -- mosha ≤12
  v_score := v_score + least(18, ln(1+v_delivered)*5);                   -- porosi të dorëzuara ≤18
  if v_revn>0 then v_score := v_score + greatest(0,(v_avg-1)/4.0*22); end if; -- cilësia e vlerësimeve ≤22
  v_score := v_score + least(8, ln(1+v_revn)*3);                         -- numri i vlerësimeve ≤8
  v_score := v_score + least(8, coalesce(v_resp,0)*8);                   -- shpejtësia e përgjigjes ≤8
  v_score := v_score + least(8, ln(1+v_ref)*4);                          -- REFERIMET ≤8 (FALAS)
  v_score := v_score + least(6, ln(1+v_points)*1.3);                     -- PIKËT ≤6 (FALAS)
  v_score := v_score - least(30, v_reports*10);                         -- raportime -10 secili, ≤-30
  v_score := greatest(0, least(100, round(v_score,2)));
  perform set_config('app.skip_privilege_guard','true',true);
  update profiles set trust_score=v_score where id=p_user_id;
  return v_score;
exception when others then raise warning 'recompute_trust_score: %', sqlerrm; return null; end; $function$;

create or replace function public.recompute_all_trust_scores()
returns integer language plpgsql security definer
set search_path to 'public','pg_temp' as $function$
declare v_n int := 0; r record;
begin
  for r in select id from public.profiles loop
    perform public.recompute_trust_score(r.id); v_n := v_n + 1;
  end loop; return v_n;
end $function$;

create or replace function public.tg_trust_review() returns trigger language plpgsql
security definer set search_path to 'public','pg_temp' as $function$
begin perform public.recompute_trust_score(coalesce(NEW.seller_id, OLD.seller_id)); return null; end $function$;
create or replace function public.tg_trust_referral() returns trigger language plpgsql
security definer set search_path to 'public','pg_temp' as $function$
begin perform public.recompute_trust_score(coalesce(NEW.referrer_id, OLD.referrer_id)); return null; end $function$;
create or replace function public.tg_trust_order() returns trigger language plpgsql
security definer set search_path to 'public','pg_temp' as $function$
begin perform public.recompute_trust_score(coalesce(NEW.seller_id, OLD.seller_id)); return null; end $function$;
create or replace function public.tg_trust_moderation() returns trigger language plpgsql
security definer set search_path to 'public','pg_temp' as $function$
begin
  if coalesce(NEW.ref_type, OLD.ref_type)='user' then
    perform public.recompute_trust_score(coalesce(NEW.ref_id, OLD.ref_id));
  end if; return null;
end $function$;

drop trigger if exists trg_trust_review on public.reviews;
create trigger trg_trust_review after insert or update or delete on public.reviews
  for each row execute function public.tg_trust_review();
drop trigger if exists trg_trust_referral on public.referrals;
create trigger trg_trust_referral after insert or update or delete on public.referrals
  for each row execute function public.tg_trust_referral();
drop trigger if exists trg_trust_order on public.orders;
create trigger trg_trust_order after insert or update of status on public.orders
  for each row execute function public.tg_trust_order();
drop trigger if exists trg_trust_moderation on public.moderation_queue;
create trigger trg_trust_moderation after insert or update of status on public.moderation_queue
  for each row execute function public.tg_trust_moderation();

revoke all on function public.recompute_all_trust_scores() from public, anon, authenticated;
revoke all on function public.tg_trust_review() from public, anon, authenticated;
revoke all on function public.tg_trust_referral() from public, anon, authenticated;
revoke all on function public.tg_trust_order() from public, anon, authenticated;
revoke all on function public.tg_trust_moderation() from public, anon, authenticated;
grant execute on function public.recompute_all_trust_scores() to service_role;

select public.recompute_all_trust_scores();
