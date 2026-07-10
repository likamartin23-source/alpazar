-- AI self-monitoring: captured runtime errors + AI (Groq) diagnosis.
-- Powers /api/monitor (POST capture + diagnose + Slack alert; GET admin list).
create table if not exists public.health_events (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  source        text,
  level         text default 'error',
  message       text not null,
  stack         text,
  url           text,
  user_agent    text,
  fingerprint   text not null,
  count         int  not null default 1,
  severity      text,
  category      text,
  likely_cause  text,
  suggested_fix text,
  is_actionable boolean,
  status        text not null default 'new'
);

create index if not exists health_events_created_idx on public.health_events (created_at desc);
create unique index if not exists health_events_fingerprint_key on public.health_events (fingerprint);

alter table public.health_events enable row level security;

-- Reads: admins only. Writes happen via service role in the API route (bypasses RLS).
drop policy if exists health_events_admin_select on public.health_events;
create policy health_events_admin_select on public.health_events
  for select to authenticated using (is_admin());
