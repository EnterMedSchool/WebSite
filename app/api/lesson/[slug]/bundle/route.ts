
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUserId } from "@/lib/study/auth";
import { checkCourseAccess, entitlementCookieOptions } from "@/lib/lesson/access";
import { courseTokenName } from "@/lib/lesson/entitlements";
import { getLessonBundle } from "@/lib/lesson/bundles";
import { isPremiumSrc } from "@/lib/video/embed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "chapter"; // chapter | lesson
  const include = new Set((url.searchParams.get("include") || "").split(",").map((s) => s.trim()).filter(Boolean));

  const stored = await getLessonBundle(params.slug);
  if (!stored) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { bundle } = stored;

  const access = await checkCourseAccess(userId, stored.courseId, { req });
  if (access.accessType === "paid" && !access.allowed) {
    const deny = NextResponse.json({ error: "forbidden", reason: "paid_course" }, { status: 403 });
    deny.cookies.set(`ems_paid_denied_${stored.courseId}`, String(Date.now()), { maxAge: 600, path: "/" });
    try { deny.cookies.set(`ems_paid_denied_l_${params.slug}`, "1", { maxAge: 600, path: "/" }); } catch {}
    if (access.clearToken) {
      try { deny.cookies.set(courseTokenName(stored.courseId), "", { maxAge: 0, path: "/" }); } catch {}
    }
    return deny;
  }

  const summary = {
    byLesson: Object.fromEntries(
      Object.entries(bundle.summary.byLesson).map(([key, value]) => [key, { ...value }])
    ),
    lessonsCompleted: [...bundle.summary.lessonsCompleted],
  };

  const progress: any = { lessons: {}, questions: {}, xpTotal: 0, version: 1, updatedAt: null };
  try {
    const pr = await sql<{ data: any; xp_total: number | null; version: number | null; updated_at: string | null }>`
      SELECT data, xp_total, version, updated_at
        FROM user_course_progress_compact
       WHERE user_id = ${userId} AND course_id = ${stored.courseId}
       LIMIT 1
    `;
    if (pr.rows[0]) {
      progress.lessons = pr.rows[0].data?.lessons || {};
      progress.questions = pr.rows[0].data?.questions || {};
      progress.xpTotal = Number(pr.rows[0].xp_total || 0);
      progress.version = Number(pr.rows[0].version || 1);
      progress.updatedAt = pr.rows[0].updated_at || null;
    }
  } catch {}

  const questionToLesson = new Map<number, string>();
  for (const [lessonKey, arr] of Object.entries(bundle.questionsByLesson)) {
    for (const q of Array.isArray(arr) ? arr : []) {
      const qid = Number((q as any)?.id);
      if (Number.isFinite(qid)) questionToLesson.set(qid, lessonKey);
    }
  }

  const completedIds = Object.keys(progress.lessons || {})
    .map((id) => Number(id))
    .filter((id) => bundle.lessons.some((l) => Number(l.id) === id));
  summary.lessonsCompleted = completedIds;

  for (const [qidStr, details] of Object.entries(progress.questions || {})) {
    const qid = Number(qidStr);
    if (!Number.isFinite(qid)) continue;
    const lessonKey = questionToLesson.get(qid);
    if (!lessonKey) continue;
    const stats = summary.byLesson[lessonKey];
    if (!stats) continue;
    const status = (details as any)?.status;
    if (status === "correct") {
      stats.correct += 1;
      stats.attempted += 1;
    } else if (status === "incorrect") {
      stats.incorrect += 1;
      stats.attempted += 1;
    }
  }

  const questionsSource = bundle.questionsByLesson;
  const questionsByLesson = scope === "lesson"
    ? {
        [String(bundle.lesson.id)]: Array.isArray(questionsSource[String(bundle.lesson.id)])
          ? [...questionsSource[String(bundle.lesson.id)]]
          : [],
      }
    : Object.fromEntries(Object.entries(questionsSource).map(([key, value]) => [key, Array.isArray(value) ? [...value] : []]));

  let player: any = undefined;
  if (include.has("player")) {
    const basePlayer = bundle.player;
    if (basePlayer) {
      let iframeSrc = basePlayer.iframeSrc;
      let locked = false;
      let lockReason: string | undefined;
      if (iframeSrc && access.accessType === "paid" && !access.allowed) {
        locked = true;
        lockReason = "paid_course";
        if (isPremiumSrc(iframeSrc)) iframeSrc = null;
      }
      player = {
        provider: basePlayer.provider,
        iframeSrc,
        locked,
        lockReason,
        source: basePlayer.source,
      };
    }
  }

  const payload: any = {
    lesson: bundle.lesson,
    course: bundle.course,
    chapter: bundle.chapter,
    lessons: bundle.lessons,
    questionsByLesson,
    progress,
    summary,
    scope,
  };

  if (include.has("body")) {
    payload.html = bundle.html;
  }
  if (player !== undefined) {
    payload.player = player;
  }
  if (bundle.authors) {
    payload.authors = bundle.authors;
  }

  const res = NextResponse.json(payload);

  if (access.tokenToSet) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    res.cookies.set(
      courseTokenName(stored.courseId),
      access.tokenToSet.value,
      entitlementCookieOptions(access.tokenToSet.expiresAt, nowSeconds)
    );
  }

  return res;
}
