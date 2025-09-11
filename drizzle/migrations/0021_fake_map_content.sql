-- Bulk fake content for the homepage map and university details
-- Generates ~1,000 universities across 10 countries with programs, costs, admissions, and scores

BEGIN;

-- Seed tag for easy cleanup
-- Update this if you re-run a similar seed to allow separate cleanup
DO $$
BEGIN
  -- no-op placeholder to keep BEGIN/COMMIT symmetric in drizzle
  NULL;
END;
$$; 

-- Temp table to capture inserted university IDs for this run
CREATE TEMP TABLE IF NOT EXISTS tmp_seed_unis (id int) ON COMMIT DROP;

-- Ensure countries exist
INSERT INTO countries (name) VALUES
  ('Italy'),
  ('United Kingdom'),
  ('Germany'),
  ('Austria'),
  ('Spain'),
  ('France'),
  ('Netherlands'),
  ('Sweden'),
  ('Poland'),
  ('Greece')
ON CONFLICT (name) DO NOTHING;

-- Insert universities (tagged) and capture IDs via data-modifying CTE
WITH bb(country, min_lat, max_lat, min_lng, max_lng) AS (
  VALUES
    ('Italy', 36.0, 46.8, 6.6, 18.5),
    ('United Kingdom', 50.0, 58.7, -7.6, 1.8),
    ('Germany', 47.3, 55.1, 5.8, 15.0),
    ('Austria', 46.4, 49.1, 9.5, 17.2),
    ('Spain', 36.0, 43.8, -9.4, 3.3),
    ('France', 41.3, 51.1, -5.2, 9.6),
    ('Netherlands', 50.8, 53.7, 3.2, 7.2),
    ('Sweden', 55.0, 69.0, 11.1, 24.2),
    ('Poland', 49.0, 54.9, 14.1, 24.2),
    ('Greece', 35.0, 41.8, 19.4, 28.3)
),
ids AS (
  SELECT c.id AS country_id, c.name AS country, b.min_lat, b.max_lat, b.min_lng, b.max_lng
  FROM countries c
  JOIN bb b ON b.country = c.name
),
inserted AS (
  INSERT INTO universities (
    country_id, city, name, lat, lng, kind, language, admission_exam, logo_url, photos, orgs, article, has_dorms, has_scholarships, seed_tag
  )
  SELECT
    i.country_id,
    'City ' || i.country || ' ' || gs::text AS city,
    'Fake University ' || i.country || ' #' || gs::text AS name,
    (i.min_lat + random() * (i.max_lat - i.min_lat))::double precision AS lat,
    (i.min_lng + random() * (i.max_lng - i.min_lng))::double precision AS lng,
    (CASE WHEN (gs % 3)=0 THEN 'private' ELSE 'public' END) AS kind,
    (CASE WHEN (gs % 2)=0 THEN 'English' ELSE 'Italian' END) AS language,
    (CASE WHEN (gs % 4)=0 THEN 'UCAT' ELSE 'IMAT' END) AS admission_exam,
    'https://picsum.photos/seed/'|| replace(lower(i.country),' ','-') || '-' || gs::text || '/64' AS logo_url,
    jsonb_build_array('https://picsum.photos/seed/'|| replace(lower(i.country),' ','-') || '-' || gs::text || '/64') AS photos,
    jsonb_build_array('EMS '||i.country, 'Sports Club', 'Volunteering') AS orgs,
    jsonb_build_object('title', 'FAKE_MAP_BULK_2025_09_10 article') AS article,
    (CASE WHEN (gs % 5)=0 THEN TRUE ELSE FALSE END) AS has_dorms,
    (CASE WHEN (gs % 4)=0 THEN TRUE ELSE FALSE END) AS has_scholarships,
    'FAKE_MAP_BULK_2025_09_10' AS seed_tag
  FROM ids i
  CROSS JOIN generate_series(1, 100) AS gs
  RETURNING id
)
INSERT INTO tmp_seed_unis (id)
SELECT id FROM inserted;

