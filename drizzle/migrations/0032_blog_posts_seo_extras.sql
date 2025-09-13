-- Extra SEO fields for posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS lang VARCHAR(16);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hreflang_alternates JSONB; -- [{ lang, href }]
ALTER TABLE posts ADD COLUMN IF NOT EXISTS redirect_from JSONB;       -- string[] old paths
ALTER TABLE posts ADD COLUMN IF NOT EXISTS robots_directives JSONB;   -- { nofollow, maxSnippet, ... }

ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_width INT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_height INT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_caption TEXT;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_creator VARCHAR(50);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_image_alt VARCHAR(300);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS publisher_name VARCHAR(120);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS publisher_logo_url VARCHAR(500);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS sitemap_changefreq VARCHAR(16);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sitemap_priority DOUBLE PRECISION;

