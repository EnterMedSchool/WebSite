-- Add profile context fields for personalized dashboards
ALTER TABLE users
  ADD COLUMN profile_stage varchar(24) NOT NULL DEFAULT 'guest',
  ADD COLUMN exam_tracks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN admissions_focus_country varchar(64),
  ADD COLUMN admissions_focus_region varchar(64),
  ADD COLUMN school_status varchar(24) NOT NULL DEFAULT 'unknown',
  ADD COLUMN school_preferences jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN dashboard_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN onboarding_state jsonb NOT NULL DEFAULT '{}'::jsonb;

