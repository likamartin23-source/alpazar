-- Siguri: verify_admin_pin s'thirret më direkt via PostgREST (brute-force i PIN-it).
-- Verifikimi kalon te Edge Function admin-action (verify_pin) me throttle në DB.
revoke execute on function public.verify_admin_pin(text) from anon, authenticated, public;
