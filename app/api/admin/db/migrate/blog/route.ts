export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql as dsql } from "drizzle-orm";

function requireKey(request: Request) {
  const url = new URL(request.url);
  const qp = url.searchParams.get("key");
  const headerKey = request.headers.get("x-seed-key");
  const key = (qp ?? headerKey ?? "").trim().replace(/^['"]|['"]$/g, "");
  const secret = (process.env.SEED_SECRET ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!secret || !key || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// Idempotent blog posts migration that matches drizzle/migrations/0031 and 0032
// but avoids splitting issues with $$ blocks. Safe to re-run.
const STATEMENTS: string[] = [
  // Ensure table exists (superset schema). If table already exists, this is a no-op.
  `CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(160) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    excerpt TEXT,
    body TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    noindex BOOLEAN NOT NULL DEFAULT FALSE,

    cover_image_url VARCHAR(500),
    cover_image_alt VARCHAR(300),
    cover_image_width INT,
    cover_image_height INT,
    cover_image_caption TEXT,

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
    twitter_creator VARCHAR(50),
    twitter_image_alt VARCHAR(300),

    structured_data JSONB,
    tags JSONB,

    lang VARCHAR(16),
    hreflang_alternates JSONB,
    redirect_from JSONB,
    robots_directives JSONB,

    publisher_name VARCHAR(120),
    publisher_logo_url VARCHAR(500),

    sitemap_changefreq VARCHAR(16),
    sitemap_priority DOUBLE PRECISION,

    author_name VARCHAR(120),
    author_email VARCHAR(255),

    published_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts (slug)`,
  `CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published)`,

  // Add any missing columns (idempotent)
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt TEXT`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS noindex BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_alt VARCHAR(300)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_title VARCHAR(200)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_description VARCHAR(320)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url VARCHAR(500)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_title VARCHAR(200)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_description VARCHAR(320)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image_url VARCHAR(500)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_card VARCHAR(32) NOT NULL DEFAULT 'summary_large_image'`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_title VARCHAR(200)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_description VARCHAR(320)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_image_url VARCHAR(500)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS structured_data JSONB`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags JSONB`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name VARCHAR(120)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_email VARCHAR(255)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`,

  // Extras from 0032
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS lang VARCHAR(16)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS hreflang_alternates JSONB`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS redirect_from JSONB`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS robots_directives JSONB`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_width INT`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_height INT`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image_caption TEXT`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_creator VARCHAR(50)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS twitter_image_alt VARCHAR(300)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS publisher_name VARCHAR(120)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS publisher_logo_url VARCHAR(500)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS sitemap_changefreq VARCHAR(16)`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS sitemap_priority DOUBLE PRECISION`,
];

export async function GET(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;

  try {
    const executed: string[] = [];
    for (const stmt of STATEMENTS) {
      await db.execute(dsql.raw(stmt));
      executed.push(stmt.slice(0, 80) + (stmt.length > 80 ? "..." : ""));
    }
    return NextResponse.json({ ok: true, executed });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

