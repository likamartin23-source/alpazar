-- Remove duplicate notification policies
DROP POLICY IF EXISTS "notif_sel" ON notifications;
DROP POLICY IF EXISTS "notif_upd" ON notifications;

-- Tighten price_alerts INSERT: only allow inserting own rows
DROP POLICY IF EXISTS "pa_insert" ON price_alerts;
CREATE POLICY "pa_insert" ON price_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tighten push_tokens INSERT: only allow inserting own rows
DROP POLICY IF EXISTS "push_insert" ON push_tokens;
CREATE POLICY "push_insert" ON push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tighten saved_listings INSERT: only allow inserting own rows
DROP POLICY IF EXISTS "saved_insert" ON saved_listings;
CREATE POLICY "saved_insert" ON saved_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
