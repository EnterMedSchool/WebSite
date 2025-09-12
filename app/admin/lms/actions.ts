"use server";

import { revalidatePath } from "next/cache";
import { db, sql } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { chapters, chapterLessons, courses, lessons, questions, lmsAdminDrafts } from "@/drizzle/schema";
import { requireAdminEmail } from "@/lib/admin";

function assertAdmin(ok: any) {
  if (!ok) throw new Error("forbidden");
}

function slugify(input: string): string {
  const base = (input || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return base || "item";
}

async function nextChapterPosition(courseId: number): Promise<number> {
  const r = await sql`SELECT COALESCE(MAX(position), 0)::int AS maxpos FROM chapters WHERE course_id=${courseId}`;
  const maxpos = Number(r.rows?.[0]?.maxpos || 0);
  return maxpos + 1;
}

async function nextChapterLessonPosition(chapterId: number): Promise<number> {
  const r = await sql`SELECT COALESCE(MAX(position), 0)::int AS maxpos FROM chapter_lessons WHERE chapter_id=${chapterId}`;
  const maxpos = Number(r.rows?.[0]?.maxpos || 0);
  return maxpos + 1;
}

export async function createChapterAction(courseId: number, title: string, slug?: string) {
  assertAdmin(await requireAdminEmail());
  const cid = Number(courseId);
  if (!Number.isFinite(cid) || cid <= 0) throw new Error("bad_course");
  const safeTitle = (title || "Untitled").trim();
  let s = (slug || slugify(safeTitle)).slice(0, 120);
  // chapters.slug is globally unique, so prefix with course slug if needed
  try {
    const c = (await db.select({ slug: courses.slug }).from(courses).where(eq(courses.id as any, cid)).limit(1))[0];
    if (c?.slug) {
      s = `${c.slug}-${s}`.toLowerCase();
    }
  } catch {}
  // Ensure uniqueness by appending suffix
  for (let i = 0; i < 20; i++) {
    const exists = (await db.select({ id: chapters.id }).from(chapters).where(eq(chapters.slug as any, s)).limit(1))[0];
    if (!exists) break;
    s = `${s.replace(/-\d+$/, "")}-${i + 2}`;
  }
  const pos = await nextChapterPosition(cid);
  const ins = await db.insert(chapters).values({ courseId: cid, title: safeTitle, slug: s, position: pos }).returning({ id: chapters.id });
  revalidatePath(`/admin/lms/${cid}`);
  return { id: ins[0].id };
}

export async function renameChapterAction(chapterId: number, title: string) {
  assertAdmin(await requireAdminEmail());
  const id = Number(chapterId);
  if (!Number.isFinite(id) || id <= 0) throw new Error("bad_chapter");
  const safeTitle = (title || "Untitled").trim();
  await db.update(chapters).set({ title: safeTitle }).where(eq(chapters.id as any, id));
  // Find course for revalidate
  try {
    const ch = (await db.select({ courseId: chapters.courseId }).from(chapters).where(eq(chapters.id as any, id)).limit(1))[0];
    if (ch?.courseId) revalidatePath(`/admin/lms/${ch.courseId}`);
  } catch {}
  return { ok: true };
}

export async function deleteChapterAction(chapterId: number) {
  assertAdmin(await requireAdminEmail());
  const id = Number(chapterId);
  if (!Number.isFinite(id) || id <= 0) throw new Error("bad_chapter");
  // Load course id for revalidate before deletion
  const ch = (await db.select({ courseId: chapters.courseId }).from(chapters).where(eq(chapters.id as any, id)).limit(1))[0];
  await (sql as any)`DELETE FROM chapter_lessons WHERE chapter_id=${id}`;
  await db.delete(chapters).where(eq(chapters.id as any, id));
  if (ch?.courseId) revalidatePath(`/admin/lms/${ch.courseId}`);
  return { ok: true };
}

export async function reorderChaptersAction(courseId: number, orderedIds: number[]) {
  assertAdmin(await requireAdminEmail());
  const cid = Number(courseId);
  if (!Number.isFinite(cid) || cid <= 0) throw new Error("bad_course");
  const ids = (orderedIds || []).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0);
  if (ids.length === 0) return { ok: true };
  const items = ids.map((id, idx) => ({ id, pos: idx + 1 }));
  const idList = ids as any;
  const cases = items.map((it) => `WHEN ${it.id} THEN ${it.pos}`).join(" ");
  const q = `UPDATE chapters SET position = CASE id ${cases} END WHERE course_id = $1 AND id = ANY($2)`;
  await (sql as any).query(q, [cid, idList]);
  revalidatePath(`/admin/lms/${cid}`);
  return { ok: true };
}

