-- MAR-7: Semantic Search me pgvector
-- Kërkim semantik për shpallje bazuar në kuptim (jo vetëm fjalë kyçe).
-- Embeddings: modeli falas `gte-small` i Supabase (384 dimensione), gjenerohet
-- nga Edge Function `embed` (Supabase.ai) — pa çelës të jashtëm, pa kosto.

-- 1) Extension
create extension if not exists vector;

-- 2) Kolona e embedding-ut (384-dim = gte-small)
alter table public.listings
  add column if not exists embedding vector(384);

-- 3) Indeks ANN për ngjashmëri kosinusi (ivfflat). `lists` ~ sqrt(#rreshta);
--    100 është i mirë deri në ~1M rreshta. Rikrijo me më shumë lists kur rritet.
create index if not exists idx_listings_embedding
  on public.listings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4) RPC e kërkimit semantik. Merr embedding-un e pyetjes, kthen shpalljet
--    aktive më të ngjashme mbi një prag. SECURITY DEFINER + grant anon/auth
--    (pa varësi nga SUPABASE_SERVICE_ROLE_KEY, si pjesa tjetër e app-it).
create or replace function public.match_listings(
  query_embedding vector(384),
  match_count int default 24,
  similarity_threshold float default 0.30
)
returns table (
  id uuid,
  title text,
  price numeric,
  currency text,
  condition text,
  city text,
  is_premium boolean,
  images jsonb,
  category_id uuid,
  created_at timestamptz,
  user_id uuid,
  similarity float
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    l.id, l.title, l.price, l.currency, l.condition, l.city,
    l.is_premium, l.images, l.category_id, l.created_at, l.user_id,
    1 - (l.embedding <=> query_embedding) as similarity
  from public.listings l
  where l.is_active = true
    and l.embedding is not null
    and 1 - (l.embedding <=> query_embedding) > similarity_threshold
  order by l.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function public.match_listings(vector, int, float) from public;
grant execute on function public.match_listings(vector, int, float) to anon, authenticated;

-- 5) Ndihmës për backfill: kthen shpalljet aktive që s'kanë embedding ende,
--    që Edge Function `embed` (mode=backfill) t'i procesojë në grupe.
create or replace function public.listings_without_embedding(batch int default 50)
returns table (id uuid, title text, description text, city text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select l.id, l.title, l.description, l.city
  from public.listings l
  where l.is_active = true and l.embedding is null
  order by l.created_at desc
  limit batch;
$$;

revoke execute on function public.listings_without_embedding(int) from public;
-- Vetëm service_role e thërret nga Edge Function (jo publik).

-- 6) RPC për të ruajtur embedding-un e një shpalljeje (thirret nga Edge Function).
create or replace function public.set_listing_embedding(p_id uuid, p_embedding vector(384))
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.listings set embedding = p_embedding where id = p_id;
$$;

revoke execute on function public.set_listing_embedding(uuid, vector) from public;
-- Vetëm service_role (Edge Function) e thërret.
