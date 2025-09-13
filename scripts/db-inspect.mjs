#!/usr/bin/env node
// Quick DB inspector for a given lesson slug
import pg from 'pg';

const { Client } = pg;

const dsn = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
if (!dsn) {
  console.error('Missing DATABASE_URL/POSTGRES_URL env');
  process.exit(2);
}

const slug = process.argv[2] || 'dic';

async function main() {
  const client = new Client({ connectionString: dsn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const lr = await client.query(
      `SELECT l.id, l.slug, l.title, l.course_id,
              c.slug AS course_slug, c.visibility,
              COALESCE(c.meta->>'access','') AS access
         FROM lessons l JOIN courses c ON c.id = l.course_id
        WHERE l.slug = $1
        LIMIT 5`,
      [slug]
    );
    if (!lr.rows.length) {
      console.log(`[inspect] No lesson found with slug = ${slug}`);
      return;
    }
    const l = lr.rows[0];
    console.log('[inspect] lesson:', { id: l.id, slug: l.slug, title: l.title });
    console.log('[inspect] course:', { id: l.course_id, slug: l.course_slug, visibility: l.visibility, access: l.access });

    const ok = (l.access !== 'paid') && (!l.visibility || l.visibility === 'public');
    console.log('[inspect] passes free filter:', ok);

    const qr = await client.query('SELECT COUNT(*)::int AS n FROM questions WHERE lesson_id = $1', [l.id]);
    console.log('[inspect] questions count:', qr.rows[0]?.n || 0);

    const chr = await client.query('SELECT COUNT(*)::int AS n FROM chapter_lessons WHERE lesson_id = $1', [l.id]).catch(()=>({ rows:[{n:0}] }));
    console.log('[inspect] in chapters mapping:', chr.rows[0]?.n || 0);
  } finally {
    await client.end();
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });

