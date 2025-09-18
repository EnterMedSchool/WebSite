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
  const totalQuestions = Array.from(questionCounts.values()).reduce((a, b) => a + b, 0);
  const totalCorrect = Array.from(correctByLesson.values()).reduce((a, b) => a + b, 0);
  const chapterProgressPct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  const questionAccuracyPct = totalQuestions ? Math.round((totalCorrect / Math.max(1, totalQuestions)) * 100) : 0;
  const firstLessonSlug = lessons[0]?.slug || null;

  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-24">
      <div className="mx-auto w-full max-w-6xl px-4 pt-14 lg:px-6">
        <div className="space-y-8">
          <section className="rounded-[32px] border border-slate-200 bg-white/95 px-8 py-10 shadow-sm">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-6">
                <span className="inline-flex w-max items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Chapter overview</span>
                <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">{chapterRow.title}</h1>
                {chapterRow.description && (
                  <p className="max-w-2xl text-base text-slate-600">{chapterRow.description}</p>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Lessons</div>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCount(lessons.length, 'lesson')}</p>
                    <p className="text-xs text-slate-600">{completedCount}/{lessons.length} completed</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Questions</div>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCount(totalQuestions, 'question')}</p>
                    <p className="text-xs text-slate-600">Across this chapter</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Progress</div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-indigo-600" style={{ width: `${chapterProgressPct}%` }} />
                    </div>
                    <p className="mt-3 text-xs text-slate-600">{totalCorrect}/{totalQuestions} correct &bull; {questionAccuracyPct}% accuracy</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {player?.iframeSrc && (
                  <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Video preview</span>
                )}
                {firstLessonSlug && (
                  <Link
                    href={`/lesson/${firstLessonSlug}`}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-400/30 transition hover:bg-slate-800"
                  >
                    Start first lesson
                  </Link>
                )}
              </div>
            </div>
          </section>

          {player?.iframeSrc && (
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <iframe
                  src={player.iframeSrc}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={chapterRow.title}
                />
              </div>
            </section>
          )}

          <section className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Lessons in this chapter</h2>
                <p className="text-sm text-slate-500">{completedCount} of {lessons.length} completed &bull; {formatCount(totalQuestions, 'question')} across the chapter.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{questionCounts.size} lesson{questionCounts.size === 1 ? '' : 's'} with questions</span>
            </div>
            <div className="space-y-4">
              {lessons.map((lesson, idx) => {
                const totalQ = questionCounts.get(lesson.id) || 0;
                const correct = correctByLesson.get(lesson.id) || 0;
                const incorrect = incorrectByLesson.get(lesson.id) || 0;
                const attempted = correct + incorrect;
                const completed = progressLessons.has(lesson.id);
                return (
                  <Link
                    key={lesson.id}
                    href={`/lesson/${lesson.slug}`}
                    className={`group flex items-center gap-5 rounded-3xl border px-5 py-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md ${completed ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-white'}`}
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">{idx + 1}</span>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-900 transition group-hover:text-indigo-600">{lesson.title}</h3>
                        {completed && <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Completed</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{formatCount(totalQ, 'question')}</span>
                        {attempted > 0 && <span>{correct}/{attempted} correct</span>}
                        <span>Lesson {lesson.position + 1}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">Open</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

