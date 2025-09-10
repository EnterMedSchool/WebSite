BEGIN;

CREATE TABLE IF NOT EXISTS terms (
  id         serial PRIMARY KEY,
  slug       varchar(160) NOT NULL,
  title      varchar(200) NOT NULL,
  data       jsonb,
  tags       jsonb,
  updated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS terms_slug_unique ON terms (slug);
CREATE INDEX IF NOT EXISTS terms_slug_idx ON terms (slug);

COMMIT;

