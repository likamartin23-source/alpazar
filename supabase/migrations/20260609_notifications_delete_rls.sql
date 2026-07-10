-- KOMA NJ-1: Add DELETE RLS policy for notifications table
-- Without this, authenticated users cannot delete their own notifications

DROP POLICY IF EXISTS "owner_delete_notifications" ON notifications;

CREATE POLICY "owner_delete_notifications" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
