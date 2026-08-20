-- Faza 7c (DB): "Afer meje" — shpalljet aktive brenda nje rrezeje, te renditura
-- sipas distances. Haversine (km) + parafiltrim me kuti kufizuese qe shfrytezon
-- indeksin ekzistues idx_listings_lat_lng (pa PostGIS; te dhenat jane te vogla
-- dhe kutia e ngushton kandidatet perpara acos-it te shtrenjte).
--
-- Privatesi (Ligji 124/2024): vendndodhja e perdoruesit vjen si parametra
-- kalimtare p_lat/p_lng — NUK ruhet asgje ne server. Veprimi eshte i nisur nga
-- perdoruesi (butoni "Afer meje" + pelqimi i shfletuesit per geolokacion).
-- Additive, read-only, SECURITY DEFINER (lexon vetem shpalljet aktive publike).
create or replace function public.listings_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 25,
  p_limit integer default 60
)
returns table(id uuid, distance_km double precision)
language sql stable security definer set search_path=public as $f$
  with box as (
    select
      p_radius_km / 111.0 as dlat,
      p_radius_km / (111.0 * greatest(cos(radians(p_lat)), 0.01)) as dlng
  ),
  kandidate as (
    select l.id, l.latitude as la, l.longitude as ln
    from public.listings l, box
    where l.is_active = true
      and l.latitude is not null and l.longitude is not null
      and l.latitude  between p_lat - box.dlat and p_lat + box.dlat
      and l.longitude between p_lng - box.dlng and p_lng + box.dlng
  ),
  me_dist as (
    select k.id,
      6371.0 * acos(least(1.0, greatest(-1.0,
        sin(radians(p_lat)) * sin(radians(k.la)) +
        cos(radians(p_lat)) * cos(radians(k.la)) * cos(radians(k.ln - p_lng))
      ))) as distance_km
    from kandidate k
  )
  select id, distance_km from me_dist
  where distance_km <= p_radius_km
  order by distance_km asc
  limit p_limit
$f$;

revoke all on function public.listings_near(double precision, double precision, double precision, integer) from public;
grant execute on function public.listings_near(double precision, double precision, double precision, integer) to anon, authenticated;
