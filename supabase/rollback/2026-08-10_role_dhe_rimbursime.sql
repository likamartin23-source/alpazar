-- ============================================================
-- PLAN RIKTHIMI — 2026-08-10
-- Mbulon tri migrimet: rolet e ndara, notat e kreditit, dhe
-- forcimin e lejeve mbi funksionet admin.
--
-- Ekzekuto VETEM nese diçka shkon keq. Rendi ka rendesi.
-- ============================================================

-- ── 1. KTHE ROJTARET NE `is_admin()` ─────────────────────────
-- E kunderta e migrimit `enforce_permissions_on_all_admin_rpcs`.
-- Cdo funksion kthehet te rojtari binar i vjeter.
do $$
declare v_oid oid; v_def text; v_n int := 0;
begin
  for v_oid in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f' and p.proname like 'admin\_%'
       and pg_get_functiondef(p.oid) ~ 'has_perm\('
  loop
    v_def := pg_get_functiondef(v_oid);
    v_def := regexp_replace(v_def, 'public\.has_perm\([^)]*\)', 'public.is_admin()', 'g');
    execute v_def;
    v_n := v_n + 1;
  end loop;
  raise notice 'U kthyen % funksione ne is_admin()', v_n;
end $$;

-- ── 2. HIQ SISTEMIN E ROLEVE ─────────────────────────────────
drop function if exists public.admin_set_role(uuid, text);
drop function if exists public.admin_list_admins();
drop function if exists public.my_admin_profile();
drop function if exists public.has_perm(text);
drop function if exists public.perm_matrix(text);
drop index  if exists public.idx_profiles_admin_role;
alter table public.profiles drop constraint if exists profiles_admin_role_chk;
alter table public.profiles drop column if exists admin_role;

-- ── 3. HIQ NOTAT E KREDITIT ──────────────────────────────────
-- KUJDES: kjo fshin dokumentet e rimbursimit. Ruaji para se ta besh:
--   create table public.invoices_backup_20260810 as
--     select * from public.invoices where kind = 'credit_note';
delete from public.invoices where kind = 'credit_note';

drop function if exists public.admin_refund_invoice(uuid, numeric, text, boolean);
drop function if exists public.next_credit_note_number();
drop sequence if exists public.credit_note_seq;

drop index if exists public.idx_invoices_parent;
alter table public.invoices drop constraint if exists invoices_kind_chk;
alter table public.invoices
  drop column if exists kind,
  drop column if exists parent_invoice_id,
  drop column if exists refunded_total,
  drop column if exists refund_reason,
  drop column if exists refunded_at,
  drop column if exists refunded_by;

update public.invoices set status = 'paid'
 where status in ('issued','sent','partially_refunded','void');
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check
  check (status in ('paid','gifted','refunded'));

-- ── 4. KTHE FUNKSIONET E PREKURA NE FORMEN E VJETER ──────────
drop function if exists public.admin_list_invoices(text, integer, text);

create or replace function public.admin_list_invoices(
  p_search text default null, p_limit integer default 100)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
begin
  if not public.is_admin() then return jsonb_build_object('error','forbidden'); end if;
  return jsonb_build_object('invoices', coalesce((
    select jsonb_agg(row_to_json(t)) from (
      select i.id, i.number, i.user_id, i.plan_name, i.period,
             coalesce(i.total, i.amount) as total, i.currency, i.status,
             i.issued_at, i.sent_at, i.send_count, i.file_url, i.file_name, i.file_kind,
             coalesce(p.full_name, p.username) as full_name, u.email
        from public.invoices i
        left join public.profiles p on p.id = i.user_id
        left join auth.users u      on u.id = i.user_id
       where p_search is null or p_search = ''
          or i.number ilike '%'||p_search||'%'
          or u.email ilike '%'||p_search||'%'
          or p.full_name ilike '%'||p_search||'%'
       order by i.issued_at desc nulls last
       limit greatest(1, least(coalesce(p_limit,100), 500))
    ) t), '[]'::jsonb));
end $fn$;

drop function if exists public.admin_deactivate_subscription(uuid, text, text);
drop function if exists public._revoke_subscription(uuid, text);

create or replace function public.admin_deactivate_subscription(
  p_user_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare v_sub public.subscriptions;
begin
  if not public.is_admin() then return jsonb_build_object('error','forbidden'); end if;
  select * into v_sub from public.subscriptions
   where user_id = p_user_id and status in ('pending','active') limit 1;
  if v_sub.id is null then return jsonb_build_object('error','no_subscription'); end if;
  update public.subscriptions set status = 'canceled', cancel_at_period_end = false where id = v_sub.id;
  perform public._sub_event(v_sub.id, p_user_id, 'admin_deactivated',
          jsonb_build_object('by', auth.uid(), 'reason', p_reason));
  perform set_config('app.skip_privilege_guard','true', true);
  update public.profiles set is_premium = false, premium_expires_at = null where id = p_user_id;
  perform set_config('app.skip_privilege_guard','false', true);
  return jsonb_build_object('ok', true);
end $fn$;

-- ── 5. NE ANEN E KODIT ───────────────────────────────────────
-- Hiq nga app/admin/page.tsx importet e RolesTab dhe Trend,
-- rreshtin ['roles', ...] dhe bllokun NEVOJA/lejohet/groups.
-- Fshi app/admin/tabs/RolesTab.tsx dhe app/admin/tabs/Trend.tsx.
-- Kthe app/admin/tabs/InvoicesTab.tsx ne commit-in para 2026-08-10.

-- ── 6. RIKTHE AKSESIN E NDIHMESVE TE BRENDSHEM (nuk rekomandohet) ──
-- Vetem nese diçka mbeshtetet vertet ne thirrjen e tyre nga shfletuesi.
-- grant execute on function public._issue_invoice(uuid, uuid, text, text, numeric, text) to authenticated;
-- grant execute on function public._next_invoice_number() to authenticated;
-- grant execute on function public._sub_event(uuid, uuid, text, jsonb) to authenticated;
