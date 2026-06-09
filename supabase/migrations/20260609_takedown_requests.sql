-- takedown_requests: legal notice-and-takedown request tracking
create table if not exists takedown_requests (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('copyright', 'illegal_content', 'privacy', 'defamation', 'other')),
  content_url text,
  description text not null,
  contact_email text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'rejected')),
  resolver_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table takedown_requests enable row level security;

-- Only admins (service_role) can read/update; anyone can insert
create policy "admins_all" on takedown_requests
  for all using (auth.role() = 'service_role');

create policy "public_insert" on takedown_requests
  for insert with check (true);

create index idx_takedown_status on takedown_requests(status, created_at desc);
