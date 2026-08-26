-- SCALE/performancë (26 gusht 2026) — nga këshilltari i performancës së Supabase. Aplikuar LIVE.
-- Verifikuar: pas kësaj, këshilltari NUK raporton më `unindexed_foreign_keys` as `auth_rls_initplan`.
-- (Paralajmërimet "unused index" mbeten INFO — false-positive nga baza bosh; janë indekset e shkallës.)

-- 1) Indeks mbi foreign-key-in e paindeksuar → JOIN/DELETE të shpejta në shkallë.
create index if not exists idx_takedown_requests_listing_id
  on public.takedown_requests (listing_id);

-- 2) RLS initplan: `auth.uid()` rivlerësohej për çdo rresht (suboptimal me miliona rreshta).
--    Mbështjellja me (select auth.uid()) e vlerëson NJË herë. Semantikë identike.
drop policy if exists ae_owner_select on public.analytics_events;
create policy ae_owner_select on public.analytics_events
  for select using (owner_id = (select auth.uid()));
