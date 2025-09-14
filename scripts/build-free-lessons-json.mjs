#!/usr/bin/env node
// Export free lessons as static JSON for CDN serving to guests (no serverless calls).
// Usage: node scripts/build-free-lessons-json.mjs

import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Get the connection string from common env names
const CONNECTION_STRING = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;
if (!CONNECTION_STRING) {
  console.error("[free-lessons] Missing Postgres connection string (POSTGRES_URL or DATABASE_URL)." );
  process.exit(2);
}

// Initialize pg pool (works with Neon pooled or direct strings)
const pool = new Pool({ connectionString: CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
const q = (text, params=[]) => pool.query(text, params);

function outDir() {
  return path.join(process.cwd(), "public", "free-lessons", "v1");
}

async function fetchFreeLessonSlugs() {
  const r = await q(
    `SELECT l.slug
       FROM lessons l
       JOIN courses c ON c.id = l.course_id
      WHERE (c.meta->>'access') IS DISTINCT FROM 'paid'
        AND (c.visibility IS NULL OR c.visibility='public')`
  );
  return r.rows.map((row) => String(row.slug));
}

async function fetchLessonPayload(slug) {
  const lr = await q(
    `SELECT l.id, l.slug, l.title, l.course_id, l.video_html, l.body, l.meta,\n            c.id AS course_id2, c.slug AS course_slug, c.title AS course_title
       FROM lessons l JOIN courses c ON c.id=l.course_id
      WHERE l.slug=$1
      LIMIT 1`,
    [slug]
  );
  const l = lr.rows[0];
  if (!l) return null;

  // chapter and lessons in chapter
  const ch = await q(
    `SELECT c.id, c.slug, c.title, c.position, cl.chapter_id
       FROM chapter_lessons cl JOIN chapters c ON c.id=cl.chapter_id
      WHERE cl.lesson_id=$1
   ORDER BY cl.position ASC, cl.chapter_id ASC LIMIT 1`,
    [l.id]
  );
  let chapter = null; let lessons = [];
  if (ch.rows[0]?.chapter_id) {
    chapter = { id: Number(ch.rows[0].id), slug: String(ch.rows[0].slug), title: String(ch.rows[0].title), position: Number(ch.rows[0].position||0) };
    const lsr = await q(
      `SELECT l.id, l.slug, l.title, cl.position
         FROM chapter_lessons cl JOIN lessons l ON l.id=cl.lesson_id
        WHERE cl.chapter_id=$1
     ORDER BY cl.position ASC, l.id ASC`,
      [ch.rows[0].chapter_id]
    );
    lessons = lsr.rows.map((r)=>({ id: Number(r.id), slug: String(r.slug), title: String(r.title), position: Number(r.position||0) }));
  }

  // questions without correct flags (lesson + optional chapter-wide with cap)
  const MAX_CHAPTER_QUESTIONS = Number(process.env.FREE_JSON_MAX_CHAPTER_Q || 400);
  const qr = await q(`SELECT id, prompt FROM questions WHERE lesson_id=$1 ORDER BY COALESCE(rank_key,'')`, [l.id]);
  let questions = [];
  let questionsByLesson = {};
  if (qr.rows.length) {
    const qids = qr.rows.map((r)=>Number(r.id));
    // ANY with array param
    const cr = await q(`SELECT id, question_id, content FROM choices WHERE question_id = ANY($1::int4[]) ORDER BY id`, [qids]);
    const byQ = new Map(); for (const c of cr.rows) {
      const arr = byQ.get(Number(c.question_id)) || []; arr.push({ id: Number(c.id), text: String(c.content) }); byQ.set(Number(c.question_id), arr);
    }
    questions = qr.rows.map((q)=>({ id: Number(q.id), prompt: String(q.prompt), choices: byQ.get(Number(q.id)) || [] }));
  }
  // Chapter-wide (cap total number to keep files reasonably small)
  if (lessons.length) {
    let remaining = Math.max(0, MAX_CHAPTER_QUESTIONS - questions.length);
    if (remaining > 0) {
      const ids = lessons.map((x)=>Number(x.id));
      const qr2 = await q(`SELECT id, prompt, lesson_id FROM questions WHERE lesson_id = ANY($1::int4[]) ORDER BY lesson_id, COALESCE(rank_key,'')`, [ids]);
      const capped = [];
      for (const r of qr2.rows) { if (remaining <= 0) break; capped.push(r); remaining--; }
      if (capped.length) {
        const qids2 = capped.map((r)=>Number(r.id));
        const cr2 = await q(`SELECT id, question_id, content FROM choices WHERE question_id = ANY($1::int4[]) ORDER BY id`, [qids2]);
        const byQ2 = new Map(); for (const c of cr2.rows) { const arr = byQ2.get(Number(c.question_id)) || []; arr.push({ id: Number(c.id), text: String(c.content) }); byQ2.set(Number(c.question_id), arr); }
        for (const r of capped) {
          const lid = String(Number(r.lesson_id));
          if (!questionsByLesson[lid]) questionsByLesson[lid] = [];
          questionsByLesson[lid].push({ id: Number(r.id), prompt: String(r.prompt), choices: byQ2.get(Number(r.id)) || [] });
        }
      }
    }
  }

  // Player info for guests: best-effort extraction of iframe src if YouTube
  let iframeSrc = null; let src = null;
  try {
    const m = String(l.video_html || '').match(/src\s*=\s*"([^"]+)"/i);
    if (m?.[1]) iframeSrc = m[1];
  } catch {}

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    lesson: { id: Number(l.id), slug: String(l.slug), title: String(l.title), courseId: Number(l.course_id) },
    course: { id: Number(l.course_id2 || l.course_id), slug: String(l.course_slug), title: String(l.course_title) },
    chapter,
    lessons,
    player: { iframeSrc, src },
    html: String(l.body || ''),
    questions,
    questionsByLesson,\n    authors: (l.meta && (l.meta.author || l.meta.reviewer)) ? { author: l.meta.author || null, reviewer: l.meta.reviewer || null } : { author: null, reviewer: null },\n  };
}

async function main() {
  const dir = outDir();
  fs.mkdirSync(dir, { recursive: true });
  const slugs = await fetchFreeLessonSlugs();
  const index = [];
  const sha1 = (obj) => crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');
  for (const slug of slugs) {
    try {
      const data = await fetchLessonPayload(slug);
      if (!data) continue;
      // Add hash for change detection
      const hash = sha1({
        l: data.lesson,
        c: data.course,
        ch: data.chapter,
        ls: data.lessons,
        p: data.player,
        h: data.html,
        q: data.questions,
        qb: data.questionsByLesson || null,
      });
      data.hash = hash;
      const p = path.join(dir, `${slug}.json`);
      let shouldWrite = true;
      if (fs.existsSync(p)) {
        try {
          const prev = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (prev?.hash && prev.hash === hash) shouldWrite = false;
        } catch {}
      }
      if (shouldWrite) {
        fs.writeFileSync(p, JSON.stringify(data));
        console.log(`[free-lessons] wrote ${p}`);
      }
      index.push({ slug, title: data.lesson.title, courseSlug: data.course.slug, hash });
    } catch (e) {
      console.warn(`[free-lessons] failed for ${slug}:`, e.message);
    }
  }
  fs.writeFileSync(path.join(dir, `index.json`), JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), lessons: index }));
  try { await pool.end(); } catch {}
}

main().catch((e) => { console.error(e); process.exit(1); });


