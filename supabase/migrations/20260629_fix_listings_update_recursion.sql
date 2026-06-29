-- BUG: listings_update WITH CHECK referenced (SELECT is_premium FROM listings ...)
-- which re-evaluates the listings policy → "42P17: infinite recursion detected".
-- Every owner UPDATE (delete via is_active=false, bump, edit) failed for non-admins,
-- so the delete/edit/refresh buttons appeared dead. Replace with a non-recursive
-- policy and enforce the is_premium anti-tamper rule via a BEFORE UPDATE trigger.

DROP POLICY IF EXISTS listings_update ON public.listings;
CREATE POLICY listings_update ON public.listings
  FOR UPDATE TO public
  USING (((SELECT auth.uid()) = user_id) OR is_admin())
  WITH CHECK (((SELECT auth.uid()) = user_id) OR is_admin());

CREATE OR REPLACE FUNCTION public.guard_listing_is_premium()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT is_admin() AND NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    NEW.is_premium := OLD.is_premium;
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.guard_listing_is_premium() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_listing_is_premium ON public.listings;
CREATE TRIGGER trg_guard_listing_is_premium
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.guard_listing_is_premium();
