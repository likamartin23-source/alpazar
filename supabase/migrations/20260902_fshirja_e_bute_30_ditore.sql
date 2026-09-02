-- §2.3 — FSHIRJA E BUTË 30-DITORE (neni 20/3, ligji 10128).
-- Fshirja e llogarisë NUK është e menjëhershme: shënohet me afat 30-ditor gjatë të cilit
-- përdoruesi mund ta ANULOJË (rikthim). Pas 30 ditësh, një cron e fshin PËRFUNDIMISHT.
-- I aplikuar LIVE me apply_migration; ky skedar është gjurma në repo (§0-bis).
-- Aditiv/idempotent. audit_logs (actor_id lejon NULL — §1.4).
-- Provuar LIVE (rollback): request→ afat 30 ditë + shpallje të fshehura; cancel→ pastrim;
-- purge_tani=0; authenticated mund të kërkojë/anulojë, anon & purge të bllokuar.

alter table public.profiles add column if not exists deletion_requested_at timestamptz;
alter table public.profiles add column if not exists deletion_listing_snapshot jsonb;

create or replace function public.request_account_deletion()
returns timestamptz language plpgsql security definer
set search_path to 'public','pg_temp' as $fn$
declare v_uid uuid := auth.uid(); v_purge timestamptz; v_snapshot jsonb; v_existing timestamptz;
begin
  if v_uid is null then raise exception 'Pa autorizim'; end if;
  select deletion_requested_at into v_existing from profiles where id=v_uid;
  if v_existing is not null then return v_existing + interval '30 days'; end if;
  perform set_config('app.skip_privilege_guard','true',true);
  select coalesce(jsonb_agg(id), '[]'::jsonb) into v_snapshot
    from listings where user_id=v_uid and is_active=true;
  update listings set is_active=false where user_id=v_uid and is_active=true;
  update profiles set deletion_requested_at=now(), deletion_listing_snapshot=v_snapshot where id=v_uid;
  v_purge := now() + interval '30 days';
  insert into audit_logs(actor_id, action, target_type, target_id, new_data)
  values (v_uid, 'account_deletion_requested', 'profile', v_uid,
          jsonb_build_object('purge_at', v_purge, 'listings_hidden', jsonb_array_length(v_snapshot)));
  return v_purge;
end $fn$;

create or replace function public.cancel_account_deletion()
returns boolean language plpgsql security definer
set search_path to 'public','pg_temp' as $fn$
declare v_uid uuid := auth.uid(); v_snapshot jsonb;
begin
  if v_uid is null then raise exception 'Pa autorizim'; end if;
  select deletion_listing_snapshot into v_snapshot from profiles where id=v_uid and deletion_requested_at is not null;
  if not found then return false; end if;
  perform set_config('app.skip_privilege_guard','true',true);
  if v_snapshot is not null then
    update listings set is_active=true
      where user_id=v_uid and id in (select (jsonb_array_elements_text(v_snapshot))::uuid);
  end if;
  update profiles set deletion_requested_at=null, deletion_listing_snapshot=null where id=v_uid;
  insert into audit_logs(actor_id, action, target_type, target_id)
  values (v_uid, 'account_deletion_cancelled', 'profile', v_uid);
  return true;
end $fn$;

create or replace function public.my_deletion_status()
returns table(pending boolean, requested_at timestamptz, purge_at timestamptz)
language sql security definer set search_path to 'public','pg_temp' as $fn$
  select (deletion_requested_at is not null),
         deletion_requested_at,
         case when deletion_requested_at is not null then deletion_requested_at + interval '30 days' end
  from profiles where id = auth.uid();
$fn$;

create or replace function public.purge_deleted_accounts_run()
returns integer language plpgsql security definer
set search_path to 'public','pg_temp' as $fn$
declare r record; n int := 0;
begin
  for r in select id from profiles
           where deletion_requested_at is not null
             and deletion_requested_at < now() - interval '30 days'
  loop
    delete from favorites      where user_id=r.id;
    delete from saved_searches where user_id=r.id;
    begin delete from saved_listings where user_id=r.id; exception when undefined_table then null; end;
    begin delete from price_alerts   where user_id=r.id; exception when undefined_table then null; end;
    delete from notifications  where user_id=r.id;
    delete from messages       where sender_id=r.id;
    delete from conversations  where user1_id=r.id or user2_id=r.id;
    delete from listings       where user_id=r.id;
    delete from auth.users where id=r.id; -- profiles cascade (profiles_id_fkey ON DELETE CASCADE)
    insert into audit_logs(actor_id, action, target_type, target_id, new_data)
    values (null, 'account_purged', 'profile', r.id, jsonb_build_object('at', now()));
    n := n + 1;
  end loop;
  return n;
end $fn$;

revoke all on function public.request_account_deletion() from public, anon;
revoke all on function public.cancel_account_deletion()  from public, anon;
revoke all on function public.my_deletion_status()        from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.cancel_account_deletion()  to authenticated;
grant execute on function public.my_deletion_status()        to authenticated;
revoke all on function public.purge_deleted_accounts_run() from public, anon, authenticated;

-- Cron ditor (03:40): aplikuar live me cron.schedule('alpazar_purge_deleted','40 3 * * *', ...).
