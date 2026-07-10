-- Premium requests table (FAZA 4-a)
CREATE TABLE IF NOT EXISTS premium_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'gifted')),
  note text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS premium_requests_user_id_idx ON premium_requests(user_id);
CREATE INDEX IF NOT EXISTS premium_requests_status_idx ON premium_requests(status);

-- RLS
ALTER TABLE premium_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own requests
CREATE POLICY "Users can view own premium requests"
  ON premium_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own premium requests"
  ON premium_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only service role can update (admin operations go through API)
-- No UPDATE policy for regular users

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_premium_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER premium_requests_updated_at
  BEFORE UPDATE ON premium_requests
  FOR EACH ROW EXECUTE FUNCTION update_premium_requests_updated_at();
