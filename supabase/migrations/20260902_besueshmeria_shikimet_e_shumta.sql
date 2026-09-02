-- SHIKIMET E SHUMTA si element besueshmërie (urdhër pronari, 2 shtator 2026:
-- "shto si element besueshmërie dhe shikimet e shumta").
-- Shikimet totale të shpalljeve të përdoruesit (listings.views_count) hyjnë në
-- recompute_trust_score si përbërës log-scaled ≤6. Log, jo linear: trafik i vërtetë
-- shpërblehet, por s'gamohet dot me rifreskime (§1.7: views_count rritet në çdo hapje).
-- PA trigger per-view (§1.7 — do prodhonte një rresht/rillogaritje për çdo shikim);
-- freskohet nga cron-i javor + triggerat ekzistues (vlerësim/porosi/referim/moderim).
-- Ribalancim që max-i pozitiv të mbetet 100: porosi 18→16, cilësia e vlerësimeve 22→20,
-- referime 8→6. Të matura LIVE: max_pozitiv=100; admini (302 shikime) 9→15; përdorues
-- pa aktivitet (0 shikime) mbetet 0 — asnjë aktivitet i falsifikuar.
-- I aplikuar LIVE me apply_migration; ky skedar është gjurma në repo (§0-bis).
-- Additive/idempotent (CREATE OR REPLACE).

create or replace function public.recompute_trust_score(p_user_id uuid)
returns numeric language plpgsql security definer
set search_path to 'public','pg_temp' as $function$
declare v_verified boolean; v_created timestamptz; v_age_m numeric;
        v_delivered int; v_avg numeric; v_revn int; v_resp numeric; v_reports int;
        v_ref int; v_points int; v_code text; v_uname text; v_views bigint; v_score numeric := 0;
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
  -- REFERIMET nga burimi REAL: profiles.referred_by = kodi ose username i këtij përdoruesi.
  select count(*) into v_ref from profiles r
    where r.id <> p_user_id and coalesce(r.referred_by,'') <> ''
      and (r.referred_by = v_code or r.referred_by = v_uname);
  -- SHIKIMET TOTALE: shuma e views_count të shpalljeve të përdoruesit.
  select coalesce(sum(views_count),0) into v_views from listings where user_id=p_user_id;

  if coalesce(v_verified,false) then v_score := v_score + 18; end if;
  v_age_m := greatest(0, extract(epoch from (now()-v_created))/(30.0*86400));
  v_score := v_score + least(12, v_age_m/12.0*12);
  v_score := v_score + least(16, ln(1+v_delivered)*5);      -- porosi të dorëzuara ≤16
  if v_revn>0 then v_score := v_score + greatest(0,(v_avg-1)/4.0*20); end if;  -- cilësia ≤20
  v_score := v_score + least(8, ln(1+v_revn)*3);
  v_score := v_score + least(8, coalesce(v_resp,0)*8);
  v_score := v_score + least(6, ln(1+v_ref)*4);             -- referimet (burim real) ≤6
  v_score := v_score + least(6, ln(1+v_points)*1.3);
  v_score := v_score + least(6, ln(1+v_views)*1.1);         -- SHIKIMET E SHUMTA ≤6 (i ri)
  v_score := v_score - least(30, v_reports*10);
  v_score := greatest(0, least(100, round(v_score,2)));
  perform set_config('app.skip_privilege_guard','true',true);
  update profiles set trust_score=v_score where id=p_user_id;
  return v_score;
exception when others then raise warning 'recompute_trust_score: %', sqlerrm; return null; end; $function$;

-- Rillogarit të gjithë (bën efektive shikimet menjëherë; cron-i javor e mban të freskët).
select public.recompute_all_trust_scores();
