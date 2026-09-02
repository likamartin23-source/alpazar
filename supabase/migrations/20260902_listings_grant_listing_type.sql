-- RREGULLIM KRITIK (2 shtator 2026): "permission denied for table listings" në krijim shpalljeje.
-- Shkaku (matur live): modeli i granteve kolonë-për-kolonë (§1.5) i jep `authenticated` INSERT/UPDATE
-- mbi 37 kolona, POR `listing_type` (Produkt/Shërbim — zgjedhje përdoruesi) NUK ishte përfshirë.
-- Forma e krijimit (app/listing/new/page.tsx) e fut `listing_type` → PostgreSQL kthen
-- "permission denied for table listings" (raporton nivel-tabele edhe për mungesë grant-i kolone).
-- `listing_type` është i sigurt (jo kolonë privilegji si is_boost_active/moderation_status).
-- I aplikuar LIVE me apply_migration; ky skedar është gjurma në repo (§0-bis).
-- Provuar live (rollback): INSERT me listing_type='sherbim' si `authenticated` → U LEJUA.
grant insert (listing_type) on public.listings to authenticated;
grant update (listing_type) on public.listings to authenticated;
