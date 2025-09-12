CREATE TABLE IF NOT EXISTS lms_admin_drafts (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL,
  key varchar(120) NOT NULL,
  title varchar(200),
  payload jsonb NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'draft',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lms_admin_drafts_email_idx ON lms_admin_drafts(email);
CREATE INDEX IF NOT EXISTS lms_admin_drafts_key_idx ON lms_admin_drafts(key);
CREATE INDEX IF NOT EXISTS lms_admin_drafts_status_idx ON lms_admin_drafts(status);
