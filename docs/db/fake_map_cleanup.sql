-- Cleanup script to remove the bulk fake map content
-- Usage: psql ... -f docs/db/fake_map_cleanup.sql

BEGIN;

-- Adjust this tag if you changed it in the seed migration
WITH to_del AS (
  SELECT id FROM universities WHERE seed_tag = 'FAKE_MAP_BULK_2025_09_10'
)
DELETE FROM university_scores WHERE university_id IN (SELECT id FROM to_del);

WITH to_del AS (
  SELECT id FROM universities WHERE seed_tag = 'FAKE_MAP_BULK_2025_09_10'
)
DELETE FROM university_seats WHERE university_id IN (SELECT id FROM to_del);

WITH to_del AS (
  SELECT id FROM universities WHERE seed_tag = 'FAKE_MAP_BULK_2025_09_10'
)
DELETE FROM university_costs WHERE university_id IN (SELECT id FROM to_del);

WITH to_del AS (
  SELECT id FROM universities WHERE seed_tag = 'FAKE_MAP_BULK_2025_09_10'
)
DELETE FROM university_admissions WHERE university_id IN (SELECT id FROM to_del);

WITH to_del AS (
  SELECT id FROM universities WHERE seed_tag = 'FAKE_MAP_BULK_2025_09_10'
)
DELETE FROM university_programs WHERE university_id IN (SELECT id FROM to_del);

WITH to_del AS (
  SELECT id FROM universities WHERE seed_tag = 'FAKE_MAP_BULK_2025_09_10'
)
DELETE FROM university_media WHERE university_id IN (SELECT id FROM to_del);

WITH to_del AS (
  SELECT id FROM universities WHERE seed_tag = 'FAKE_MAP_BULK_2025_09_10'
)
DELETE FROM university_articles WHERE university_id IN (SELECT id FROM to_del);

WITH to_del AS (
  SELECT id FROM universities WHERE seed_tag = 'FAKE_MAP_BULK_2025_09_10'
)
DELETE FROM university_testimonials WHERE university_id IN (SELECT id FROM to_del);

DELETE FROM universities WHERE seed_tag = 'FAKE_MAP_BULK_2025_09_10';

COMMIT;