export async function moveChapterAction(courseId: number, chapterId: number, direction: "up" | "down") {
  assertAdmin(await requireAdminEmail());
  const cid = Number(courseId);
  const id = Number(chapterId);
  if (!Number.isFinite(cid) || !Number.isFinite(id)) throw new Error("bad_request");
  const cur = await sql`SELECT id, position FROM chapters WHERE id=${id} AND course_id=${cid} LIMIT 1`;
  const row = cur.rows?.[0] as any;
  if (!row) return { ok: true };
  let neigh;
  if (direction === 'up') {
    neigh = await sql`SELECT id, position FROM chapters WHERE course_id=${cid} AND position < ${row.position} ORDER BY position DESC LIMIT 1`;
  } else {
    neigh = await sql`SELECT id, position FROM chapters WHERE course_id=${cid} AND position > ${row.position} ORDER BY position ASC LIMIT 1`;
  }
  const n = (neigh as any).rows?.[0] as any;
  if (!n) return { ok: true };
  await (sql as any)`UPDATE chapters SET position = CASE WHEN id=${id} THEN ${n.position} WHEN id=${n.id} THEN ${row.position} ELSE position END WHERE id IN (${[id, n.id] as any})`;
  revalidatePath(`/admin/lms/${cid}`);
  return { ok: true };
}

export async function attachLessonToChapterAction(chapterId: number, lessonId: number) {
  assertAdmin(await requireAdminEmail());
  const cid = Number(chapterId); const lid = Number(lessonId);
  if (!Number.isFinite(cid) || !Number.isFinite(lid)) throw new Error("bad_request");
  const exists = (await db.select({ id: chapterLessons.id }).from(chapterLessons).where(and(eq(chapterLessons.chapterId as any, cid), eq(chapterLessons.lessonId as any, lid))).limit(1))[0];
  if (exists) return { ok: true };
  const pos = await nextChapterLessonPosition(cid);
  await db.insert(chapterLessons).values({ chapterId: cid, lessonId: lid, position: pos });
  // Revalidate course
  const ch = (await db.select({ courseId: chapters.courseId }).from(chapters).where(eq(chapters.id as any, cid)).limit(1))[0];
  if (ch?.courseId) revalidatePath(`/admin/lms/${ch.courseId}`);
  return { ok: true };
}

export async function detachLessonFromChapterAction(chapterId: number, lessonId: number) {
  assertAdmin(await requireAdminEmail());
  const cid = Number(chapterId); const lid = Number(lessonId);
  if (!Number.isFinite(cid) || !Number.isFinite(lid)) throw new Error("bad_request");
  await db.delete(chapterLessons).where(and(eq(chapterLessons.chapterId as any, cid), eq(chapterLessons.lessonId as any, lid)));
  const ch = (await db.select({ courseId: chapters.courseId }).from(chapters).where(eq(chapters.id as any, cid)).limit(1))[0];
  if (ch?.courseId) revalidatePath(`/admin/lms/${ch.courseId}`);
  return { ok: true };
}

export async function reorderChapterLessonsAction(chapterId: number, orderedLessonIds: number[]) {
  assertAdmin(await requireAdminEmail());
  const cid = Number(chapterId);
  if (!Number.isFinite(cid)) throw new Error("bad_chapter");
  const ids = (orderedLessonIds || []).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0);
  if (ids.length === 0) return { ok: true };
  const items = ids.map((id, idx) => ({ id, pos: idx + 1 }));
  const idList = ids as any;
  const cases = items.map((it) => `WHEN ${it.id} THEN ${it.pos}`).join(" ");
  const q = `UPDATE chapter_lessons SET position = CASE lesson_id ${cases} END WHERE chapter_id = $1 AND lesson_id = ANY($2)`;
  await (sql as any).query(q, [cid, idList]);
  const ch = (await db.select({ courseId: chapters.courseId }).from(chapters).where(eq(chapters.id as any, cid)).limit(1))[0];
  if (ch?.courseId) revalidatePath(`/admin/lms/${ch.courseId}`);
  return { ok: true };
}

