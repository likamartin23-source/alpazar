-- Shton kolonën trust_score në tabelën profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100);

-- Funksion për të llogaritur trust_score bazuar në aktivitet
CREATE OR REPLACE FUNCTION compute_trust_score(
  p_created_at    TIMESTAMPTZ,
  p_listings_count INTEGER,
  p_gamification   INTEGER
) RETURNS INTEGER AS $$
DECLARE
  months_active    FLOAT;
  age_factor       FLOAT;
  listing_factor   FLOAT;
  points_factor    FLOAT;
BEGIN
  months_active  := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / (60 * 60 * 24 * 30);
  age_factor     := LEAST(months_active * 2, 40);
  listing_factor := LEAST(p_listings_count * 0.5, 30);
  points_factor  := LEAST(p_gamification::FLOAT / 100, 30);
  RETURN ROUND(age_factor + listing_factor + points_factor)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update të gjitha profiles ekzistuese
UPDATE profiles p
SET trust_score = compute_trust_score(
  p.created_at,
  (SELECT COUNT(*) FROM listings l WHERE l.user_id = p.id AND l.is_active = TRUE)::INTEGER,
  COALESCE(p.gamification_points, 0)
);
