-- ALPAZAR — Seed Data
-- Ekzekuto në: Supabase Dashboard → SQL Editor → Run
--
-- Verifiko strukturën para ekzekutimit:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'categories';

-- ─── KATEGORI SHQIPTARE ────────────────────────────────────────
INSERT INTO categories (name, slug, icon, parent_id) VALUES
  ('Elektronikë',          'elektronike',        '💻', NULL),
  ('Celularë & Tablet',    'celulare-tablet',    '📱', (SELECT id FROM categories WHERE slug = 'elektronike')),
  ('Kompjuterë',           'kompjutere',         '🖥️', (SELECT id FROM categories WHERE slug = 'elektronike')),
  ('Shtëpi & Kopsht',      'shtepi-kopsht',      '🏠', NULL),
  ('Mobilie',              'mobilie',            '🛋️', (SELECT id FROM categories WHERE slug = 'shtepi-kopsht')),
  ('Veshje & Aksesorë',    'veshje-aksesore',    '👗', NULL),
  ('Makina & Motorë',      'makina-motore',      '🚗', NULL),
  ('Punë & Shërbime',      'pune-sherbime',      '💼', NULL),
  ('Pasuri e Paluajtshme', 'pasuri-paluajtshme', '🏘️', NULL),
  ('Kafshë',               'kafshë',             '🐾', NULL),
  ('Sport & Hobi',         'sport-hobi',         '⚽', NULL),
  ('Fëmijë & Lodra',       'femije-lodra',       '🧸', NULL),
  ('Bukuri & Shëndet',     'bukuri-shendet',     '💄', NULL)
ON CONFLICT (slug) DO NOTHING;

-- ─── QYTETE SHQIPTARE ──────────────────────────────────────────
INSERT INTO cities (name, slug, region) VALUES
  ('Tiranë',      'tirane',      'Tiranë'),
  ('Durrës',      'durres',      'Durrës'),
  ('Vlorë',       'vlore',       'Vlorë'),
  ('Shkodër',     'shkoder',     'Shkodër'),
  ('Elbasan',     'elbasan',     'Elbasan'),
  ('Fier',        'fier',        'Fier'),
  ('Korçë',       'korce',       'Korçë'),
  ('Berat',       'berat',       'Berat'),
  ('Lushnjë',     'lushnje',     'Fier'),
  ('Sarandë',     'sarande',     'Vlorë'),
  ('Gjirokastër', 'gjirokaster', 'Gjirokastër'),
  ('Lezhë',       'lezhe',       'Lezhë'),
  ('Krujë',       'kruje',       'Durrës'),
  ('Kavajë',      'kavaje',      'Tiranë'),
  ('Pogradec',    'pogradec',    'Korçë'),
  ('Kukës',       'kukes',       'Kukës'),
  ('Peshkopi',    'peshkopi',    'Dibër'),
  ('Tepelenë',    'tepelene',    'Gjirokastër'),
  ('Përmet',      'permet',      'Gjirokastër'),
  ('Ersekë',      'erseke',      'Korçë')
ON CONFLICT (slug) DO NOTHING;

-- ─── VERIFIKO ──────────────────────────────────────────────────
-- SELECT COUNT(*) AS kategori FROM categories;
-- SELECT COUNT(*) AS qytete  FROM cities;
