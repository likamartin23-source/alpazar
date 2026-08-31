-- ARSYETIMI I VENDIMIT + RRUGA E ANKIMIT
--
-- SHKELJA (CLAUDE.md §4.9, §2.2, §2.4): `moderation_queue.resolution` mblidhet
-- e detyrueshme te QueueTab, por `tg_queue_resolve_sync` e përhap VETËM te
-- `reports.admin_note` (raportuesi) dhe `takedown_requests.resolver_note`
-- (ankuesi). PRONARI i shpalljes — i vetmi që pëson pasojën — nuk merr asgjë:
-- shpallja i bëhet is_active=false dhe zhduket pa fjalë. Pa arsyetim dhe pa
-- rrugë ankimi (neni 20, ligji 124/2024; sanksion deri 2 mld lekë ose 4%).
--
-- ADDITIV: asnjë kolonë ekzistuese nuk ndryshohet, asnjë funksion nuk zëvendësohet
-- në mënyrë prishëse. Rollback: drop trigger + drop funksionet + drop tabela.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Tabela e ankimeve
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.moderation_appeals (
  id            uuid primary key default gen_random_uuid(),
  queue_id      uuid not null references public.moderation_queue(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  arsyeja       text not null check (length(btrim(arsyeja)) >= 20),
  status        text not null default 'pending' check (status in ('pending','accepted','rejected')),
  reviewed_by   uuid references auth.users(id),
  reviewer_note text,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  -- Një ankim për rast: pa spam, dhe vendimi mbetet i gjurmueshëm.
  constraint moderation_appeals_unik unique (queue_id, user_id)
);

create index if not exists idx_appeals_user   on public.moderation_appeals(user_id, created_at desc);
create index if not exists idx_appeals_status on public.moderation_appeals(status, created_at);

alter table public.moderation_appeals enable row level security;

-- Pronari sheh dhe krijon vetëm të vetin; nuk e ndryshon dot pas dorëzimit.
drop policy if exists appeals_own_select on public.moderation_appeals;
create policy appeals_own_select on public.moderation_appeals
  for select using (user_id = auth.uid() or public.has_perm('content.moderate'));

drop policy if exists appeals_own_insert on public.moderation_appeals;
create policy appeals_own_insert on public.moderation_appeals
  for insert with check (user_id = auth.uid());

-- Vetëm moderatorët e mbyllin; përdoruesi nuk e prek dot vendimin.
drop policy if exists appeals_admin_update on public.moderation_appeals;
create policy appeals_admin_update on public.moderation_appeals
  for update using (public.has_perm('content.moderate'));

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Arsyetimi i shkon PRONARIT — jo vetëm raportuesit
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.tg_notify_owner_on_moderation()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_owner uuid;
  v_titull text;
begin
  if NEW.status not in ('resolved','dismissed') or OLD.status in ('resolved','dismissed') then
    return NEW;
  end if;
  if NEW.ref_type <> 'listing' then return NEW; end if;

  select user_id into v_owner from public.listings where id = NEW.ref_id;
  if v_owner is null then return NEW; end if;

  v_titull := case
    when NEW.status = 'resolved' then 'Shpallja jote u hoq nga moderimi'
    else 'Shpallja jote u shqyrtua — pa masë'
  end;

  -- Arsyetimi faktik i shkon personit që pëson, me lidhje drejt ankimit.
  insert into public.notifications (user_id, type, title, body, link, ref_id, ref_type, metadata)
  values (
    v_owner, 'system', v_titull,
    coalesce(NEW.resolution, 'Pa arsyetim të regjistruar.'),
    '/moderimi/' || NEW.id::text,
    NEW.id, 'moderation_queue',
    jsonb_build_object('listing_id', NEW.ref_id, 'mund_te_ankohet', NEW.status = 'resolved')
  );

  return NEW;
end $$;

drop trigger if exists tg_moderation_notify_owner on public.moderation_queue;
create trigger tg_moderation_notify_owner
  after update on public.moderation_queue
  for each row execute function public.tg_notify_owner_on_moderation();

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Përdoruesi dorëzon ankim
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.submit_appeal(p_queue_id uuid, p_arsyeja text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare v_q public.moderation_queue; v_owner uuid; v_id uuid;
begin
  if auth.uid() is null then return jsonb_build_object('error','pa_autentikim'); end if;
  if length(btrim(coalesce(p_arsyeja,''))) < 20 then
    return jsonb_build_object('error','arsyeja_e_shkurter');
  end if;

  select * into v_q from public.moderation_queue where id = p_queue_id;
  if v_q.id is null then return jsonb_build_object('error','nuk_u_gjet'); end if;
  if v_q.status <> 'resolved' then return jsonb_build_object('error','pa_vendim'); end if;

  -- Vetëm pronari i përmbajtjes ankohet.
  select user_id into v_owner from public.listings where id = v_q.ref_id;
  if v_owner is distinct from auth.uid() then
    return jsonb_build_object('error','nuk_je_pronari');
  end if;

  insert into public.moderation_appeals (queue_id, user_id, arsyeja)
  values (p_queue_id, auth.uid(), btrim(p_arsyeja))
  on conflict (queue_id, user_id) do nothing
  returning id into v_id;

  if v_id is null then return jsonb_build_object('error','ankim_ekzistues'); end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Moderatori e mbyll — me KUFIRIN e §2.4
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.admin_resolve_appeal(p_id uuid, p_accept boolean, p_note text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare v_a public.moderation_appeals; v_q public.moderation_queue;
begin
  if not public.has_perm('content.moderate') then
    return jsonb_build_object('error','pa_leje');
  end if;
  if length(btrim(coalesce(p_note,''))) < 10 then
    return jsonb_build_object('error','arsyetim_i_detyrueshem');
  end if;

  select * into v_a from public.moderation_appeals where id = p_id;
  if v_a.id is null then return jsonb_build_object('error','nuk_u_gjet'); end if;
  if v_a.status <> 'pending' then return jsonb_build_object('error','tashme_i_mbyllur'); end if;

  select * into v_q from public.moderation_queue where id = v_a.queue_id;

  -- §2.4: ankimin NUK e shqyrton kush mori vendimin e parë. Zbatohet në bazë,
  -- jo në UI — që të mos anashkalohet nga një thirrje e drejtpërdrejtë e RPC-së.
  if v_q.resolved_by is not null and v_q.resolved_by = auth.uid() then
    return jsonb_build_object('error','konflikt_interesi',
      'mesazh','Ankimin e shqyrton nje moderator tjeter, jo ai qe mori vendimin e pare.');
  end if;

  update public.moderation_appeals
     set status = case when p_accept then 'accepted' else 'rejected' end,
         reviewed_by = auth.uid(), reviewer_note = btrim(p_note), resolved_at = now()
   where id = p_id;

  -- Ankim i pranuar → përmbajtja rikthehet.
  if p_accept and v_q.ref_type = 'listing' then
    update public.listings
       set is_active = true, moderation_status = 'approved'
     where id = v_q.ref_id;
  end if;

  insert into public.notifications (user_id, type, title, body, link, ref_id, ref_type)
  values (v_a.user_id, 'system',
    case when p_accept then 'Ankimi u pranua — shpallja u rikthye'
         else 'Ankimi u refuzua' end,
    btrim(p_note), '/moderimi/' || v_a.queue_id::text, v_a.id, 'moderation_appeal');

  perform public.admin_log('ankim_'||(case when p_accept then 'pranuar' else 'refuzuar' end),
    'moderation_appeals', p_id, null,
    jsonb_build_object('vendimi_i_pare_nga', v_q.resolved_by, 'shqyrtuar_nga', auth.uid()));

  return jsonb_build_object('ok', true, 'pranuar', p_accept);
end $$;

revoke all on function public.submit_appeal(uuid, text) from public;
grant execute on function public.submit_appeal(uuid, text) to authenticated;
revoke all on function public.admin_resolve_appeal(uuid, boolean, text) from public;
grant execute on function public.admin_resolve_appeal(uuid, boolean, text) to authenticated;
