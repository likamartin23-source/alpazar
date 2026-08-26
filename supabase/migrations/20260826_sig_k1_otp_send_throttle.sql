-- Siguri K1 (26 gusht 2026): anti-abuzim per send-otp (bombardim SMS/email).
-- Tabela e throttle-it; RLS-deny (vetem service_role/edge e prek). Aplikuar LIVE.
create table if not exists public.otp_send_throttle (
  k text primary key,
  last_sent timestamptz,
  count integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.otp_send_throttle enable row level security;
revoke all on public.otp_send_throttle from anon, authenticated;
comment on table public.otp_send_throttle is
  'Anti-abuse per send-otp: cooldown per-identifier + dritare per-IP. RLS-deny; vetem service_role (edge). Shtuar 26 gusht 2026 (K1).';
