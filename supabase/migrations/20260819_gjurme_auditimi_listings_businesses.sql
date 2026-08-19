-- Gjurma e ndryshimeve mbi `listings` dhe `businesses`.
--
-- PSE
-- Me 18 gusht 2026, ne 19:54:14, nje veprim i vetem coi `is_active=false` te tri
-- shpallje dhe `is_visible=false` te biznesi. Kush e beri nuk u mor vesh dot:
-- asnje nga te dyja tabelat s'kishte triger gjurme.
--
-- KU SHKRUHET
-- Te `audit_logs`, jo te `admin_logs`. `admin_logs.admin_id` eshte NOT NULL,
-- ndersa `admin_log()` fut `auth.uid()` — qe nga nje cron eshte NULL — dhe e
-- gelltit shkeljen me `exception when others then null`. Pra cdo gjurme nga nje
-- rruge e automatizuar humbet ne heshtje. `audit_logs.actor_id` e lejon NULL.
--
-- KONVENTA
-- E njejta me `audit_app_config` dhe `audit_admin_settings`: `action` mban
-- TG_OP, tabela shkon te `target_type`. Dy dallime me qellim:
--   * `target_id` mbushet — keto tabela kane uuid, `app_config` ka celes teksti.
--   * Ruhen vetem kolonat qe ndryshuan. Nje shpallje mban `embedding` (vektor),
--     foto dhe video; diferenca lexohet, fotografia e plote duhet krahasuar.

-- Roli i aktorit: `actor_id` bosh nuk dallon nje cron nga nje skript
-- `service_role` nga nje vizitor i palogaruar — pikerisht paqartesia e incidentit.
alter table public.audit_logs add column if not exists actor_role text;

-- Pyetja e nje hetimi eshte "cfare i ndodhi ketij rreshti?". Indekset ekzistuese
-- mbulojne aktorin, veprimin dhe kohen — jo objektivin.
create index if not exists audit_logs_target_idx
  on public.audit_logs (target_type, target_id, created_at desc);

-- SECURITY DEFINER: `audit_logs` ka RLS me `no_insert` (with check false).
-- Pronari eshte `postgres` dhe `force_rls` eshte i fikur, ndaj ky funksion
-- shkruan ndersa rruget e zakonshme mbeten te bllokuara.
--
-- Pa kapje gabimi me qellim: nese gjurma nuk shkruhet dot, ndryshimi nuk kryhet.
-- `audit_logs` mbahet si vlere provuese (nenet 6 dhe 12, ligji 10273/2010).
create or replace function public.tg_audit_gjurme()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_vjeter jsonb := '{}'::jsonb;
  v_ri     jsonb := '{}'::jsonb;
  v_kol    text;
  v_rreshti_vjeter jsonb;
  v_rreshti_ri     jsonb;
  v_rol    text;
begin
  -- `current_user` brenda SECURITY DEFINER eshte PRONARI, jo thirresi, dhe do
  -- te thoshte 'postgres' perjetesisht. `session_user` nuk vlen as ai: PostgREST
  -- lidhet si `authenticator` dhe ben `SET ROLE`. Burimi i vertete eshte JWT-ja.
  begin
    v_rol := coalesce(nullif(auth.role(), ''), current_user);
  exception when others then
    v_rol := current_user;
  end;

  if TG_OP = 'DELETE' then
    insert into public.audit_logs
      (actor_id, actor_role, action, target_type, target_id, old_data, new_data)
    values
      (auth.uid(), v_rol, TG_OP, TG_TABLE_NAME, OLD.id,
       to_jsonb(OLD) - 'embedding', null);
    return OLD;
  end if;

  v_rreshti_vjeter := to_jsonb(OLD);
  v_rreshti_ri     := to_jsonb(NEW);

  foreach v_kol in array TG_ARGV loop
    if v_rreshti_vjeter -> v_kol is distinct from v_rreshti_ri -> v_kol then
      v_vjeter := v_vjeter || jsonb_build_object(v_kol, v_rreshti_vjeter -> v_kol);
      v_ri     := v_ri     || jsonb_build_object(v_kol, v_rreshti_ri     -> v_kol);
    end if;
  end loop;

  -- `UPDATE OF kolona` ndizet edhe kur kolona vetem permendet te SET pa
  -- ndryshuar vlere. Nje rresht gjurme per nje jo-ndryshim eshte zhurme.
  if v_ri = '{}'::jsonb then
    return NEW;
  end if;

  insert into public.audit_logs
    (actor_id, actor_role, action, target_type, target_id, old_data, new_data)
  values
    (auth.uid(), v_rol, TG_OP, TG_TABLE_NAME, NEW.id, v_vjeter, v_ri);
  return NEW;
end $$;

-- `listings` shkruhet ne CDO hapje faqeje (`increment_listing_views` rrit
-- `views_count`). Nje triger i pakufizuar do te shkruante nje rresht per cdo
-- shikim. Lista e kolonave mban vetem ato qe percaktojne nese shpallja ekziston,
-- a duket, kujt i perket dhe sa kushton.
drop trigger if exists trg_audit_listings on public.listings;
create trigger trg_audit_listings
after update of is_active, status, deleted_at, business_id, user_id, price
on public.listings
for each row
execute function public.tg_audit_gjurme(
  'is_active', 'status', 'deleted_at', 'business_id', 'user_id', 'price');

drop trigger if exists trg_audit_listings_fshirje on public.listings;
create trigger trg_audit_listings_fshirje
after delete on public.listings
for each row execute function public.tg_audit_gjurme();

drop trigger if exists trg_audit_businesses on public.businesses;
create trigger trg_audit_businesses
after update of is_visible, is_active, admin_visibility_override, dim_reason,
                owner_id, name, nipt
on public.businesses
for each row
execute function public.tg_audit_gjurme(
  'is_visible', 'is_active', 'admin_visibility_override', 'dim_reason',
  'owner_id', 'name', 'nipt');

drop trigger if exists trg_audit_businesses_fshirje on public.businesses;
create trigger trg_audit_businesses_fshirje
after delete on public.businesses
for each row execute function public.tg_audit_gjurme();

-- MATUR (19 gusht 2026, ne baze):
--   rritje e `views_count`        -> 0 rreshta gjurme
--   `SET is_active = is_active`   -> 0 rreshta gjurme
--   caktivizim i vertete          -> 1 rresht, vetem kolona e ndryshuar
--   shkrim si `authenticated`     -> actor_id = uuid i perdoruesit,
--                                    actor_role = 'authenticated'
--   shkrim pa JWT (si sweep-i)    -> actor_id = NULL, actor_role = 'postgres'
