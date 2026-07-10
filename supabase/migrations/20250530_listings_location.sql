-- Shton kolonat e lokacionit GPS në tabelën listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Index për kërkime gjeografike të ardhshme
CREATE INDEX IF NOT EXISTS idx_listings_lat_lng
  ON listings (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
