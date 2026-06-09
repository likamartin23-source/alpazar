-- Performance indexes for trigger and biznese index page
CREATE INDEX IF NOT EXISTS idx_price_alerts_trigger
  ON price_alerts(listing_id, triggered)
  WHERE triggered = FALSE;

CREATE INDEX IF NOT EXISTS idx_businesses_verified_date
  ON businesses(is_verified DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_businesses_city
  ON businesses(city)
  WHERE city IS NOT NULL;
