-- ================================================
-- ALPAZAR DATABASE SCHEMA
-- Ekzekuto ne: Supabase → SQL Editor → New query → RUN
-- ================================================

-- KATEGORITE KRYESORE
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text default 'tag',
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- KATEGORITE E KAFSHEVE
create table if not exists pet_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  emoji text,
  type text check (type in ('home', 'farm')) default 'home',
  listing_count int default 0,
  is_active boolean default true
);

-- PROFILI I PERDORUESIT
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  phone text,
  city text,
  bio text,
  is_premium boolean default false,
  is_admin boolean default false,
  premium_expires_at timestamptz,
  gamification_points int default 0,
  gamification_level text default 'fillestar',
  created_at timestamptz default now()
);

-- SHPALLJET
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  category_id uuid references categories(id),
  pet_category_id uuid references pet_categories(id),
  title text not null,
  description text,
  price numeric,
  currency text default 'ALL' check (currency in ('ALL', 'EUR')),
  condition text check (condition in ('i_ri', 'i_perdorur')),
  city text,
  is_premium boolean default false,
  is_active boolean default true,
  images text[],
  views_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TE PREFERUARAT
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

-- MESAZHET
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id),
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- VLEREISIMET
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references profiles(id),
  seller_id uuid references profiles(id),
  listing_id uuid references listings(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- ABONIMET PREMIUM
create table if not exists premium_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  plan text check (plan in ('monthly', 'yearly')),
  amount_eur numeric,
  period int,
  start_date timestamptz default now(),
  end_date timestamptz,
  payment_method text,
  status text default 'pending' check (status in ('active', 'pending', 'cancelled', 'suspended')),
  created_at timestamptz default now()
);

-- METODAT E PAGESES (menaxhohet nga admini)
create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('card', 'paypal', 'bank', 'mobile')),
  config_json jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- KONFIGURIMET E APLIKACIONIT (menaxhohet nga admini)
create table if not exists admin_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  updated_at timestamptz default now()
);

-- RAPORTIMET
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  listing_id uuid references listings(id),
  reason text,
  status text default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  admin_note text,
  created_at timestamptz default now()
);

-- REFERIMI
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references profiles(id),
  referred_id uuid references profiles(id),
  bonus_days int default 7,
  created_at timestamptz default now()
);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

alter table profiles enable row level security;
alter table listings enable row level security;
alter table favorites enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;
alter table premium_subscriptions enable row level security;
alter table reports enable row level security;
alter table referrals enable row level security;

-- Profiles
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Listings
create policy "listings_select_active" on listings for select using (is_active = true);
create policy "listings_insert_auth" on listings for insert with check (auth.uid() = user_id);
create policy "listings_update_own" on listings for update using (auth.uid() = user_id);
create policy "listings_delete_own" on listings for delete using (auth.uid() = user_id);

-- Favorites
create policy "favorites_select_own" on favorites for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete_own" on favorites for delete using (auth.uid() = user_id);

-- Messages
create policy "messages_select_own" on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "messages_insert_own" on messages for insert
  with check (auth.uid() = sender_id);

-- Reviews
create policy "reviews_select_all" on reviews for select using (true);
create policy "reviews_insert_auth" on reviews for insert with check (auth.uid() = reviewer_id);

-- Premium subscriptions
create policy "subs_select_own" on premium_subscriptions for select using (auth.uid() = user_id);

-- Reports
create policy "reports_insert_auth" on reports for insert with check (auth.uid() = reporter_id);

-- ================================================
-- TE DHENAT FILLESTARE
-- ================================================

-- Kategorite kryesore
insert into categories (name, slug, icon, sort_order) values
  ('Elektronikë', 'elektronike', 'device-mobile', 1),
  ('Automjete', 'automjete', 'car', 2),
  ('Prona', 'prona', 'home', 3),
  ('Veshje', 'veshje', 'shirt', 4),
  ('Mobilje', 'mobilje', 'armchair', 5),
  ('Kafshë', 'kafshë', 'paw', 6),
  ('Shërbime', 'sherbime', 'tools', 7),
  ('Punë', 'pune', 'briefcase', 8),
  ('Ushqim', 'ushqim', 'salad', 9),
  ('Turizëm', 'turizem', 'plane', 10),
  ('Sport', 'sport', 'ball', 11),
  ('Arsim', 'arsim', 'book', 12),
  ('Shëndet', 'shendet', 'heart', 13),
  ('Biznese', 'biznese', 'building-store', 14),
  ('Gaming', 'gaming', 'device-gamepad', 15),
  ('Të tjera', 'te-tjera', 'dots', 16)
on conflict (slug) do nothing;

-- Kategorite e kafsheve
insert into pet_categories (name, slug, emoji, type) values
  ('Qen', 'qen', '🐕', 'home'),
  ('Mace', 'mace', '🐈', 'home'),
  ('Zogj', 'zogj', '🐦', 'home'),
  ('Lopë', 'lope', '🐄', 'farm'),
  ('Derr', 'derr', '🐖', 'farm'),
  ('Dhi', 'dhi', '🐐', 'farm'),
  ('Dele', 'dele', '🐑', 'farm'),
  ('Kalë', 'kale', '🐴', 'farm'),
  ('Gomar', 'gomar', '🫏', 'farm'),
  ('Pulë', 'pule', '🐓', 'farm'),
  ('Të tjera', 'te-tjera-kafshë', '➕', 'farm')
on conflict (slug) do nothing;

-- Metodat e pageses
insert into payment_methods (name, type, is_active) values
  ('Visa / Mastercard', 'card', true),
  ('PayPal', 'paypal', true),
  ('Transfer Bankar', 'bank', true),
  ('Mobile Banking', 'mobile', false)
on conflict do nothing;

-- Konfigurimet e aplikacionit
insert into admin_settings (key, value) values
  ('site_name', 'ALPAZAR'),
  ('site_slogan', 'Shit · Bli · Bëj Pazrin Tënd'),
  ('primary_color', '#F5C842'),
  ('accent_color', '#E63312'),
  ('premium_monthly_price', '9.99'),
  ('premium_yearly_price', '7.99'),
  ('free_listings_limit', '3'),
  ('free_photos_limit', '3'),
  ('premium_photos_limit', '20'),
  ('ai_assistant_enabled', 'true'),
  ('map_enabled', 'true'),
  ('stories_enabled', 'true'),
  ('gamification_enabled', 'true'),
  ('referral_enabled', 'true'),
  ('ads_enabled', 'false')
on conflict (key) do nothing;

-- ================================================
-- TRIGGER: Auto-create profile pas regjistrimit
-- ================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
