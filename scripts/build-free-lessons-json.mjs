#!/usr/bin/env node
// Export free lessons as static JSON for CDN serving to guests (no serverless calls).
// Usage: node scripts/build-free-lessons-json.mjs

import { sql } from "@vercel/postgres";
import fs from "node:fs";
import path from "node:path";

function outDir() {
  return path.join(process.cwd(), "public", "free-lessons", "v1");
}

async function fetchFreeLessonSlugs() {
  const r = await sql`
    SELECT l.slug
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    WHERE (c.meta->>'access') IS DISTINCT FROM 'paid'
      AND (c.visibility IS NULL OR c.visibility='public')
  `;
  return r.rows.map((r) => String(r.slug));
}

async function fetchLessonPayload(slug) {
  const lr = await sql`SELECT l.id, l.slug, l.title, l.course_id, l.video_html, l.body,
                              c.id AS course_id2, c.slug AS course_slug, c.title AS course_title
                         FROM lessons l JOIN courses c ON c.id=l.course_id
                        WHERE l.slug=${slug} LIMIT 1`;
  const l = lr.rows[0];
  if (!l) return null;

  // chapter and lessons in chapter
  const ch = await sql`SELECT c.id, c.slug, c.title, c.position, cl.chapter_id
                         FROM chapter_lessons cl JOIN chapters c ON c.id=cl.chapter_id
                        WHERE cl.lesson_id=${l.id}
                     ORDER BY cl.position ASC, cl.chapter_id ASC LIMIT 1`;
  let chapter = null; let lessons = [];
  if (ch.rows[0]?.chapter_id) {
    chapter = { id: Number(ch.rows[0].id), slug: String(ch.rows[0].slug), title: String(ch.rows[0].title), position: Number(ch.rows[0].position||0) };
    const lsr = await sql`SELECT l.id, l.slug, l.title, cl.position
                            FROM chapter_lessons cl JOIN lessons l ON l.id=cl.lesson_id
                           WHERE cl.chapter_id=${ch.rows[0].chapter_id}
                        ORDER BY cl.position ASC, l.id ASC`;
    lessons = lsr.rows.map((r)=>({ id: Number(r.id), slug: String(r.slug), title: String(r.title), position: Number(r.position||0) }));
  }

  // questions without correct flags
  const qr = await sql`SELECT id, prompt FROM questions WHERE lesson_id=${l.id} ORDER BY COALESCE(rank_key,'')`;
  let questions = [];
  if (qr.rows.length) {
    const qids = qr.rows.map((r)=>Number(r.id));
    const cr = await sql`SELECT id, question_id, content FROM choices WHERE question_id = ANY(${qids as any}) ORDER BY id`;
    const byQ = new Map(); for (const c of cr.rows) {
      const arr = byQ.get(Number(c.question_id)) || []; arr.push({ id: Number(c.id), text: String(c.content) }); byQ.set(Number(c.question_id), arr);
    }
    questions = qr.rows.map((q)=>({ id: Number(q.id), prompt: String(q.prompt), choices: byQ.get(Number(q.id)) || [] }));
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
  };
}

async function main() {
  const dir = outDir();
  fs.mkdirSync(dir, { recursive: true });
  const slugs = await fetchFreeLessonSlugs();
  const index = [];
  for (const slug of slugs) {
    try {
      const data = await fetchLessonPayload(slug);
      if (!data) continue;
      const p = path.join(dir, `${slug}.json`);
      fs.writeFileSync(p, JSON.stringify(data));
      index.push({ slug, title: data.lesson.title, courseSlug: data.course.slug });
      console.log(`[free-lessons] wrote ${p}`);
    } catch (e) {
      console.warn(`[free-lessons] failed for ${slug}:`, e.message);
    }
  }
  fs.writeFileSync(path.join(dir, `index.json`), JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), lessons: index }));
}

main().catch((e) => { console.error(e); process.exit(1); });

