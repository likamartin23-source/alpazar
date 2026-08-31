-- Siguri HIGH-1 (26 gusht 2026): hiq PII/privilegj nga leximi ANON i profiles.
-- Nga auditi adversarial: anon lexonte ende `phone` (scraping masiv me anon-key publik),
-- `is_admin` (identifikonte adminin → sulme të synuara), `is_suspended`.
-- APLIKOHET VETËM PAS deploy-it të kodit që heq `phone`/`is_admin` nga select-et anon
-- (app/api/email requireAdmin → service role; app/listing SSR+klient → pa phone për anon;
--  telefoni i shitësit merret vetëm nga klienti kur përdoruesi është i loguar).
revoke select (phone, is_admin, is_suspended) on public.profiles from anon;
