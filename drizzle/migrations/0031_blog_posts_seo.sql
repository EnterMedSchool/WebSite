-- Blog posts table with SEO fields (idempotent)
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  noindex BOOLEAN NOT NULL DEFAULT FALSE,

  cover_image_url VARCHAR(500),
  cover_image_alt VARCHAR(300),

  meta_title VARCHAR(200),
  meta_description VARCHAR(320),
  canonical_url VARCHAR(500),

  og_title VARCHAR(200),
  og_description VARCHAR(320),
  og_image_url VARCHAR(500),

  twitter_card VARCHAR(32) NOT NULL DEFAULT 'summary_large_image',
  twitter_title VARCHAR(200),
  twitter_description VARCHAR(320),
  twitter_image_url VARCHAR(500),

  structured_data JSONB,
  tags JSONB,

  author_name VARCHAR(120),
  author_email VARCHAR(255),

  published_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts (slug);
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published);

-- In case table existed with fewer columns, add missing columns safely
DO $$ BEGIN
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt TEXT;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS noindex BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_alt VARCHAR(300);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_title VARCHAR(200);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_description VARCHAR(320);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url VARCHAR(500);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_title VARCHAR(200);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_description VARCHAR(320);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image_url VARCHAR(500);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_card VARCHAR(32) NOT NULL DEFAULT 'summary_large_image';
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_title VARCHAR(200);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_description VARCHAR(320);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_image_url VARCHAR(500);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS structured_data JSONB;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags JSONB;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name VARCHAR(120);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
EXCEPTION WHEN others THEN NULL; END $$;

