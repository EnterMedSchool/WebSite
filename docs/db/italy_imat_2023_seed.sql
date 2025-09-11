-- Italy IMAT 2023 real data seed
-- Usage: psql <conn args> -f docs/db/italy_imat_2023_seed.sql

BEGIN;

-- Ensure country exists
INSERT INTO countries (name, iso_a3, center_lat, center_lng)
VALUES ('Italy', 'ITA', 41.8719, 12.5674)
ON CONFLICT (name) DO NOTHING;

-- Input data (name, city, lat, lng, kind, language, exam, program, EU seats, EU last, NonEU seats, NonEU last)
CREATE TEMP TABLE tmp_imat2023 (
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

INSERT INTO tmp_imat2023 (name, city, lat, lng, kind, language, exam, program, eu_seats, eu_last, noneu_seats, noneu_last)
VALUES
  ('La Sapienza', 'Rome', 41.9028, 12.4964, 'public', 'English', 'IMAT', 'Medicine and Surgery', 45, 45.4, 13, 50.8),
  ('Milano Statale', 'Milan', 45.4642, 9.1900, 'public', 'English', 'IMAT', 'Medicine and Surgery', 55, 46.6, 25, 60.2),
  ('Pavia', 'Pavia', 45.1847, 9.1582, 'public', 'English', 'IMAT', 'Medicine and Surgery', 103, 38.4, 40, 53.3),
  ('Bologna', 'Bologna', 44.4949, 11.3426, 'public', 'English', 'IMAT', 'Medicine and Surgery', 97, 42.6, 20, 59.1),
  ('Padova', 'Padua', 45.4064, 11.8768, 'public', 'English', 'IMAT', 'Medicine and Surgery', 80, 38.7, 20, 49.5),
  ('Tor Vergata', 'Rome', 41.8529, 12.6002, 'public', 'English', 'IMAT', 'Medicine and Surgery', 40, 38.5, 15, 53.4),
  ('Turin', 'Turin', 45.0703, 7.6869, 'public', 'English', 'IMAT', 'Medicine and Surgery', 70, 37.4, 32, 49.0),
  ('Bicocca', 'Milan', 45.5196, 9.2139, 'public', 'English', 'IMAT', 'Medicine and Surgery', 30, 43.3, 18, 54.2),
  ('Federico II', 'Naples', 40.8429, 14.2494, 'public', 'English', 'IMAT', 'Medicine and Surgery', 15, 45.2, 25, 52.0),
  ('Parma', 'Parma', 44.8015, 10.3279, 'public', 'English', 'IMAT', 'Medicine and Surgery', 75, 35.3, 45, 50.1),
  ('Messina', 'Messina', 38.1938, 15.5540, 'public', 'English', 'IMAT', 'Medicine and Surgery', 55, 32.8, 56, 36.9),
  ('Luigi Vanvitelli', 'Caserta', 41.0821, 14.3340, 'public', 'English', 'IMAT', 'Medicine and Surgery', 60, 35.0, 50, 47.3),
  ('Bari', 'Bari', 41.1171, 16.8719, 'public', 'English', 'IMAT', 'Medicine and Surgery', 69, 34.1, 11, 31.2),
  ('Catania', 'Catania', 37.5079, 15.0830, 'public', 'English', 'IMAT', 'Medicine and Surgery', 60, 32.4, NULL, NULL),
  ('Marche (Ancona)', 'Ancona', 43.6158, 13.5189, 'public', 'English', 'IMAT', 'Medicine and Surgery', 25, 35.3, 55, 43.0),
  ('Siena – Dentistry', 'Siena', 43.3188, 11.3308, 'public', 'English', 'IMAT', 'Dentistry', 25, 33.2, 12, 51.3),
  ('La Sapienza – Dentistry', 'Rome', 41.9028, 12.4964, 'public', 'English', 'IMAT', 'Dentistry', 19, 38.7, 6, 59.1);

-- Upsert universities (match by country + name); do not touch seed_tag here
UPDATE universities u
SET city = t.city,
    lat = t.lat,
    lng = t.lng,
    kind = t.kind,
    language = t.language,
    admission_exam = t.exam
FROM tmp_imat2023 t
JOIN countries c ON c.name = 'Italy'
WHERE u.country_id = c.id AND u.name = t.name;

INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT c.id AS country_id, t.city, t.name, t.lat, t.lng, t.kind, t.language, t.exam
FROM tmp_imat2023 t
JOIN countries c ON c.name = 'Italy'
LEFT JOIN universities u ON u.country_id = c.id AND u.name = t.name
WHERE u.id IS NULL;

-- Map names to IDs
CREATE TEMP TABLE tmp_imat2023_ids AS
SELECT u.id, u.name, t.program, t.eu_seats, t.eu_last, t.noneu_seats, t.noneu_last
FROM universities u
JOIN countries c ON u.country_id = c.id AND c.name = 'Italy'
JOIN tmp_imat2023 t ON t.name = u.name;

-- Ensure a program row exists per university (Medicine and Surgery OR Dentistry)
INSERT INTO university_programs (university_id, name, language, admission_exam, currency, active)
SELECT i.id, i.program, 'English', 'IMAT', 'EUR', TRUE
FROM tmp_imat2023_ids i
LEFT JOIN university_programs p ON p.university_id = i.id AND p.name = i.program
WHERE p.id IS NULL;

-- 2023 scores and seats (avoid duplicates). Handle NULL NonEU by skipping rows.
-- Scores: EU
INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT i.id, 2023, 'EU', i.eu_last
FROM tmp_imat2023_ids i
LEFT JOIN university_scores s ON s.university_id = i.id AND s.year = 2023 AND s.candidate_type = 'EU'
WHERE s.id IS NULL;

-- Scores: NonEU (only if provided)
INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT i.id, 2023, 'NonEU', i.noneu_last
FROM tmp_imat2023_ids i
LEFT JOIN university_scores s ON s.university_id = i.id AND s.year = 2023 AND s.candidate_type = 'NonEU'
WHERE s.id IS NULL AND i.noneu_last IS NOT NULL;

-- Seats: EU
INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT i.id, 2023, 'EU', i.eu_seats
FROM tmp_imat2023_ids i
LEFT JOIN university_seats s ON s.university_id = i.id AND s.year = 2023 AND s.candidate_type = 'EU'
WHERE s.id IS NULL;

-- Seats: NonEU (only if provided)
INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT i.id, 2023, 'NonEU', i.noneu_seats
FROM tmp_imat2023_ids i
LEFT JOIN university_seats s ON s.university_id = i.id AND s.year = 2023 AND s.candidate_type = 'NonEU'
WHERE s.id IS NULL AND i.noneu_seats IS NOT NULL;

COMMIT;

