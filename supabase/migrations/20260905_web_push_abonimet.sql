-- WEB-PUSH: tabela e abonimeve të pajisjeve — 5 shtator 2026 (Faza A, ADITIVE)
--
-- Push-i "si FB/Insta" te pajisja me tab të mbyllur kërkon Web Push API, që kërkon
-- një service worker. Kjo tabelë ruan abonimet (një rresht për pajisje/shfletues).
-- Sender-i (Edge Function `send-push`, me service_role) e lexon këtë tabelë; RLS
-- e mban private për çdo përdorues (vetëm i veti).
--
-- KUJDES FRESKIA (urdhër pronari): kjo është VETËM DB — s'prek fare service worker-in
-- as freskinë. SW-ja push-only (pa fetch handler) vjen në Fazën B, e ndarë.
--
-- Higjienë §0-bis: ADITIVE (tabelë + RLS të reja). Asnjë revoke, asnjë ngushtim.

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  ua         text,
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- Vetëm i zoti sheh/menaxhon abonimet e veta. Sender-i (service_role) e anashkalon RLS-në.
drop policy if exists push_sub_select_own on public.push_subscriptions;
create policy push_sub_select_own on public.push_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists push_sub_insert_own on public.push_subscriptions;
create policy push_sub_insert_own on public.push_subscriptions
  for insert with check (user_id = auth.uid());

drop policy if exists push_sub_update_own on public.push_subscriptions;
create policy push_sub_update_own on public.push_subscriptions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists push_sub_delete_own on public.push_subscriptions;
create policy push_sub_delete_own on public.push_subscriptions
  for delete using (user_id = auth.uid());
