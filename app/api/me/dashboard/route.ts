import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    const email = String((session as any)?.user?.email || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    // Resolve user id and basic profile
    const ur = await sql`SELECT id, name, image, xp, level FROM users WHERE lower(email)=${email} LIMIT 1`;
    const u = ur.rows[0];
    if (!u?.id) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const userId = Number(u.id);

    // Learning activity metrics
    const todayRow = await sql`SELECT COALESCE(SUM(time_spent_sec),0) AS sec
                               FROM user_lesson_progress
                               WHERE user_id=${userId} AND DATE(last_viewed_at)=CURRENT_DATE`;
    const totalRow = await sql`SELECT COALESCE(SUM(time_spent_sec),0) AS sec
                               FROM user_lesson_progress
                               WHERE user_id=${userId}`;
    const correctTodayRow = await sql`SELECT COUNT(1) AS cnt
                                      FROM user_question_progress
                                      WHERE user_id=${userId} AND correct=true AND DATE(answered_at)=CURRENT_DATE`;
    const minutesToday = Math.round(Number(todayRow.rows?.[0]?.sec || 0) / 60);
    const minutesTotal = Math.round(Number(totalRow.rows?.[0]?.sec || 0) / 60);
    const correctToday = Number(correctTodayRow.rows?.[0]?.cnt || 0);

    // Latest two chapters the user is working on (by last viewed lesson)
    const ch = await sql`
      WITH recent_lessons AS (
        SELECT lesson_id, MAX(last_viewed_at) AS lv
        FROM user_lesson_progress
        WHERE user_id=${userId}
        GROUP BY lesson_id
        ORDER BY lv DESC
        LIMIT 30
      ),
      chapter_hits AS (
        SELECT cl.chapter_id, MAX(rl.lv) AS lv
        FROM chapter_lessons cl
        JOIN recent_lessons rl ON rl.lesson_id = cl.lesson_id
        GROUP BY cl.chapter_id
      )
      SELECT c.id, c.slug, c.title, co.slug AS course_slug, co.title AS course_title, ch.lv AS last_viewed
      FROM chapters c
      JOIN chapter_hits ch ON ch.chapter_id = c.id
      JOIN courses co ON co.id = c.course_id
      ORDER BY ch.lv DESC
      LIMIT 2`;

    // Your class: all available courses (basic fields)
    const cr = await sql`SELECT id, slug, title, description FROM courses ORDER BY created_at DESC LIMIT 8`;

    return NextResponse.json({
      user: { id: userId, name: u.name, image: u.image, xp: Number(u.xp||0), level: Number(u.level||1) },
      learning: { minutesToday, minutesTotal, correctToday },
      chapters: ch.rows,
      courses: cr.rows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
