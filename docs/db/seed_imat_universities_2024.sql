-- Seed real Italian IMAT universities with 2024 seats and last-round scores
-- Safe to run multiple times: inserts only if missing per row

BEGIN;

-- Ensure country exists
INSERT INTO countries (name, iso_a3, center_lat, center_lng)
VALUES ('Italy', 'ITA', 41.87194, 12.56738)
ON CONFLICT (name) DO UPDATE SET iso_a3 = EXCLUDED.iso_a3;

-- Helper: country id subquery used below
-- (SELECT id FROM countries WHERE name='Italy')

-- ============ Universities ============
-- Minimal fields required by schema: country_id, city, name, lat, lng
-- Optional metadata: kind, language, admission_exam

-- La Sapienza (Rome)
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Rome', 'La Sapienza (Rome)', 41.902782, 12.496366, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='La Sapienza (Rome)' AND u.city='Rome' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Milano Statale (Milan)
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Milan', 'Milano Statale (Milan)', 45.464203, 9.189982, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Milano Statale (Milan)' AND u.city='Milan' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Pavia
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Pavia', 'Pavia', 45.185961, 9.158217, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Pavia' AND u.city='Pavia' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Bologna
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Bologna', 'Bologna', 44.494889, 11.342616, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Bologna' AND u.city='Bologna' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Padova
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Padova', 'Padova', 45.406434, 11.876761, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Padova' AND u.city='Padova' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Tor Vergata (Rome)
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Rome', 'Tor Vergata (Rome)', 41.852260, 12.601620, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Tor Vergata (Rome)' AND u.city='Rome' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Turin (Torino)
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Turin', 'Turin (Torino)', 45.070312, 7.686856, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Turin (Torino)' AND u.city='Turin' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Bicocca (Milan)
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Milan', 'Bicocca (Milan)', 45.506390, 9.213000, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Bicocca (Milan)' AND u.city='Milan' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Federico II (Naples)
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Naples', 'Federico II (Naples)', 40.851775, 14.268124, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Federico II (Naples)' AND u.city='Naples' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Parma
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Parma', 'Parma', 44.801485, 10.327903, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Parma' AND u.city='Parma' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Messina
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Messina', 'Messina', 38.193817, 15.554015, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Messina' AND u.city='Messina' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Luigi Vanvitelli (Campania) — use Caserta as city
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Caserta', 'Luigi Vanvitelli (Campania)', 41.082081, 14.334292, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Luigi Vanvitelli (Campania)' AND u.city='Caserta' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Bari
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Bari', 'Bari', 41.117143, 16.871871, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Bari' AND u.city='Bari' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Catania
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Catania', 'Catania', 37.507879, 15.083030, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Catania' AND u.city='Catania' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Marche (Ancona)
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Ancona', 'Marche (Ancona)', 43.615829, 13.518915, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Marche (Ancona)' AND u.city='Ancona' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Cagliari
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Cagliari', 'Cagliari', 39.223841, 9.121661, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Cagliari' AND u.city='Cagliari' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- Siena – Dentistry
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Siena', 'Siena – Dentistry', 43.318809, 11.330757, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='Siena – Dentistry' AND u.city='Siena' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

-- La Sapienza – Dentistry (Rome)
INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT (SELECT id FROM countries WHERE name='Italy'), 'Rome', 'La Sapienza – Dentistry', 41.902782, 12.496366, 'public', 'English', 'IMAT'
WHERE NOT EXISTS (
  SELECT 1 FROM universities u WHERE u.name='La Sapienza – Dentistry' AND u.city='Rome' AND u.country_id=(SELECT id FROM countries WHERE name='Italy')
);

