import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { currentUserIdServer } from "@/lib/study/auth";
import { checkCourseAccess } from "@/lib/lesson/access";
import { extractIframeSrc, detectProviderFromSrc, isPremiumSrc } from "@/lib/video/embed";
import ChapterPageClient from "@/components/chapter/ChapterPageClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ChapterPageProps = {
  params: { slug: string };
};

type LessonRow = {
  id: number;
  slug: string;
  title: string;
  courseId: number;
  position: number;
  videoHtml: string | null;
  meta: Record<string, any> | null;
};

export default async function ChapterPage({ params }: ChapterPageProps) {
  const slug = params.slug;
  const chapterRes = await sql`
    SELECT ch.id, ch.slug, ch.title, ch.description, ch.course_id,
           ch.meta,
           co.slug AS course_slug,
           co.title AS course_title,
           co.visibility AS course_visibility,
           co.meta AS course_meta,
           COALESCE(co.meta->>'access','') AS course_access
      FROM chapters ch
      JOIN courses co ON co.id = ch.course_id
     WHERE ch.slug=${slug}
     LIMIT 1`;
  const chapterRow = chapterRes.rows[0] as any;
  if (!chapterRow) notFound();

  const lessonsRes = await sql`
    SELECT l.id, l.slug, l.title, l.course_id, l.video_html, l.meta, cl.position
      FROM chapter_lessons cl
      JOIN lessons l ON l.id = cl.lesson_id
     WHERE cl.chapter_id=${chapterRow.id}
  ORDER BY cl.position ASC, l.id ASC`;

  const lessons: LessonRow[] = lessonsRes.rows.map((row: any) => ({
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    courseId: Number(row.course_id),
    videoHtml: row.video_html as string | null,
    meta: row.meta as Record<string, any> | null,
    position: Number(row.position || 0),
  }));

  const courseId = lessons[0]?.courseId || Number(chapterRow.course_id || 0);
  if (!courseId) notFound();

  const cookieStore = cookies();
  const userId = await currentUserIdServer();
  const access = await checkCourseAccess(userId || 0, courseId, {
    cookieStore: cookieStore as any,
    courseMeta: { visibility: chapterRow.course_visibility, access: chapterRow.course_access, meta: chapterRow.course_meta },
  });

  if (access.accessType === "paid" && !access.allowed) {
    if (!userId) {
      redirect(`/signin?next=${encodeURIComponent(`/chapter/${slug}`)}`);
    }
    redirect("/pricing");
  }

  const lessonIds = lessons.map((lesson) => lesson.id);
  const questionCounts = new Map<number, number>();
  if (lessonIds.length) {
    const qc = await sql`SELECT lesson_id, COUNT(*)::int AS n FROM questions WHERE lesson_id = ANY(${lessonIds as any}) GROUP BY lesson_id`;
    for (const row of qc.rows) questionCounts.set(Number(row.lesson_id), Number(row.n || 0));
  }

  const progressLessons = new Set<number>();
  const correctByLesson = new Map<number, number>();
  const incorrectByLesson = new Map<number, number>();

  if (userId && courseId) {
    try {
      const progressRes = await sql`SELECT data FROM user_course_progress_compact WHERE user_id=${userId} AND course_id=${courseId} LIMIT 1`;
      const progressData = (progressRes.rows[0]?.data || {}) as any;
      if (progressData.lessons) {
        for (const lessonKey of Object.keys(progressData.lessons)) {
          progressLessons.add(Number(lessonKey));
        }
      }
      if (progressData.questions) {
        const questionIds = Object.keys(progressData.questions).map((key) => Number(key));
        if (questionIds.length) {
          const mappingRes = await sql`SELECT id, lesson_id FROM questions WHERE id = ANY(${questionIds as any})`;
          const questionToLesson = new Map<number, number>();
          for (const row of mappingRes.rows) questionToLesson.set(Number(row.id), Number(row.lesson_id));
          for (const [questionIdRaw, info] of Object.entries<any>(progressData.questions)) {
            const lessonId = questionToLesson.get(Number(questionIdRaw));
            if (!lessonId) continue;
            if (info?.status === "correct") {
              correctByLesson.set(lessonId, (correctByLesson.get(lessonId) || 0) + 1);
            } else if (info?.status === "incorrect") {
              incorrectByLesson.set(lessonId, (incorrectByLesson.get(lessonId) || 0) + 1);
            }
          }
        }
      }
    } catch {
      // progress fetching is best effort only
    }
  }

  let player: { provider: string | null; iframeSrc: string | null } | null = null;
  const firstLesson = lessons[0];
  if (firstLesson?.videoHtml) {
    let iframeSrc = extractIframeSrc(String(firstLesson.videoHtml));
    const provider = detectProviderFromSrc(iframeSrc || undefined);
    if (access.accessType === "paid" && !access.allowed && iframeSrc && isPremiumSrc(iframeSrc)) {
      iframeSrc = null;
    }
    player = { provider, iframeSrc };
  }

  const completedCount = lessons.filter((lesson) => progressLessons.has(lesson.id)).length;
  const totalQuestions = Array.from(questionCounts.values()).reduce((acc, count) => acc + count, 0);
  const totalCorrect = Array.from(correctByLesson.values()).reduce((acc, count) => acc + count, 0);
  const chapterProgressPct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const questionAccuracyPct = totalQuestions ? Math.round((totalCorrect / Math.max(1, totalQuestions)) * 100) : 0;
  const firstLessonSlug = lessons[0]?.slug || null;

  const lessonsSummaries = lessons.map((lesson) => {
    const totalQ = questionCounts.get(lesson.id) || 0;
    const correct = correctByLesson.get(lesson.id) || 0;
    const incorrect = incorrectByLesson.get(lesson.id) || 0;
    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      position: lesson.position,
      totalQuestions: totalQ,
      correct,
      incorrect,
      completed: progressLessons.has(lesson.id),
    };
  });

  const stats = {
    totalLessons: lessons.length,
    completedCount,
    totalQuestions,
    totalCorrect,
    progressPct: chapterProgressPct,
    accuracyPct: questionAccuracyPct,
  };

  const resumeLessonSlug = (() => {
    const lastCompleted = [...lessons].reverse().find((lesson) => progressLessons.has(lesson.id));
    return lastCompleted?.slug ?? null;
  })();

  const clientPlayer = player ? { iframeSrc: player.iframeSrc } : null;

  return (
    <ChapterPageClient
      chapter={{ slug: String(chapterRow.slug), title: String(chapterRow.title), description: chapterRow.description ?? null }}
      course={{ slug: String(chapterRow.course_slug || "course"), title: String(chapterRow.course_title || "Course") }}
      lessons={lessonsSummaries}
      stats={stats}
      player={clientPlayer}
      resumeLessonSlug={resumeLessonSlug}
      firstLessonSlug={firstLessonSlug}
    />
  );
}
