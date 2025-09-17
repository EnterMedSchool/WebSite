import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { cookies } from "next/headers";
import { currentUserIdServer } from "@/lib/study/auth";
import { checkCourseAccess } from "@/lib/lesson/access";
import { extractIframeSrc, detectProviderFromSrc, isPremiumSrc } from "@/lib/video/embed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatCount(n: number, label: string) {
  if (n === 1) return `1 ${label}`;
  return `${n} ${label}s`;
}

export default async function ChapterPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const chapterRes = await sql`
    SELECT ch.id, ch.slug, ch.title, ch.description, ch.course_id,
           ch.meta,
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
  const lessons = lessonsRes.rows.map((r: any) => ({
    id: Number(r.id),
    slug: String(r.slug),
    title: String(r.title),
    courseId: Number(r.course_id),
    videoHtml: r.video_html as string | null,
    meta: r.meta as Record<string, any> | null,
    position: Number(r.position || 0),
  }));

  const courseId = lessons[0]?.courseId || Number(chapterRow.course_id || 0);
  if (!courseId) notFound();

  const cookieStore = cookies();
  const userId = await currentUserIdServer();
  const access = await checkCourseAccess(userId || 0, courseId, {
    cookieStore: cookieStore as any,
    courseMeta: { visibility: chapterRow.course_visibility, access: chapterRow.course_access, meta: chapterRow.course_meta },
  });

  if (access.accessType === 'paid' && !access.allowed) {
    if (!userId) {
      redirect(`/signin?next=${encodeURIComponent(`/chapter/${slug}`)}`);
    }
    redirect('/pricing');
  }

  const lessonIds = lessons.map((l) => l.id);
  const questionCounts = new Map<number, number>();
  if (lessonIds.length) {
    const qc = await sql`SELECT lesson_id, COUNT(*)::int AS n FROM questions WHERE lesson_id = ANY(${lessonIds as any}) GROUP BY lesson_id`;
    for (const row of qc.rows) questionCounts.set(Number(row.lesson_id), Number(row.n || 0));
  }

  let progressLessons = new Set<number>();
  const correctByLesson = new Map<number, number>();
  const incorrectByLesson = new Map<number, number>();
  if (userId && courseId) {
    try {
      const pr = await sql`SELECT data FROM user_course_progress_compact WHERE user_id=${userId} AND course_id=${courseId} LIMIT 1`;
      const data = (pr.rows[0]?.data || {}) as any;
      if (data.lessons) {
        progressLessons = new Set<number>(Object.keys(data.lessons).map((k) => Number(k)));
      }
      if (data.questions) {
        const qids = Object.keys(data.questions).map((k) => Number(k));
        if (qids.length) {
          const mapping = await sql`SELECT id, lesson_id FROM questions WHERE id = ANY(${qids as any})`;
          const qToLesson = new Map<number, number>();
          for (const row of mapping.rows) qToLesson.set(Number(row.id), Number(row.lesson_id));
          for (const [qidStr, info] of Object.entries<any>(data.questions)) {
            const lessonId = qToLesson.get(Number(qidStr));
            if (!lessonId) continue;
            if (info?.status === 'correct') {
              correctByLesson.set(lessonId, (correctByLesson.get(lessonId) || 0) + 1);
            } else if (info?.status === 'incorrect') {
              incorrectByLesson.set(lessonId, (incorrectByLesson.get(lessonId) || 0) + 1);
            }
          }
        }
      }
    } catch {}
  }

  let player: { provider: string | null; iframeSrc: string | null } | null = null;
  const firstLesson = lessons[0];
  if (firstLesson?.videoHtml) {
    let iframeSrc = extractIframeSrc(String(firstLesson.videoHtml));
    const provider = detectProviderFromSrc(iframeSrc || undefined);
    if (access.accessType === 'paid' && !access.allowed && iframeSrc && isPremiumSrc(iframeSrc)) {
      iframeSrc = null;
    }
    player = { provider, iframeSrc };
  }

  const completedCount = lessons.filter((l) => progressLessons.has(l.id)).length;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4">
        <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="md:max-w-2xl">
              <h1 className="text-3xl font-semibold text-slate-900">{chapterRow.title}</h1>
              {chapterRow.description && (
                <p className="mt-3 text-base text-slate-600">{chapterRow.description}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span>{formatCount(lessons.length, 'lesson')}</span>
                <span>&middot;</span>
                <span>
                  {completedCount}/{lessons.length} completed
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-600">
                {formatCount(Array.from(questionCounts.values()).reduce((a, b) => a + b, 0), 'question')}
              </span>
              {player?.iframeSrc && (
                <span className="text-xs text-slate-400">Video preview available</span>
              )}
            </div>
          </div>
          {player?.iframeSrc && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-black/5 shadow-inner">
              <iframe
                src={player.iframeSrc}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Lessons in this chapter</h2>
            <span className="text-sm text-slate-500">{completedCount} of {lessons.length} completed</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {lessons.map((lesson) => {
              const totalQ = questionCounts.get(lesson.id) || 0;
              const correct = correctByLesson.get(lesson.id) || 0;
              const incorrect = incorrectByLesson.get(lesson.id) || 0;
              const attempted = correct + incorrect;
              const completed = progressLessons.has(lesson.id);
              return (
                <Link
                  key={lesson.id}
                  href={`/lesson/${lesson.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-indigo-500">
                      <span>Lesson {lesson.position + 1}</span>
                      {completed && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Completed</span>}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
                      {lesson.title}
                    </h3>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                    <span>{formatCount(totalQ, 'question')}</span>
                    {attempted > 0 && (
                      <span>
                        {correct}/{attempted} correct
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
