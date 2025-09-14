import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireUserId } from "@/lib/study/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Prefer mobile bearer token; fallback to NextAuth session
    let userId = await requireUserId(req);
    let u: any = null;
    if (!userId) {
      const session = await getServerSession(authOptions as any);
      const email = String((session as any)?.user?.email || "").toLowerCase();
      if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
      const ur = await sql`SELECT id, name, image, xp, level FROM users WHERE lower(email)=${email} LIMIT 1`;
      u = ur.rows[0];
      if (!u?.id) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
      userId = Number(u.id);
    } else {
      const ur = await sql`SELECT id, name, image, xp, level FROM users WHERE id=${userId} LIMIT 1`;
      u = ur.rows[0];
    }

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
    // Tasks completed today across study tasks and IMAT plan tasks
    const tStudy = await sql`SELECT COUNT(1) AS cnt
                              FROM study_task_items sti
                              JOIN study_task_lists stl ON stl.id = sti.task_list_id
                              WHERE stl.user_id=${userId}
                                AND COALESCE(sti.is_completed,false)=true
                                AND sti.completed_at IS NOT NULL
                                AND DATE(sti.completed_at)=CURRENT_DATE`;
    const tImat = await sql`SELECT COUNT(1) AS cnt
                             FROM imat_user_plan_tasks
                             WHERE user_id=${userId}
                               AND COALESCE(is_completed,false)=true
                               AND completed_at IS NOT NULL
                               AND DATE(completed_at)=CURRENT_DATE`;
    const tasksToday = Number(tStudy.rows?.[0]?.cnt || 0) + Number(tImat.rows?.[0]?.cnt || 0);

    // Latest two chapters the user is working on (by last viewed lesson),
    // plus stats: total minutes (sum length_min), average progress, and a continue slug
    const ch = await sql`
      WITH recent_lessons AS (
        SELECT lesson_id, MAX(last_viewed_at) AS lv
        FROM user_lesson_progress
        WHERE user_id=${userId}
        GROUP BY lesson_id
      ),
      chapter_hits AS (
        SELECT cl.chapter_id, MAX(rl.lv) AS lv
        FROM chapter_lessons cl
        JOIN recent_lessons rl ON rl.lesson_id = cl.lesson_id
        GROUP BY cl.chapter_id
      ),
      top_chapters AS (
        SELECT c.id, c.slug, c.title, co.slug AS course_slug, co.title AS course_title, ch.lv AS last_viewed
        FROM chapters c
        JOIN chapter_hits ch ON ch.chapter_id = c.id
        JOIN courses co ON co.id = c.course_id
        ORDER BY ch.lv DESC
        LIMIT 2
      ),
      stats AS (
        SELECT tc.id AS chapter_id,
               SUM(COALESCE(l.length_min, 0)) AS total_min,
               COALESCE(
                 ROUND(
                   AVG(
                     CASE WHEN COALESCE(ulp.completed,false)
                          THEN 100
                          ELSE COALESCE(ulp.progress,0)
                     END
                   )::numeric
                 ),
                 0
               ) AS progress_pct,
               (
                 SELECT le.slug FROM chapter_lessons cl2
                 JOIN lessons le ON le.id = cl2.lesson_id
                 LEFT JOIN user_lesson_progress ulp2 ON ulp2.lesson_id = le.id AND ulp2.user_id=${userId}
                 WHERE cl2.chapter_id = tc.id
                 ORDER BY ulp2.last_viewed_at DESC NULLS LAST, cl2.position ASC
                 LIMIT 1
               ) AS continue_slug,
               (
                 SELECT COALESCE(ulp3.completed,false) FROM chapter_lessons cl3
                 JOIN lessons le3 ON le3.id = cl3.lesson_id
                 LEFT JOIN user_lesson_progress ulp3 ON ulp3.lesson_id = le3.id AND ulp3.user_id=${userId}
                 WHERE cl3.chapter_id = tc.id
                 ORDER BY ulp3.last_viewed_at DESC NULLS LAST, cl3.position ASC
                 LIMIT 1
               ) AS continue_completed
        FROM top_chapters tc
        JOIN chapter_lessons cl ON cl.chapter_id = tc.id
        JOIN lessons l ON l.id = cl.lesson_id
        LEFT JOIN user_lesson_progress ulp ON ulp.lesson_id = l.id AND ulp.user_id=${userId}
        GROUP BY tc.id
      )
      SELECT tc.*, s.total_min, s.progress_pct, s.continue_slug, s.continue_completed
      FROM top_chapters tc
      LEFT JOIN stats s ON s.chapter_id = tc.id
      ORDER BY tc.last_viewed DESC`;

    // Replace course list with user's relevant courses if any
    let cr: any = null;
    try {
      const anyRel = await sql`SELECT 1 FROM user_relevant_courses WHERE user_id=${userId} LIMIT 1`;
      if (anyRel.rows[0]) {
        cr = await sql`
          WITH lessons_in_course AS (
            SELECT c.id AS course_id, l.id AS lesson_id
            FROM courses c
            JOIN chapters ch ON ch.course_id = c.id
            JOIN chapter_lessons cl ON cl.chapter_id = ch.id
            JOIN lessons l ON l.id = cl.lesson_id
          ), progress AS (
            SELECT lic.course_id,
                   COALESCE(
                     ROUND(
                       AVG(
                         CASE WHEN COALESCE(ulp.completed,false)
                              THEN 100
                              ELSE COALESCE(ulp.progress,0)
                         END
                       )::numeric
                     ), 0
                   ) AS progress_pct
            FROM lessons_in_course lic
            LEFT JOIN user_lesson_progress ulp ON ulp.lesson_id = lic.lesson_id AND ulp.user_id=${userId}
            GROUP BY lic.course_id
          )
          SELECT c.id, c.slug, c.title, c.description, p.progress_pct
          FROM courses c
          JOIN user_relevant_courses urc ON urc.course_id = c.id AND urc.user_id=${userId}
          LEFT JOIN progress p ON p.course_id = c.id
          ORDER BY c.title ASC
          LIMIT 12`;
      } else {
        cr = await sql`
          WITH lessons_in_course AS (
            SELECT c.id AS course_id, l.id AS lesson_id
            FROM courses c
            JOIN chapters ch ON ch.course_id = c.id
            JOIN chapter_lessons cl ON cl.chapter_id = ch.id
            JOIN lessons l ON l.id = cl.lesson_id
          ), progress AS (
            SELECT lic.course_id,
                   COALESCE(
                     ROUND(
                       AVG(
                         CASE WHEN COALESCE(ulp.completed,false)
                              THEN 100
                              ELSE COALESCE(ulp.progress,0)
                         END
                       )::numeric
                     ), 0
                   ) AS progress_pct
            FROM lessons_in_course lic
            LEFT JOIN user_lesson_progress ulp ON ulp.lesson_id = lic.lesson_id AND ulp.user_id=${userId}
            GROUP BY lic.course_id
          )
          SELECT c.id, c.slug, c.title, c.description, p.progress_pct
          FROM courses c
          LEFT JOIN progress p ON p.course_id = c.id
          ORDER BY c.created_at DESC
          LIMIT 8`;
      }
    } catch {
      cr = { rows: [] } as any;
    }

    // Streak days disabled while XP system is rebuilt
    let streakDays = 0;

    // Past 7-day series
    const labels: string[] = [];
    const xp7: number[] = [];
    const min7: number[] = [];
    const corr7: number[] = [];
    const tasks7: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(); day.setHours(0,0,0,0); day.setDate(day.getDate() - i);
      const next = new Date(day.getTime() + 86400000);
      const fromIso = day.toISOString(); const toIso = next.toISOString();
      labels.push(day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      // XP series disabled while XP system is rebuilt
      const mr = await sql`SELECT COALESCE(SUM(time_spent_sec),0) AS sec FROM user_lesson_progress WHERE user_id=${userId} AND last_viewed_at >= ${fromIso} AND last_viewed_at < ${toIso}`;
      const qr = await sql`SELECT COUNT(1) AS cnt FROM user_question_progress WHERE user_id=${userId} AND correct=true AND answered_at >= ${fromIso} AND answered_at < ${toIso}`;
      xp7.push(0);
      min7.push(Math.round(Number(mr.rows?.[0]?.sec || 0) / 60));
      corr7.push(Number(qr.rows?.[0]?.cnt || 0));
      const tsr = await sql`SELECT 
                               (SELECT COUNT(1) FROM study_task_items sti
                                   JOIN study_task_lists stl ON stl.id = sti.task_list_id
                                   WHERE stl.user_id=${userId}
                                     AND COALESCE(sti.is_completed,false)=true
                                     AND sti.completed_at >= ${fromIso}
                                     AND sti.completed_at < ${toIso})
                               +
                               (SELECT COUNT(1) FROM imat_user_plan_tasks ipt
                                   WHERE ipt.user_id=${userId}
                                     AND COALESCE(ipt.is_completed,false)=true
                                     AND ipt.completed_at >= ${fromIso}
                                     AND ipt.completed_at < ${toIso}) AS cnt`;
      tasks7.push(Number(tsr.rows?.[0]?.cnt || 0));
    }

    return NextResponse.json({
      user: { id: userId, name: u.name, image: u.image, xp: Number(u.xp||0), level: Number(u.level||1), streakDays },
      learning: { minutesToday, minutesTotal, correctToday, tasksToday },
      chapters: ch.rows,
      courses: cr.rows,
      series: { labels, xp7, min7, corr7, tasks7 },
    });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
