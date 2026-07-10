-- Performance advisor: multiple_permissive_policies (14) on notifications &
-- premium_requests. Collapse overlapping/duplicate policies into exactly one
-- permissive policy per (role, action). Behavior preserved; also adds the missing
-- admin INSERT policy on notifications (admin/page.tsx inserts notifications for
-- other users — previously silently denied by RLS-with-no-INSERT-policy).

-- ── notifications ────────────────────────────────────────────────
DROP POLICY IF EXISTS notif_delete                ON public.notifications;
DROP POLICY IF EXISTS owner_delete_notifications  ON public.notifications;
DROP POLICY IF EXISTS notif_select                ON public.notifications;
DROP POLICY IF EXISTS notif_upd                   ON public.notifications;
DROP POLICY IF EXISTS notif_update                ON public.notifications;

CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY notifications_admin_insert ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR is_admin());

-- ── premium_requests ─────────────────────────────────────────────
DROP POLICY IF EXISTS admin_all                               ON public.premium_requests;
DROP POLICY IF EXISTS premreq_admin_del                       ON public.premium_requests;
DROP POLICY IF EXISTS premreq_admin_upd                       ON public.premium_requests;
DROP POLICY IF EXISTS premreq_insert                          ON public.premium_requests;
DROP POLICY IF EXISTS premreq_select                          ON public.premium_requests;
DROP POLICY IF EXISTS own_insert                              ON public.premium_requests;
DROP POLICY IF EXISTS own_read                                ON public.premium_requests;
DROP POLICY IF EXISTS "Users can create own premium requests" ON public.premium_requests;
DROP POLICY IF EXISTS "Users can view own premium requests"   ON public.premium_requests;

CREATE POLICY premium_requests_select ON public.premium_requests
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR is_admin());

CREATE POLICY premium_requests_insert ON public.premium_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'pending');

CREATE POLICY premium_requests_update ON public.premium_requests
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY premium_requests_delete ON public.premium_requests
  FOR DELETE TO authenticated
  USING (is_admin());