export async function createLessonAction(courseId: number, title: string, slug?: string) {
  assertAdmin(await requireAdminEmail());
  const cid = Number(courseId);
  if (!Number.isFinite(cid) || cid <= 0) throw new Error("bad_course");
  const safeTitle = (title || "Untitled Lesson").trim();
  let s = (slug || slugify(safeTitle)).slice(0, 120);
  // Ensure per-course uniqueness for lessons(slug,course)
  for (let i = 0; i < 20; i++) {
    const existing = (await db.select({ id: lessons.id }).from(lessons).where(and(eq(lessons.courseId as any, cid), eq(lessons.slug as any, s))).limit(1))[0];
    if (!existing) break;
    s = `${s.replace(/-\d+$/, "")}-${i + 2}`;
  }
  const pos = 0; // not used in chapters ordering
  const ins = await db.insert(lessons).values({ courseId: cid, title: safeTitle, slug: s, position: pos, visibility: "public" }).returning({ id: lessons.id });
  revalidatePath(`/admin/lms/${cid}`);
  return { id: ins[0].id };
}

export async function moveLessonBetweenChaptersAction(lessonId: number, fromChapterId: number, toChapterId: number) {
  assertAdmin(await requireAdminEmail());
  const lid = Number(lessonId), fromId = Number(fromChapterId), toId = Number(toChapterId);
  if (![lid, fromId, toId].every((n) => Number.isFinite(n) && n > 0)) throw new Error("bad_request");
  await db.delete(chapterLessons).where(and(eq(chapterLessons.chapterId as any, fromId), eq(chapterLessons.lessonId as any, lid)));
  const pos = await nextChapterLessonPosition(toId);
  await db.insert(chapterLessons).values({ chapterId: toId, lessonId: lid, position: pos });
  // Revalidate both courses if different
  const fromC = (await db.select({ courseId: chapters.courseId }).from(chapters).where(eq(chapters.id as any, fromId)).limit(1))[0];
  const toC = (await db.select({ courseId: chapters.courseId }).from(chapters).where(eq(chapters.id as any, toId)).limit(1))[0];
  if (fromC?.courseId) revalidatePath(`/admin/lms/${fromC.courseId}`);
  if (toC?.courseId && toC.courseId !== fromC?.courseId) revalidatePath(`/admin/lms/${toC.courseId}`);
  return { ok: true };
}

// Move lesson to a different chapter within the same course (detach from any and attach to target)
export async function moveLessonToChapterAction(lessonId: number, toChapterId: number) {
  assertAdmin(await requireAdminEmail());
  const lid = Number(lessonId), toId = Number(toChapterId);
  if (![lid, toId].every((n) => Number.isFinite(n) && n > 0)) throw new Error("bad_request");
  await db.delete(chapterLessons).where(eq(chapterLessons.lessonId as any, lid));
  const pos = await nextChapterLessonPosition(toId);
  await db.insert(chapterLessons).values({ chapterId: toId, lessonId: lid, position: pos });
  const ch = (await db.select({ courseId: chapters.courseId }).from(chapters).where(eq(chapters.id as any, toId)).limit(1))[0];
  if (ch?.courseId) revalidatePath(`/admin/lms/${ch.courseId}`);
  return { ok: true };
}