-- One program per uni
INSERT INTO university_programs (university_id, name, language, admission_exam, currency, active)
SELECT s.id, 'Medicine and Surgery',
       (CASE WHEN (random() < 0.5) THEN 'English' ELSE 'Italian' END),
       (CASE WHEN (random() < 0.4) THEN 'UCAT' ELSE 'IMAT' END),
       'EUR', TRUE
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_programs p WHERE p.university_id = s.id
);

-- Costs per uni
INSERT INTO university_costs (university_id, rent_eur, food_index, transport_eur)
SELECT s.id,
       350 + floor(random() * 850)::int,
       60 + floor(random() * 60)::int,
       15 + floor(random() * 45)::int
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_costs c WHERE c.university_id = s.id
);

-- Admissions per uni (current year)
INSERT INTO university_admissions (university_id, year, opens_month, deadline_month, results_month)
SELECT s.id,
       EXTRACT(YEAR FROM now())::int,
       3 + (floor(random() * 6))::int,
       6 + (floor(random() * 5))::int,
       9 + (floor(random() * 4))::int
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_admissions a WHERE a.university_id = s.id AND a.year = EXTRACT(YEAR FROM now())::int
);

-- Scores per uni (EU/NonEU)
INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT s.id, EXTRACT(YEAR FROM now())::int, 'EU', 45 + (ROUND((random() * 30)::numeric, 1))::double precision
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_scores sc WHERE sc.university_id = s.id AND sc.year = EXTRACT(YEAR FROM now())::int AND sc.candidate_type = 'EU'
);

INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT s.id, EXTRACT(YEAR FROM now())::int, 'NonEU', 55 + (ROUND((random() * 35)::numeric, 1))::double precision
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_scores sc WHERE sc.university_id = s.id AND sc.year = EXTRACT(YEAR FROM now())::int AND sc.candidate_type = 'NonEU'
);

-- Seats per uni (EU/NonEU, current year)
INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT s.id, EXTRACT(YEAR FROM now())::int, 'EU', 120 + floor(random() * 220)::int
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_seats st WHERE st.university_id = s.id AND st.year = EXTRACT(YEAR FROM now())::int AND st.candidate_type = 'EU'
);

INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT s.id, EXTRACT(YEAR FROM now())::int, 'NonEU', 12 + floor(random() * 48)::int
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_seats st WHERE st.university_id = s.id AND st.year = EXTRACT(YEAR FROM now())::int AND st.candidate_type = 'NonEU'
);

-- Past results (scores) for previous 2 years
INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT s.id, EXTRACT(YEAR FROM now())::int - 1, 'EU', 45 + (ROUND((random() * 30)::numeric, 1))::double precision
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_scores sc WHERE sc.university_id = s.id AND sc.year = EXTRACT(YEAR FROM now())::int - 1 AND sc.candidate_type = 'EU'
);

INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT s.id, EXTRACT(YEAR FROM now())::int - 1, 'NonEU', 55 + (ROUND((random() * 35)::numeric, 1))::double precision
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_scores sc WHERE sc.university_id = s.id AND sc.year = EXTRACT(YEAR FROM now())::int - 1 AND sc.candidate_type = 'NonEU'
);

INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT s.id, EXTRACT(YEAR FROM now())::int - 2, 'EU', 45 + (ROUND((random() * 30)::numeric, 1))::double precision
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_scores sc WHERE sc.university_id = s.id AND sc.year = EXTRACT(YEAR FROM now())::int - 2 AND sc.candidate_type = 'EU'
);

INSERT INTO university_scores (university_id, year, candidate_type, min_score)
SELECT s.id, EXTRACT(YEAR FROM now())::int - 2, 'NonEU', 55 + (ROUND((random() * 35)::numeric, 1))::double precision
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_scores sc WHERE sc.university_id = s.id AND sc.year = EXTRACT(YEAR FROM now())::int - 2 AND sc.candidate_type = 'NonEU'
);

-- Past seats for previous 2 years
INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT s.id, EXTRACT(YEAR FROM now())::int - 1, 'EU', 120 + floor(random() * 220)::int
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_seats st WHERE st.university_id = s.id AND st.year = EXTRACT(YEAR FROM now())::int - 1 AND st.candidate_type = 'EU'
);

INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT s.id, EXTRACT(YEAR FROM now())::int - 1, 'NonEU', 12 + floor(random() * 48)::int
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_seats st WHERE st.university_id = s.id AND st.year = EXTRACT(YEAR FROM now())::int - 1 AND st.candidate_type = 'NonEU'
);

INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT s.id, EXTRACT(YEAR FROM now())::int - 2, 'EU', 120 + floor(random() * 220)::int
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_seats st WHERE st.university_id = s.id AND st.year = EXTRACT(YEAR FROM now())::int - 2 AND st.candidate_type = 'EU'
);

INSERT INTO university_seats (university_id, year, candidate_type, seats)
SELECT s.id, EXTRACT(YEAR FROM now())::int - 2, 'NonEU', 12 + floor(random() * 48)::int
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_seats st WHERE st.university_id = s.id AND st.year = EXTRACT(YEAR FROM now())::int - 2 AND st.candidate_type = 'NonEU'
);

-- Additional admission timelines (last year and next year)
INSERT INTO university_admissions (university_id, year, opens_month, deadline_month, results_month)
SELECT s.id,
       EXTRACT(YEAR FROM now())::int - 1,
       2 + (floor(random() * 5))::int,
       5 + (floor(random() * 4))::int,
       8 + (floor(random() * 3))::int
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_admissions a WHERE a.university_id = s.id AND a.year = EXTRACT(YEAR FROM now())::int - 1
);

INSERT INTO university_admissions (university_id, year, opens_month, deadline_month, results_month)
SELECT s.id,
       EXTRACT(YEAR FROM now())::int + 1,
       2 + (floor(random() * 5))::int,
       6 + (floor(random() * 3))::int,
       9 + (floor(random() * 3))::int
FROM tmp_seed_unis s
WHERE NOT EXISTS (
  SELECT 1 FROM university_admissions a WHERE a.university_id = s.id AND a.year = EXTRACT(YEAR FROM now())::int + 1
);

-- Enrich program tuition ranges (ensure max >= min)
UPDATE university_programs p
SET tuition_min = t.tmin,
    tuition_max = t.tmin + 2000 + t.bump
FROM (
  SELECT p2.id,
         2000 + (floor(random() * 3500))::int AS tmin,
         (floor(random() * 2000))::int AS bump
  FROM university_programs p2
  JOIN tmp_seed_unis s2 ON p2.university_id = s2.id
  WHERE p2.tuition_min IS NULL OR p2.tuition_max IS NULL
) t
WHERE p.id = t.id;

-- More gallery photos on universities table
UPDATE universities u
SET photos = jsonb_build_array(
      'https://picsum.photos/seed/uni-' || u.id::text || '-1/640/400',
      'https://picsum.photos/seed/uni-' || u.id::text || '-2/640/400',
      'https://picsum.photos/seed/uni-' || u.id::text || '-3/640/400'
    )
FROM tmp_seed_unis s
WHERE u.id = s.id;

-- Seed gallery items into university_media (4 images per uni)
INSERT INTO university_media (university_id, type, url, title)
SELECT s.id,
       'image',
       'https://picsum.photos/seed/uni-' || s.id::text || '-' || n::text || '/800/600',
       'Gallery ' || n::text
FROM tmp_seed_unis s
CROSS JOIN generate_series(1, 4) AS n;

-- Add cost and admission hints to article JSON
UPDATE universities u
SET article = jsonb_build_object(
      'title', 'FAKE_MAP_BULK_2025_09_10 article',
      'overview', 'This is demo content generated for development.',
      'cost_tips', jsonb_build_array(
        'Consider shared flats to reduce rent.',
        'Use student canteens to save on food.',
        'Monthly transport passes cut commuting costs.'
      ),
      'admission_tips', jsonb_build_array(
        'Register early and watch deadlines.',
        'Prepare documents ahead of time.',
        'Check visa requirements if applicable.'
      )
    )
FROM tmp_seed_unis s
WHERE u.id = s.id;

COMMIT;
