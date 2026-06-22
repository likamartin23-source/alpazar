CREATE TABLE IF NOT EXISTS premium_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'monthly', -- monthly / yearly
  payment_method_id uuid REFERENCES payment_methods(id),
  amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending / approved / rejected
  days_requested integer NOT NULL DEFAULT 30,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE premium_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_read" ON premium_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_insert" ON premium_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "admin_all" ON premium_requests FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
