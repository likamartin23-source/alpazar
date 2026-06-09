-- FAZA 3: B2C legal fields + contact + updated_at
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS nipt TEXT,
  ADD COLUMN IF NOT EXISTS withdrawal_days SMALLINT DEFAULT 14,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN businesses.nipt IS 'Numri i Identifikimit të Personit të Tatueshëm (TVSH)';
COMMENT ON COLUMN businesses.withdrawal_days IS 'E drejta e tërheqjes B2C — Direktiva EU 2011/83/EU — Default 14 ditë';

CREATE OR REPLACE FUNCTION set_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_businesses_updated_at ON businesses;
CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION set_businesses_updated_at();
