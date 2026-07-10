-- Shton kolonën trust_score_visible për kundërshtim profilizimit (Ligj 124/2024 n.5/19 & n.19)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trust_score_visible BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN profiles.trust_score_visible IS
  'GDPR/124-2024 n.19 — e drejta për të kundërshtuar profilizimin. FALSE = Trust Score i fshehur nga profili publik.';
