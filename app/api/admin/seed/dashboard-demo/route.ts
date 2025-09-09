export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

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

export async function POST(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;
  const url = new URL(request.url);
  const userId = Number(url.searchParams.get("userId") || 3);
  const courseId = 1; // Hematology
  const chapterSlug = "coagulation-disorders";
  const chapterTitle = "Coagulation Disorders";
  const lessonIds = [1, 2];

  try {
    // Ensure chapter exists under course 1
    const chRes = await sql`
      INSERT INTO chapters (course_id, slug, title, position, visibility)
      VALUES (${courseId}, ${chapterSlug}, ${chapterTitle}, 1, 'public')
      ON CONFLICT (slug)
      DO UPDATE SET course_id = EXCLUDED.course_id, title = EXCLUDED.title
      RETURNING id`;
    const chapterId = Number(chRes.rows?.[0]?.id);
    if (!chapterId) throw new Error("Failed to upsert chapter");

    // Link lessons 1 and 2 to chapter
    for (let i = 0; i < lessonIds.length; i++) {
      const lid = lessonIds[i];
      await sql`
        INSERT INTO chapter_lessons (chapter_id, lesson_id, position)
        VALUES (${chapterId}, ${lid}, ${i + 1})
        ON CONFLICT (chapter_id, lesson_id) DO NOTHING`;
      // Set lesson length if empty
      await sql`UPDATE lessons SET length_min = COALESCE(length_min, CASE WHEN id=${lid} THEN ${i === 0 ? 45 : 30} ELSE length_min END) WHERE id=${lid}`;
    }

    // Create some learning activity for user
    const now = new Date();
    const todayISO = now.toISOString();
    for (const lid of lessonIds) {
      // Update if exists; otherwise insert
      const upd = await sql`UPDATE user_lesson_progress
                             SET progress = 60, completed = false, last_viewed_at = ${todayISO}, time_spent_sec = COALESCE(time_spent_sec,0) + 1800
                             WHERE user_id=${userId} AND lesson_id=${lid}`;
      if ((upd as any).rowCount === 0) {
        await sql`INSERT INTO user_lesson_progress (user_id, lesson_id, progress, completed, last_viewed_at, time_spent_sec)
                  VALUES (${userId}, ${lid}, 60, false, ${todayISO}, 1800)`;
      }
    }

    // Add a few correct answers today (question ids are arbitrary)
    for (let i = 0; i < 5; i++) {
      const qid = 1000 + i; // synthetic ids
      await sql`INSERT INTO user_question_progress (user_id, question_id, choice_id, correct, answered_at)
                VALUES (${userId}, ${qid}, ${qid * 10}, true, ${todayISO})`;
    }

    return NextResponse.json({ ok: true, chapterId, linkedLessons: lessonIds, userId });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

