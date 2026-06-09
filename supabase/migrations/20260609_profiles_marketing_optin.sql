-- FAZA L: Marketing opt-in (GDPR Art.7 — consent must be freely given)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.marketing_opt_in IS
  'GDPR Art.7 — Konsensusi i dhënë lirshëm për komunikim marketingu. FALSE = default (nuk ka konsensus).';
