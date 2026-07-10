-- Allow users to mark their own notifications as read (update is_read, read_at)
CREATE POLICY "notif_upd"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
