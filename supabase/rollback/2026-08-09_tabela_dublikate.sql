-- ============================================================================
-- PLAN RIKTHIMI — tabela te fshira me 2026-08-09
-- ============================================================================
-- Arsyeja e fshirjes: ishin DUBLIKATE te tabelave qe perdoren realisht.
--   user_blocks      -> dublikat i `blocks`   (ne perdorim, 3 skedare)
--   seller_reviews   -> dublikat i `reviews`  (ne perdorim, 2 skedare)
--   listing_reports  -> dublikat i `reports`  (ne perdorim, 5 skedare)
--   user_reports     -> dublikat i `reports`
--
-- Gjendja ne momentin e fshirjes: TE KATERTA ME 0 RRESHTA.
-- Referenca ne kod: ZERO (kontrolluar ne te gjithe repo-n, perfshi edge functions).
--
-- PER TA RIKTHYER: ekzekuto kete skedar te plote. Rikrijon strukturen,
-- kufizimet, indekset dhe politikat RLS pikerisht si ishin.
-- ============================================================================

-- ── user_blocks ─────────────────────────────────────────────────────────────
create table if not exists public.user_blocks (
  id uuid not null default gen_random_uuid(),
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  constraint user_blocks_pkey primary key (id),
  constraint user_blocks_check check (blocker_id <> blocked_id),
  constraint user_blocks_blocker_id_blocked_id_key unique (blocker_id, blocked_id),
  constraint user_blocks_blocker_id_fkey foreign key (blocker_id) references public.profiles(id) on delete cascade,
  constraint user_blocks_blocked_id_fkey foreign key (blocked_id) references public.profiles(id) on delete cascade
);
create index if not exists user_blocks_blocker_idx on public.user_blocks using btree (blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks using btree (blocked_id);
alter table public.user_blocks enable row level security;
create policy blocks_select on public.user_blocks for select using (blocker_id = (select auth.uid()));
create policy blocks_insert on public.user_blocks for insert with check (blocker_id = (select auth.uid()));
create policy blocks_delete on public.user_blocks for delete using (blocker_id = (select auth.uid()));

-- ── seller_reviews ──────────────────────────────────────────────────────────
create table if not exists public.seller_reviews (
  id uuid not null default gen_random_uuid(),
  seller_id uuid not null,
  reviewer_id uuid not null,
  listing_id uuid,
  stars smallint not null,
  comment text,
  is_visible boolean not null default true,
  reply text,
  reply_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_reviews_pkey primary key (id),
  constraint seller_reviews_stars_check check (stars >= 1 and stars <= 5),
  constraint seller_reviews_seller_id_reviewer_id_listing_id_key unique (seller_id, reviewer_id, listing_id),
  constraint seller_reviews_seller_id_fkey foreign key (seller_id) references public.profiles(id) on delete cascade,
  constraint seller_reviews_reviewer_id_fkey foreign key (reviewer_id) references public.profiles(id) on delete cascade,
  constraint seller_reviews_listing_id_fkey foreign key (listing_id) references public.listings(id) on delete set null
);
create index if not exists seller_reviews_seller_idx on public.seller_reviews using btree (seller_id, created_at desc);
create index if not exists seller_reviews_reviewer_idx on public.seller_reviews using btree (reviewer_id);
create index if not exists seller_reviews_stars_idx on public.seller_reviews using btree (stars);
create index if not exists idx_seller_reviews_listing_id on public.seller_reviews using btree (listing_id);
alter table public.seller_reviews enable row level security;
create policy reviews_select on public.seller_reviews for select
  using (is_visible = true or reviewer_id = (select auth.uid()) or is_admin());
create policy reviews_insert on public.seller_reviews for insert with check (reviewer_id = (select auth.uid()));
create policy reviews_update on public.seller_reviews for update
  using (reviewer_id = (select auth.uid()) or is_admin());
create policy reviews_delete on public.seller_reviews for delete
  using (reviewer_id = (select auth.uid()) or is_admin());

-- ── listing_reports ─────────────────────────────────────────────────────────
create table if not exists public.listing_reports (
  id uuid not null default gen_random_uuid(),
  listing_id uuid not null,
  reporter_id uuid not null,
  reason text not null,
  detail text,
  status text not null default 'pending',
  admin_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint listing_reports_pkey primary key (id),
  constraint listing_reports_listing_id_reporter_id_key unique (listing_id, reporter_id),
  constraint listing_reports_listing_id_fkey foreign key (listing_id) references public.listings(id) on delete cascade,
  constraint listing_reports_reporter_id_fkey foreign key (reporter_id) references public.profiles(id) on delete cascade,
  constraint listing_reports_resolved_by_fkey foreign key (resolved_by) references public.profiles(id)
);
create index if not exists listing_reports_listing_idx on public.listing_reports using btree (listing_id);
create index if not exists listing_reports_reporter_idx on public.listing_reports using btree (reporter_id);
create index if not exists listing_reports_status_idx on public.listing_reports using btree (status);
create index if not exists idx_listing_reports_resolved_by on public.listing_reports using btree (resolved_by);
alter table public.listing_reports enable row level security;
create policy reports_select on public.listing_reports for select
  using (reporter_id = (select auth.uid()) or is_admin());
create policy reports_insert on public.listing_reports for insert with check ((select auth.uid()) = reporter_id);
create policy reports_update on public.listing_reports for update using (is_admin());

-- ── user_reports ────────────────────────────────────────────────────────────
create table if not exists public.user_reports (
  id uuid not null default gen_random_uuid(),
  reported_id uuid not null,
  reporter_id uuid not null,
  reason text not null,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  constraint user_reports_pkey primary key (id),
  constraint user_reports_reported_id_reporter_id_key unique (reported_id, reporter_id),
  constraint user_reports_reported_id_fkey foreign key (reported_id) references public.profiles(id) on delete cascade,
  constraint user_reports_reporter_id_fkey foreign key (reporter_id) references public.profiles(id) on delete cascade
);
create index if not exists idx_user_reports_reporter_id on public.user_reports using btree (reporter_id);
alter table public.user_reports enable row level security;
create policy admin_read_reports on public.user_reports for select
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));
create policy admin_update_reports on public.user_reports for update
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));
create policy insert_own_report on public.user_reports for insert with check (reporter_id = (select auth.uid()));
