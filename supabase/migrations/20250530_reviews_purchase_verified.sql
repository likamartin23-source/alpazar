-- Krijon tabelën reviews nëse nuk ekziston
CREATE TABLE IF NOT EXISTS reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id      UUID REFERENCES listings(id) ON DELETE SET NULL,
  stars           INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment         TEXT,
  purchase_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reviewer_id, listing_id)
);

-- Shton kolonën purchase_verified nëse reviews ekziston pa të
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS purchase_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);

CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "reviews_delete" ON reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON reviews (seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews (listing_id);
