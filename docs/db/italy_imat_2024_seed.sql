-- Italy IMAT 2024 real data seed
-- Usage: psql <conn args> -f docs/db/italy_imat_2024_seed.sql

BEGIN;

-- Ensure country exists
INSERT INTO countries (name, iso_a3, center_lat, center_lng)
VALUES ('Italy', 'ITA', 41.8719, 12.5674)
ON CONFLICT (name) DO NOTHING;

-- Input data (name, city, lat, lng, kind, language, exam, program, EU seats, EU last, NonEU seats, NonEU last)
CREATE TEMP TABLE tmp_imat2024 (
  name text,
  city text,
  lat double precision,
  lng double precision,
  kind text,
  language text,
  exam text,
  program text,
  eu_seats int,
  eu_last double precision,
  noneu_seats int,
  noneu_last double precision
) ON COMMIT DROP;

INSERT INTO tmp_imat2024 (name, city, lat, lng, kind, language, exam, program, eu_seats, eu_last, noneu_seats, noneu_last)
VALUES
  ('La Sapienza', 'Rome', 41.9028, 12.4964, 'public', 'English', 'IMAT', 'Medicine and Surgery', 45, 65.1, 13, 65.5),
  ('Milano Statale', 'Milan', 45.4642, 9.1900, 'public', 'English', 'IMAT', 'Medicine and Surgery', 55, 67.8, 15, 69.2),
  ('Pavia', 'Pavia', 45.1847, 9.1582, 'public', 'English', 'IMAT', 'Medicine and Surgery', 103, 59.1, 40, 59.1),
  ('Bologna', 'Bologna', 44.4949, 11.3426, 'public', 'English', 'IMAT', 'Medicine and Surgery', 97, 64.8, 20, 65.6),
  ('Padova', 'Padua', 45.4064, 11.8768, 'public', 'English', 'IMAT', 'Medicine and Surgery', 75, 63.2, 25, 64.6),
  ('Tor Vergata', 'Rome', 41.8529, 12.6002, 'public', 'English', 'IMAT', 'Medicine and Surgery', 40, 59.5, 15, 59.5),
  ('Turin', 'Turin', 45.0703, 7.6869, 'public', 'English', 'IMAT', 'Medicine and Surgery', 70, 59.5, 32, 59.5),
  ('Bicocca', 'Milan', 45.5196, 9.2139, 'public', 'English', 'IMAT', 'Medicine and Surgery', 30, 64.8, 18, 66.7),
  ('Federico II', 'Naples', 40.8429, 14.2494, 'public', 'English', 'IMAT', 'Medicine and Surgery', 15, 61.4, 25, 64.0),
  ('Parma', 'Parma', 44.8015, 10.3279, 'public', 'English', 'IMAT', 'Medicine and Surgery', 75, 57.8, 45, 57.6),
  ('Messina', 'Messina', 38.1938, 15.5540, 'public', 'English', 'IMAT', 'Medicine and Surgery', 55, 55.1, 56, 55.2),
  ('Luigi Vanvitelli', 'Caserta', 41.0821, 14.3340, 'public', 'English', 'IMAT', 'Medicine and Surgery', 60, 57.8, 50, 57.3),
  ('Bari', 'Bari', 41.1171, 16.8719, 'public', 'English', 'IMAT', 'Medicine and Surgery', 69, 56.0, 11, 56.0),
  ('Catania', 'Catania', 37.5079, 15.0830, 'public', 'English', 'IMAT', 'Medicine and Surgery', 30, 55.3, 30, 55.3),
  ('Marche (Ancona)', 'Ancona', 43.6158, 13.5189, 'public', 'English', 'IMAT', 'Medicine and Surgery', 20, 56.5, 60, 56.5),
  ('Cagliari', 'Cagliari', 39.2238, 9.1217, 'public', 'English', 'IMAT', 'Medicine and Surgery', 80, 55.0, 20, 55.0),
  ('Siena – Dentistry', 'Siena', 43.3188, 11.3308, 'public', 'English', 'IMAT', 'Dentistry', 23, 56.0, 12, 56.0),
  ('La Sapienza – Dentistry', 'Rome', 41.9028, 12.4964, 'public', 'English', 'IMAT', 'Dentistry', 19, 61.8, 6, 62.1);

-- Mark this seed for traceability
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'text') THEN NULL; END IF; END $$;
-- Upsert universities (match by country + name)
UPDATE universities u
SET city = t.city,
    lat = t.lat,
    lng = t.lng,
    kind = t.kind,
    language = t.language,
    admission_exam = t.exam,
    seed_tag = 'ITALY_IMAT_2024'
FROM tmp_imat2024 t
JOIN countries c ON c.name = 'Italy'
WHERE u.country_id = c.id AND u.name = t.name;

INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam, seed_tag)
SELECT c.id AS country_id, t.city, t.name, t.lat, t.lng, t.kind, t.language, t.exam, 'ITALY_IMAT_2024'
FROM tmp_imat2024 t
JOIN countries c ON c.name = 'Italy'
LEFT JOIN universities u ON u.country_id = c.id AND u.name = t.name
WHERE u.id IS NULL;

-- Map names to IDs
CREATE TEMP TABLE tmp_imat2024_ids AS
SELECT u.id, u.name, t.program, t.eu_seats, t.eu_last, t.noneu_seats, t.noneu_last
FROM universities u
JOIN countries c ON u.country_id = c.id AND c.name = 'Italy'
JOIN tmp_imat2024 t ON t.name = u.name;

-- Ensure a program row exists per university (Medicine and Surgery OR Dentistry)
INSERT INTO university_programs (university_id, name, language, admission_exam, currency, active)
SELECT i.id, i.program, 'English', 'IMAT', 'EUR', TRUE
FROM tmp_imat2024_ids i
LEFT JOIN university_programs p ON p.university_id = i.id AND p.name = i.program
WHERE p.id IS NULL;

-- 2024 scores and seats (avoid duplicates)
-- Scores: EU
INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT i.id, 2024, 'EU', i.eu_last
FROM tmp_imat2024_ids i
LEFT JOIN university_scores s ON s.university_id = i.id AND s.year = 2024 AND s.candidate_type = 'EU'
WHERE s.id IS NULL;

-- Scores: NonEU
INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT i.id, 2024, 'NonEU', i.noneu_last
FROM tmp_imat2024_ids i
LEFT JOIN university_scores s ON s.university_id = i.id AND s.year = 2024 AND s.candidate_type = 'NonEU'
WHERE s.id IS NULL;

-- Seats: EU
INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT i.id, 2024, 'EU', i.eu_seats
FROM tmp_imat2024_ids i
LEFT JOIN university_seats s ON s.university_id = i.id AND s.year = 2024 AND s.candidate_type = 'EU'
WHERE s.id IS NULL;

-- Seats: NonEU
INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT i.id, 2024, 'NonEU', i.noneu_seats
FROM tmp_imat2024_ids i
LEFT JOIN university_seats s ON s.university_id = i.id AND s.year = 2024 AND s.candidate_type = 'NonEU'
WHERE s.id IS NULL;

COMMIT;