// Move a lesson across courses and optionally attach to a chapter in the target course
export async function moveLessonToCourseAndChapterAction(lessonId: number, toCourseId: number, toChapterId?: number | null) {
  assertAdmin(await requireAdminEmail());
  const lid = Number(lessonId), cid = Number(toCourseId);
  const toCh = toChapterId ? Number(toChapterId) : null;
  if (![lid, cid].every((n) => Number.isFinite(n) && n > 0)) throw new Error("bad_request");
  // Get current course
  const lr = await db.select({ id: lessons.id, courseId: lessons.courseId }).from(lessons).where(eq(lessons.id as any, lid)).limit(1);
  const curr = lr[0] as any;
  if (!curr) throw new Error("lesson_not_found");
  const fromCourseId = Number(curr.courseId);
  if (fromCourseId === cid) {
    // Same course: if a chapter provided, just move to that chapter
    if (toCh && Number.isFinite(toCh)) {
      await moveLessonToChapterAction(lid, toCh);
      return { ok: true };
    }
  }
  // Update lesson's course
  await db.update(lessons).set({ courseId: cid }).where(eq(lessons.id as any, lid));
  // Detach from any previous chapters
  await db.delete(chapterLessons).where(eq(chapterLessons.lessonId as any, lid));
  // Optionally attach to target chapter if provided
  if (toCh && Number.isFinite(toCh)) {
    // validate chapter belongs to target course
    const ch = (await db.select({ id: chapters.id, courseId: chapters.courseId }).from(chapters).where(eq(chapters.id as any, toCh)).limit(1))[0] as any;
    if (ch && Number(ch.courseId) === cid) {
      const pos = await nextChapterLessonPosition(Number(ch.id));
      await db.insert(chapterLessons).values({ chapterId: Number(ch.id), lessonId: lid, position: pos });
    }
  }
  // Revalidate affected admin pages
  revalidatePath(`/admin/lms/${fromCourseId}`);
  revalidatePath(`/admin/lms/${cid}`);
  revalidatePath(`/admin/lms/board`);
  return { ok: true };
}

export async function reorderQuestionsAction(lessonId: number, orderedQuestionIds: number[]) {
  assertAdmin(await requireAdminEmail());
  const lid = Number(lessonId);
  if (!Number.isFinite(lid) || lid <= 0) throw new Error("bad_lesson");
  const ids = (orderedQuestionIds || []).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0);
  if (ids.length === 0) return { ok: true };
  const items = ids.map((id, idx) => ({ id, rk: String(idx + 1).padStart(6, "0") }));
  const idList = ids as any;
  const cases = items.map((it) => `WHEN ${it.id} THEN '${it.rk}'`).join(" ");
  const q = `UPDATE questions SET rank_key = CASE id ${cases} END WHERE lesson_id = $1 AND id = ANY($2)`;
  await (sql as any).query(q, [lid, idList]);
  revalidatePath(`/admin/lms/lesson/${lid}/questions`);
  return { ok: true };
}

export async function moveQuestionToLessonAction(questionId: number, toLessonId: number) {
  assertAdmin(await requireAdminEmail());
  const qid = Number(questionId), lid = Number(toLessonId);
  if (!Number.isFinite(qid) || !Number.isFinite(lid)) throw new Error("bad_request");
  await db.update(questions).set({ lessonId: lid }).where(eq(questions.id as any, qid));
  revalidatePath(`/admin/lms/lesson/${lid}/questions`);
  return { ok: true };
}

export async function updateQuestionAction(questionId: number, fields: { prompt?: string; explanation?: string | null; access?: string | null }) {
  assertAdmin(await requireAdminEmail());
  const qid = Number(questionId);
  if (!Number.isFinite(qid) || qid <= 0) throw new Error("bad_question");
  const patch: any = {};
  if (typeof fields.prompt === "string") patch.prompt = fields.prompt;
  if (fields.explanation !== undefined) patch.explanation = fields.explanation as any;
  if (fields.access !== undefined) patch.access = fields.access as any;
  if (Object.keys(patch).length === 0) return { ok: true };
  await db.update(questions).set(patch).where(eq(questions.id as any, qid));
  return { ok: true };
}

export async function createQuestionAction(lessonId: number, prompt: string) {
  assertAdmin(await requireAdminEmail());
  const lid = Number(lessonId);
  if (!Number.isFinite(lid) || lid <= 0) throw new Error("bad_lesson");
  const p = (prompt || "New question").trim();
  // pick next rankKey by count+1 to avoid non-numeric rank collisions
  const r = await sql`SELECT COUNT(1)::int AS cnt FROM questions WHERE lesson_id=${lid}`;
  const cnt = Number(r.rows?.[0]?.cnt || 0);
  const next = String(cnt + 1).padStart(6, '0');
  const ins = await db.insert(questions).values({ lessonId: lid, prompt: p, rankKey: next }).returning({ id: questions.id });
  revalidatePath(`/admin/lms/lesson/${lid}/questions`);
  return { id: ins[0].id };
}

