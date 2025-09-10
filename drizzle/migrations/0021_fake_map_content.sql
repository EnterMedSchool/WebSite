-- Bulk fake content for the homepage map and university details
-- Generates ~1,000 universities across 10 countries with programs, costs, admissions, and scores

BEGIN;

-- Seed tag for easy cleanup
-- Update this if you re-run a similar seed to allow separate cleanup
DO $$ BEGIN END $$; -- placeholder to keep BEGIN/COMMIT symmetric in drizzle

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

-- Bounding boxes for rough lat/lng per country (minLat, maxLat, minLng, maxLng)
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
-- Generate N universities per country
gen AS (
  SELECT
    i.country_id,
    i.country,
    gs AS idx,
    'City ' || i.country || ' ' || gs::text AS city,
    'Fake University ' || i.country || ' #' || gs::text AS uni_name,
    (i.min_lat + random() * (i.max_lat - i.min_lat))::double precision AS lat,
    (i.min_lng + random() * (i.max_lng - i.min_lng))::double precision AS lng,
    (CASE WHEN (gs % 3)=0 THEN 'private' ELSE 'public' END) AS kind,
    (CASE WHEN (gs % 2)=0 THEN 'English' ELSE 'Italian' END) AS language,
    (CASE WHEN (gs % 4)=0 THEN 'UCAT' ELSE 'IMAT' END) AS exam,
    'https://picsum.photos/seed/'|| replace(lower(i.country),' ','-') || '-' || gs::text || '/64' AS logo,
    (CASE WHEN (gs % 5)=0 THEN TRUE ELSE FALSE END) AS has_dorms,
    (CASE WHEN (gs % 4)=0 THEN TRUE ELSE FALSE END) AS has_scholarships
  FROM ids i
  CROSS JOIN generate_series(1, 100) AS gs
),
inserted AS (
  INSERT INTO universities (
    country_id, city, name, lat, lng, kind, language, admission_exam, logo_url, photos, orgs, article, has_dorms, has_scholarships, seed_tag
  )
  SELECT
    g.country_id,
    g.city,
    g.uni_name,
    g.lat,
    g.lng,
    g.kind,
    g.language,
    g.exam,
    g.logo,
    jsonb_build_array(g.logo),
    jsonb_build_array('EMS '||g.country, 'Sports Club', 'Volunteering'),
    jsonb_build_object('title', 'FAKE_MAP_BULK_2025_09_10 article'),
    g.has_dorms,
    g.has_scholarships,
    'FAKE_MAP_BULK_2025_09_10'
  FROM gen g
  RETURNING id, name
),
-- One program per uni
prog AS (
  INSERT INTO university_programs (university_id, name, language, admission_exam, currency, active)
  SELECT i.id, 'Medicine and Surgery', (CASE WHEN (random() < 0.5) THEN 'English' ELSE 'Italian' END), (CASE WHEN (random() < 0.4) THEN 'UCAT' ELSE 'IMAT' END), 'EUR', TRUE
  FROM inserted i
  RETURNING university_id
),
-- Costs per uni
costs AS (
  INSERT INTO university_costs (university_id, rent_eur, food_index, transport_eur)
  SELECT i.id,
         350 + floor(random() * 850)::int,     -- €350..€1200
         60 + floor(random() * 60)::int,       -- 60..120
         15 + floor(random() * 45)::int        -- €15..€60
  FROM inserted i
  RETURNING university_id
),
-- Admissions per uni (current year)
adms AS (
  INSERT INTO university_admissions (university_id, year, opens_month, deadline_month, results_month)
  SELECT i.id,
         EXTRACT(YEAR FROM now())::int,
         3 + (floor(random() * 6))::int,    -- Mar..Aug
         6 + (floor(random() * 5))::int,    -- Jun..Oct
         9 + (floor(random() * 4))::int     -- Sep..Dec
  FROM inserted i
  RETURNING university_id
),
-- Scores per uni (EU/NonEU)
scores AS (
  INSERT INTO university_scores (university_id, year, candidate_type, min_score)
  SELECT i.id, EXTRACT(YEAR FROM now())::int, 'EU', 45 + round(random() * 30, 1)
  FROM inserted i
  UNION ALL
  SELECT i.id, EXTRACT(YEAR FROM now())::int, 'NonEU', 55 + round(random() * 35, 1)
  FROM inserted i
  RETURNING university_id
)
SELECT 1;

COMMIT;

