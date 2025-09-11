-- Focused indexes to speed up map aggregation queries
-- Safe to run multiple times; IF NOT EXISTS guards are supported by Postgres 9.6+

-- Universities lookup by country and case-insensitive name (for slug mapping)
CREATE INDEX IF NOT EXISTS idx_universities_country_id ON universities (country_id);
CREATE INDEX IF NOT EXISTS idx_universities_name_lower ON universities ((lower(name)));

-- Program aggregation groups by university_id
CREATE INDEX IF NOT EXISTS idx_uni_programs_university_id ON university_programs (university_id);

-- Scores/seats filtered and ordered by (university_id, year, candidate_type)
CREATE INDEX IF NOT EXISTS idx_university_scores_uni_year_type ON university_scores (university_id, year DESC, candidate_type);
CREATE INDEX IF NOT EXISTS idx_university_seats_uni_year_type ON university_seats (university_id, year DESC, candidate_type);

-- Costs latest by (university_id, updated_at, id)
CREATE INDEX IF NOT EXISTS idx_university_costs_uni_updated ON university_costs (university_id, updated_at DESC, id DESC);

-- Admissions preferred by current year, otherwise latest
CREATE INDEX IF NOT EXISTS idx_university_admissions_uni_year ON university_admissions (university_id, year DESC);

