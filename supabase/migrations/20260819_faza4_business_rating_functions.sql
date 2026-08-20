-- Faza 4 (DB): agregim rating + listë reviews për BIZNESIN, nga reviews→listings.
-- reviews s'kanë business_id; agregimi bëhet via listing_id → listings.business_id.
-- Additive, read-only, SECURITY DEFINER (reviews shfaqen publikisht si seller_rating).
create or replace function public.business_rating(p_business uuid)
returns table(avg_rating numeric, review_count integer)
language sql stable security definer set search_path=public as $f$
  select round(avg(r.rating)::numeric,2), count(*)::int
  from public.reviews r join public.listings l on l.id=r.listing_id
  where l.business_id = p_business
$f$;

create or replace function public.business_reviews(p_business uuid, p_limit integer default 20)
returns table(id uuid, rating integer, comment text, created_at timestamptz,
              reviewer_name text, reviewer_avatar text, purchase_verified boolean)
language sql stable security definer set search_path=public as $f$
  select r.id, r.rating, r.comment, r.created_at,
         coalesce(nullif(p.full_name,''), p.username, 'Përdorues'), p.avatar_url,
         coalesce(r.purchase_verified,false)
  from public.reviews r join public.listings l on l.id=r.listing_id
  left join public.profiles p on p.id=r.reviewer_id
  where l.business_id = p_business
  order by r.created_at desc limit p_limit
$f$;

revoke all on function public.business_rating(uuid) from public;
revoke all on function public.business_reviews(uuid, integer) from public;
grant execute on function public.business_rating(uuid) to anon, authenticated;
grant execute on function public.business_reviews(uuid, integer) to anon, authenticated;
