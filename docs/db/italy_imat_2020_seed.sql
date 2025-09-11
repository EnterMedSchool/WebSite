-- Italy IMAT 2020 real data seed
-- Usage: psql <conn args> -f docs/db/italy_imat_2020_seed.sql

BEGIN;

-- Ensure country exists
INSERT INTO countries (name, iso_a3, center_lat, center_lng)
VALUES ('Italy', 'ITA', 41.8719, 12.5674)
ON CONFLICT (name) DO NOTHING;

-- Input data (name, city, lat, lng, kind, language, exam, program, EU seats, EU last, NonEU seats, NonEU last)
CREATE TEMP TABLE tmp_imat2020 (
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

INSERT INTO tmp_imat2020 (name, city, lat, lng, kind, language, exam, program, eu_seats, eu_last, noneu_seats, noneu_last)
VALUES
  ('La Sapienza', 'Rome', 41.9028, 12.4964, 'public', 'English', 'IMAT', 'Medicine and Surgery', 38, 40.4, 10, 53.1),
  ('Milano Statale', 'Milan', 45.4642, 9.1900, 'public', 'English', 'IMAT', 'Medicine and Surgery', 45, 43.3, 25, 51.5),
  ('Pavia', 'Pavia', 45.1847, 9.1582, 'public', 'English', 'IMAT', 'Medicine and Surgery', 103, 35.5, 40, 49.4),
  ('Bologna', 'Bologna', 44.4949, 11.3426, 'public', 'English', 'IMAT', 'Medicine and Surgery', 70, 42.6, 20, 48.9),
  ('Padova', 'Padua', 45.4064, 11.8768, 'public', 'English', 'IMAT', 'Medicine and Surgery', 56, 37.5, 20, 46.6),
  ('Tor Vergata', 'Rome', 41.8529, 12.6002, 'public', 'English', 'IMAT', 'Medicine and Surgery', 25, 37.7, 10, 47.7),
  ('Turin', 'Turin', 45.0703, 7.6869, 'public', 'English', 'IMAT', 'Medicine and Surgery', 70, 35.5, 32, 44.0),
  ('Bicocca', 'Milan', 45.5196, 9.2139, 'public', 'English', 'IMAT', 'Medicine and Surgery', NULL, NULL, 13, 42.3),
  ('Federico II', 'Naples', 40.8429, 14.2494, 'public', 'English', 'IMAT', 'Medicine and Surgery', 15, 34.4, 25, 41.4),
  ('Parma', 'Parma', 44.8015, 10.3279, 'public', 'English', 'IMAT', 'Medicine and Surgery', 60, 35.0, 40, 35.5),
  ('Messina', 'Messina', 38.1938, 15.5540, 'public', 'English', 'IMAT', 'Medicine and Surgery', 38, 33.0, 38, 34.6),
  ('Luigi Vanvitelli', 'Caserta', 41.0821, 14.3340, 'public', 'English', 'IMAT', 'Medicine and Surgery', 40, 33.3, 40, 33.1),
  ('Bari', 'Bari', 41.1171, 16.8719, 'public', 'English', 'IMAT', 'Medicine and Surgery', 43, 33.9, 8, 32.7),
  ('Siena – Dentistry', 'Siena', 43.3188, 11.3308, 'public', 'English', 'IMAT', 'Dentistry', 28, 33.8, 15, 35.4);

-- Upsert universities (match by country + name); do not touch seed_tag here
UPDATE universities u
SET city = t.city,
    lat = t.lat,
    lng = t.lng,
    kind = t.kind,
    language = t.language,
    admission_exam = t.exam
FROM tmp_imat2020 t
JOIN countries c ON c.name = 'Italy'
WHERE u.country_id = c.id AND u.name = t.name;

INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT c.id AS country_id, t.city, t.name, t.lat, t.lng, t.kind, t.language, t.exam
FROM tmp_imat2020 t
JOIN countries c ON c.name = 'Italy'
LEFT JOIN universities u ON u.country_id = c.id AND u.name = t.name
WHERE u.id IS NULL;

-- Map names to IDs
CREATE TEMP TABLE tmp_imat2020_ids AS
SELECT u.id, u.name, t.program, t.eu_seats, t.eu_last, t.noneu_seats, t.noneu_last
FROM universities u
JOIN countries c ON u.country_id = c.id AND c.name = 'Italy'
JOIN tmp_imat2020 t ON t.name = u.name;

-- Ensure a program row exists per university (Medicine and Surgery OR Dentistry)
INSERT INTO university_programs (university_id, name, language, admission_exam, currency, active)
SELECT i.id, i.program, 'English', 'IMAT', 'EUR', TRUE
FROM tmp_imat2020_ids i
LEFT JOIN university_programs p ON p.university_id = i.id AND p.name = i.program
WHERE p.id IS NULL;

-- 2020 scores and seats (avoid duplicates). Skip EU rows with NULLs (e.g., Bicocca)
-- Scores: EU (only if provided)
INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT i.id, 2020, 'EU', i.eu_last
FROM tmp_imat2020_ids i
LEFT JOIN university_scores s ON s.university_id = i.id AND s.year = 2020 AND s.candidate_type = 'EU'
WHERE s.id IS NULL AND i.eu_last IS NOT NULL;

-- Scores: NonEU
INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT i.id, 2020, 'NonEU', i.noneu_last
FROM tmp_imat2020_ids i
LEFT JOIN university_scores s ON s.university_id = i.id AND s.year = 2020 AND s.candidate_type = 'NonEU'
WHERE s.id IS NULL;

-- Seats: EU (only if provided)
INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT i.id, 2020, 'EU', i.eu_seats
FROM tmp_imat2020_ids i
LEFT JOIN university_seats s ON s.university_id = i.id AND s.year = 2020 AND s.candidate_type = 'EU'
WHERE s.id IS NULL AND i.eu_seats IS NOT NULL;

-- Seats: NonEU
INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT i.id, 2020, 'NonEU', i.noneu_seats
FROM tmp_imat2020_ids i
LEFT JOIN university_seats s ON s.university_id = i.id AND s.year = 2020 AND s.candidate_type = 'NonEU'
WHERE s.id IS NULL;

COMMIT;

