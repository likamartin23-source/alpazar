-- Security hardening — Supabase advisor remediation (2026-06-28)
-- Findings: anon_/authenticated_security_definer_function_executable (90),
--           function_search_path_mutable (3)
--
-- Verified before applying: the app invokes only TWO functions via PostgREST rpc
--   - increment_listing_views(uuid,uuid,text)  (app/listing/[id]/ListingPageClient.tsx)
--   - get_unread_count(uuid)                   (hooks/useRealtimeMessages.ts)
-- All other public functions are trigger functions (no EXECUTE needed) or are
-- invoked server-side via service_role direct table ops (e.g. /api/expire-premium
-- updates profiles directly, never calling expire_premium()). Revoking is therefore
-- non-breaking and closes the anon privilege-escalation surface (gift_premium,
-- approve_premium_request, approve_verification, etc.).

-- 1. Revoke EXECUTE on the entire public function surface from public roles.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT format('public.%I(%s)', p.proname,
                  pg_get_function_identity_arguments(p.oid)) AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  LOOP
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig || ' FROM PUBLIC, anon, authenticated';
  END LOOP;
END $$;

-- 2. Re-grant ONLY the two functions the client calls via rpc.
GRANT EXECUTE ON FUNCTION public.increment_listing_views(p_listing_id uuid, p_viewer_id uuid, p_ip_hash text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_count(p_user_id uuid) TO authenticated;

-- 2b. is_admin() is referenced inside RLS policies (notifications, premium_requests, …).
--     RLS expressions run with the querying role's privileges, so anon/authenticated
--     MUST keep EXECUTE or those tables deny all access. Safe: SECURITY DEFINER helper
--     that only returns whether the caller is admin (no escalation).
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 3. Pin mutable search_path on the flagged functions.
ALTER FUNCTION public.set_businesses_updated_at()          SET search_path = public, pg_temp;
ALTER FUNCTION public.update_premium_requests_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_price_alert_check()               SET search_path = public, pg_temp;
