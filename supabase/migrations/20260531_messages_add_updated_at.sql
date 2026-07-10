-- The trg_set_updated_at trigger fires on every UPDATE to messages and calls
-- set_updated_at() which does NEW.updated_at = now(), but messages had no
-- updated_at column — every UPDATE crashed and rolled back silently, so
-- marking messages as "read" never worked.

ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE messages SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE messages ALTER COLUMN updated_at SET DEFAULT now();
