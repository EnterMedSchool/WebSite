import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { courses, lessons, questions, choices, courseSections, lessonBlocks } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

function contentRoot() { return path.join(process.cwd(), "content", "courses"); }

async function ensureCourse(courseJson: any) {
  const slug = String(courseJson.slug);
  const found = (await db.select().from(courses).where(eq(courses.slug, slug)))[0];
  if (found) {
    await db.update(courses).set({ title: courseJson.title, description: courseJson.description ?? null, visibility: courseJson.visibility ?? "public", rankKey: courseJson.rank ?? found.rankKey }).where(eq(courses.id, found.id));
    return found.id;
  }
  const ins = await db.insert(courses).values({ slug, title: courseJson.title, description: courseJson.description ?? null, visibility: courseJson.visibility ?? "public", rankKey: courseJson.rank ?? null }).returning({ id: courses.id });
  return ins[0].id;
}

async function ensureSection(courseId: number, slug: string, title?: string, rank?: string) {
  if (!slug) return null as any;
  const existing = (await db.select().from(courseSections).where(and(eq(courseSections.courseId, courseId), eq(courseSections.slug, slug))))[0];
  if (existing) { return existing.id; }
  const ins = await db.insert(courseSections).values({ courseId, slug, title: title || slug, rankKey: rank || null }).returning({ id: courseSections.id });
  return ins[0].id;
}

async function ensureLesson(courseId: number, lessonJson: any, sectionId?: number | null) {
  const slug = String(lessonJson.slug);
  const existing = (await db.select().from(lessons).where(and(eq(lessons.courseId, courseId), eq(lessons.slug, slug))))[0];
  if (existing) {
    await db.update(lessons).set({ title: lessonJson.title, visibility: lessonJson.visibility ?? "public", sectionId: sectionId ?? null, rankKey: lessonJson.rank ?? existing.rankKey }).where(eq(lessons.id, existing.id));
    return existing.id;
  }
  const ins = await db.insert(lessons).values({ courseId, slug, title: lessonJson.title, visibility: lessonJson.visibility ?? "public", sectionId: sectionId ?? null, rankKey: lessonJson.rank ?? null }).returning({ id: lessons.id });
  return ins[0].id;
}

async function ensureBlocks(lessonId: number, lessonDir: string, lessonJson: any) {
  // Clear and insert blocks ordered (video, notes, tips)
  // For MVP, we just insert a single HTML/video block and optional notes path
  // Use raw SQL helper rather than db.execute with a plain object (drizzle expects a SQL object)
  await (sql as any)`DELETE FROM lesson_blocks WHERE lesson_id = ${lessonId}`;
  const items: Array<{ kind: string; content: string; rank: string }> = [];
  if (lessonJson.video && (lessonJson.video.src || lessonJson.video.poster)) {
    items.push({ kind: 'video', content: JSON.stringify(lessonJson.video), rank: 'a' });
  }
  if (lessonJson.notes) {
    const notesPath = path.join(lessonDir, lessonJson.notes);
    let md = "";
    try { md = fs.readFileSync(notesPath, 'utf8'); } catch {}
    items.push({ kind: 'note', content: md, rank: 'b' });
  }
  (lessonJson.tips ?? []).forEach((t: string, i: number) => items.push({ kind: 'tip', content: t, rank: `c${i}` }));
  for (const it of items) {
    await db.insert(lessonBlocks).values({ lessonId, kind: it.kind, content: it.content, rankKey: it.rank });
  }
}

async function ensureQuestions(lessonId: number, lessonDir: string) {
  const qPath = path.join(lessonDir, 'questions.json');
  if (!fs.existsSync(qPath)) return { created: 0, updated: 0 };
  const arr = JSON.parse(fs.readFileSync(qPath, 'utf8')) as any[];
  let created = 0, updated = 0;
  for (const q of arr) {
    const existing = (await db.select().from(questions).where(and(eq(questions.lessonId, lessonId), eq(questions.prompt, q.prompt))))[0];
    let qId: number;
    if (existing) {
      await db.update(questions).set({ explanation: q.explanation ?? existing.explanation, rankKey: q.rank ?? existing.rankKey, difficulty: q.difficulty ?? existing.difficulty, meta: null }).where(eq(questions.id, existing.id));
      qId = existing.id; updated++;
      await db.execute({ sql: `DELETE FROM choices WHERE question_id = $1`, params: [qId] } as any);
    } else {
      const ins = await db.insert(questions).values({ lessonId, prompt: q.prompt, explanation: q.explanation ?? null, rankKey: q.rank ?? null, difficulty: q.difficulty ?? null }).returning({ id: questions.id });
      qId = ins[0].id; created++;
    }
    for (const ch of q.choices) {
      await db.insert(choices).values({ questionId: qId, content: ch.text, correct: !!ch.correct });
    }
  }
  return { created, updated };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function runSync(keyFromReq: string | null) {
  const key = keyFromReq || "";
  const secret = (process.env.SEED_SECRET || process.env.ADMIN_SECRET || '').trim();
  if (!secret) return { status: 500, body: { error: 'Missing SEED_SECRET/ADMIN_SECRET on server' } };
  if (key !== secret) return { status: 403, body: { error: 'Forbidden' } };

  const root = contentRoot();
  if (!fs.existsSync(root)) return { status: 500, body: { error: `No content directory at ${root}` } };

  const report: any = { courses: [], lessons: [], questions: [] };
  try {
    const coursesDirs = fs.readdirSync(root);
    for (const cdir of coursesDirs) {
      const cPath = path.join(root, cdir);
      if (!fs.statSync(cPath).isDirectory()) continue;
      const courseJsonPath = path.join(cPath, 'course.json');
      if (!fs.existsSync(courseJsonPath)) continue;
      const cjson = JSON.parse(fs.readFileSync(courseJsonPath, 'utf8'));
      const courseId = await ensureCourse(cjson);
      report.courses.push({ slug: cjson.slug, id: courseId });

      const lessonsRoot = path.join(cPath, 'lessons');
      if (!fs.existsSync(lessonsRoot)) continue;
      const lessonsDirs = fs.readdirSync(lessonsRoot);
      for (const ldir of lessonsDirs) {
        const lPath = path.join(lessonsRoot, ldir);
        if (!fs.statSync(lPath).isDirectory()) continue;
        const ljsonPath = path.join(lPath, 'lesson.json');
        if (!fs.existsSync(ljsonPath)) continue;
        const ljson = JSON.parse(fs.readFileSync(ljsonPath, 'utf8'));
        const sectionId = ljson.section ? await ensureSection(courseId, ljson.section) : null;
        const lessonId = await ensureLesson(courseId, ljson, sectionId);
        await ensureBlocks(lessonId, lPath, ljson);
        const qres = await ensureQuestions(lessonId, lPath);
        report.lessons.push({ slug: ljson.slug, id: lessonId });
        report.questions.push({ lesson: ljson.slug, ...qres });
      }
    }
    return { status: 200, body: { ok: true, report } };
  } catch (e:any) {
    return { status: 500, body: { error: String(e?.message || e) } };
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || req.headers.get('x-admin-key');
  const { status, body } = await runSync(key);
  return NextResponse.json(body, { status });
}

// Allow GET for convenience (preview environments)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || req.headers.get('x-admin-key');
  const { status, body } = await runSync(key);
  return NextResponse.json(body, { status });
}