export async function deleteQuestionAction(questionId: number) {
  assertAdmin(await requireAdminEmail());
  const qid = Number(questionId);
  if (!Number.isFinite(qid) || qid <= 0) throw new Error("bad_question");
  // Load lesson for revalidate path before deletion
  const r = await sql`SELECT lesson_id FROM questions WHERE id=${qid} LIMIT 1`;
  const lid = Number(r.rows?.[0]?.lesson_id || 0);
  await (sql as any)`DELETE FROM choices WHERE question_id=${qid}`;
  await (sql as any)`DELETE FROM questions WHERE id=${qid}`;
  if (lid > 0) revalidatePath(`/admin/lms/lesson/${lid}/questions`);
  return { ok: true };
}

// Save a draft plan (server-side), keyed per admin and scope key (e.g., course:6)
export async function saveDraftAction(key: string, payload: any, title?: string) {
  const adm = await requireAdminEmail();
  assertAdmin(adm);
  const email = adm!.email.toLowerCase();
  const k = (key || "").slice(0, 120);
  if (!k) throw new Error("bad_key");
  const data = payload ?? {};
  // Upsert by (email,key) — emulate with delete+insert for portability
  await (sql as any)`DELETE FROM lms_admin_drafts WHERE email=${email} AND key=${k}`;
  const ins = await db.insert(lmsAdminDrafts).values({ email, key: k, title: title || null as any, payload: data, status: "draft" }).returning({ id: lmsAdminDrafts.id });
  return { id: ins[0].id };
}

export async function loadDraftAction(key: string) {
  const adm = await requireAdminEmail();
  assertAdmin(adm);
  const email = adm!.email.toLowerCase();
  const k = (key || "").slice(0, 120);
  const row = (await db.select().from(lmsAdminDrafts).where(and(eq(lmsAdminDrafts.email as any, email), eq(lmsAdminDrafts.key as any, k))).limit(1))[0] as any;
  if (!row) return null;
  return { id: row.id, payload: row.payload, title: row.title, status: row.status };
}

// Apply a draft by replaying contained operations. Supports a minimal op set for reorders and moves
export async function applyDraftAction(key: string) {
  const adm = await requireAdminEmail();
  assertAdmin(adm);
  const email = adm!.email.toLowerCase();
  const k = (key || "").slice(0, 120);
  const row = (await db.select().from(lmsAdminDrafts).where(and(eq(lmsAdminDrafts.email as any, email), eq(lmsAdminDrafts.key as any, k))).limit(1))[0] as any;
  if (!row) throw new Error("draft_not_found");
  const ops: any[] = Array.isArray(row.payload?.ops) ? row.payload.ops : [];
  // Execute ops inside a transaction-like best effort (Vercel Postgres lacks BEGIN; drizzle/sql will still run sequentially)
  for (const op of ops) {
    try {
      switch (op.type) {
        case 'reorder_chapters':
          await reorderChaptersAction(Number(op.courseId), op.orderedIds as number[]);
          break;
        case 'reorder_chapter_lessons':
          await reorderChapterLessonsAction(Number(op.chapterId), op.orderedLessonIds as number[]);
          break;
        case 'move_lesson_to_course_chapter':
          await moveLessonToCourseAndChapterAction(Number(op.lessonId), Number(op.toCourseId), op.toChapterId ? Number(op.toChapterId) : undefined);
          break;
        case 'move_lesson_to_chapter':
          await moveLessonToChapterAction(Number(op.lessonId), Number(op.toChapterId));
          break;
        default:
          // ignore unknown
          break;
      }
    } catch (e) {
      // Continue other ops; could collect errors in future
      // eslint-disable-next-line no-console
      console.error('apply op failed', op, e);
    }
  }
  // Mark as applied
  await db.update(lmsAdminDrafts).set({ status: "applied" as any }).where(eq(lmsAdminDrafts.id as any, row.id));
  return { ok: true };
}
