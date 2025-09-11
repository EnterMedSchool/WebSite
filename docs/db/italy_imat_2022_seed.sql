-- Italy IMAT 2022 real data seed
-- Usage: psql <conn args> -f docs/db/italy_imat_2022_seed.sql

BEGIN;

-- Ensure country exists
INSERT INTO countries (name, iso_a3, center_lat, center_lng)
VALUES ('Italy', 'ITA', 41.8719, 12.5674)
ON CONFLICT (name) DO NOTHING;

-- Input data (name, city, lat, lng, kind, language, exam, program, EU seats, EU last, NonEU seats, NonEU last)
CREATE TEMP TABLE tmp_imat2022 (
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

INSERT INTO tmp_imat2022 (name, city, lat, lng, kind, language, exam, program, eu_seats, eu_last, noneu_seats, noneu_last)
VALUES
  ('La Sapienza', 'Rome', 41.9028, 12.4964, 'public', 'English', 'IMAT', 'Medicine and Surgery', 38, 42.8, 10, 52.6),
  ('Milano Statale', 'Milan', 45.4642, 9.1900, 'public', 'English', 'IMAT', 'Medicine and Surgery', 45, 44.3, 25, 51.8),
  ('Pavia', 'Pavia', 45.1847, 9.1582, 'public', 'English', 'IMAT', 'Medicine and Surgery', 103, 36.7, 40, 43.8),
  ('Bologna', 'Bologna', 44.4949, 11.3426, 'public', 'English', 'IMAT', 'Medicine and Surgery', 70, 41.5, 20, 51.5),
  ('Padova', 'Padua', 45.4064, 11.8768, 'public', 'English', 'IMAT', 'Medicine and Surgery', 51, 37.9, 25, 50.7),
  ('Tor Vergata', 'Rome', 41.8529, 12.6002, 'public', 'English', 'IMAT', 'Medicine and Surgery', 25, 39.2, 10, 44.6),
  ('Turin', 'Turin', 45.0703, 7.6869, 'public', 'English', 'IMAT', 'Medicine and Surgery', 70, 37.3, 32, 50.1),
  ('Bicocca', 'Milan', 45.5196, 9.2139, 'public', 'English', 'IMAT', 'Medicine and Surgery', 26, 41.0, 16, 49.2),
  ('Federico II', 'Naples', 40.8429, 14.2494, 'public', 'English', 'IMAT', 'Medicine and Surgery', 15, 37.0, 25, 44.4),
  ('Parma', 'Parma', 44.8015, 10.3279, 'public', 'English', 'IMAT', 'Medicine and Surgery', 60, 34.1, 40, 41.9),
  ('Messina', 'Messina', 38.1938, 15.5540, 'public', 'English', 'IMAT', 'Medicine and Surgery', 41, 33.1, 42, 42.9),
  ('Luigi Vanvitelli', 'Caserta', 41.0821, 14.3340, 'public', 'English', 'IMAT', 'Medicine and Surgery', 50, 34.2, 40, 41.9),
  ('Bari', 'Bari', 41.1171, 16.8719, 'public', 'English', 'IMAT', 'Medicine and Surgery', 42, 34.1, 11, 42.6),
  ('Marche (Ancona)', 'Ancona', 43.6158, 13.5189, 'public', 'English', 'IMAT', 'Medicine and Surgery', 35, 32.8, 25, 34.5),
  ('Siena – Dentistry', 'Siena', 43.3188, 11.3308, 'public', 'English', 'IMAT', 'Dentistry', 28, 32.8, 15, 44.9),
  ('La Sapienza – Dentistry', 'Rome', 41.9028, 12.4964, 'public', 'English', 'IMAT', 'Dentistry', 19, 32.6, 6, 46.3);

-- Upsert universities (match by country + name); do not touch seed_tag here
UPDATE universities u
SET city = t.city,
    lat = t.lat,
    lng = t.lng,
    kind = t.kind,
    language = t.language,
    admission_exam = t.exam
FROM tmp_imat2022 t
JOIN countries c ON c.name = 'Italy'
WHERE u.country_id = c.id AND u.name = t.name;

INSERT INTO universities (country_id, city, name, lat, lng, kind, language, admission_exam)
SELECT c.id AS country_id, t.city, t.name, t.lat, t.lng, t.kind, t.language, t.exam
FROM tmp_imat2022 t
JOIN countries c ON c.name = 'Italy'
LEFT JOIN universities u ON u.country_id = c.id AND u.name = t.name
WHERE u.id IS NULL;

-- Map names to IDs
CREATE TEMP TABLE tmp_imat2022_ids AS
SELECT u.id, u.name, t.program, t.eu_seats, t.eu_last, t.noneu_seats, t.noneu_last
FROM universities u
JOIN countries c ON u.country_id = c.id AND c.name = 'Italy'
JOIN tmp_imat2022 t ON t.name = u.name;

-- Ensure a program row exists per university (Medicine and Surgery OR Dentistry)
INSERT INTO university_programs (university_id, name, language, admission_exam, currency, active)
SELECT i.id, i.program, 'English', 'IMAT', 'EUR', TRUE
FROM tmp_imat2022_ids i
LEFT JOIN university_programs p ON p.university_id = i.id AND p.name = i.program
WHERE p.id IS NULL;

-- 2022 scores and seats (avoid duplicates).
-- Scores: EU
INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT i.id, 2022, 'EU', i.eu_last
FROM tmp_imat2022_ids i
LEFT JOIN university_scores s ON s.university_id = i.id AND s.year = 2022 AND s.candidate_type = 'EU'
WHERE s.id IS NULL;

-- Scores: NonEU
INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT i.id, 2022, 'NonEU', i.noneu_last
FROM tmp_imat2022_ids i
LEFT JOIN university_scores s ON s.university_id = i.id AND s.year = 2022 AND s.candidate_type = 'NonEU'
WHERE s.id IS NULL;

-- Seats: EU
INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT i.id, 2022, 'EU', i.eu_seats
FROM tmp_imat2022_ids i
LEFT JOIN university_seats s ON s.university_id = i.id AND s.year = 2022 AND s.candidate_type = 'EU'
WHERE s.id IS NULL;

-- Seats: NonEU
INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT i.id, 2022, 'NonEU', i.noneu_seats
FROM tmp_imat2022_ids i
LEFT JOIN university_seats s ON s.university_id = i.id AND s.year = 2022 AND s.candidate_type = 'NonEU'
WHERE s.id IS NULL;

COMMIT;

