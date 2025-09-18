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
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-[-220px] h-[420px] bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-56 left-12 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -top-32 right-6 h-80 w-80 rounded-full bg-purple-500/20 blur-2xl" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-24 pt-16 lg:px-8">
        <div className="space-y-10">
          <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-10 text-white shadow-[0_32px_84px_rgba(79,70,229,0.35)] ring-1 ring-white/10">
            <div className="absolute -right-24 top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-28 right-12 h-64 w-64 rounded-full bg-emerald-400/25 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-6">
                <span className="inline-flex w-max items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Chapter</span>
                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">{chapterRow.title}</h1>
                {chapterRow.description && (
                  <p className="max-w-2xl text-base text-white/80">{chapterRow.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-[12px]">
                  <span className="rounded-full bg-white/20 px-3 py-1 font-semibold text-white/90">{formatCount(lessons.length, 'lesson')}</span>
                  <span className="rounded-full bg-white/20 px-3 py-1 font-semibold text-white/90">{formatCount(totalQuestions, 'question')}</span>
                  <span className="rounded-full bg-white/20 px-3 py-1 font-semibold text-white/90">{completedCount}/{lessons.length} completed</span>
                </div>
                <div className="space-y-3 text-[12px] text-white/85">
                  <div className="font-medium uppercase tracking-[0.3em] text-white/60">Overall progress</div>
                  <div className="relative h-2 w-full max-w-lg overflow-hidden rounded-full bg-white/25">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-emerald-200 to-white/60" style={{ width: `${chapterProgressPct}%` }} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span>{completedCount}/{lessons.length} lessons</span>
                    <span className="opacity-60">&bull;</span>
                    <span>
                      {totalCorrect}/{totalQuestions} correct
                      {totalQuestions ? ` (${questionAccuracyPct}% accuracy)` : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-4 text-sm text-white/85">
                {player?.iframeSrc && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90">Video preview available</span>
                )}
                {firstLessonSlug && (
                  <Link
                    href={`/lesson/${firstLessonSlug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-900/20 transition hover:shadow-xl hover:shadow-indigo-900/25"
                  >
                    Start chapter
                  </Link>
                )}
              </div>
            </div>
          </section>

          {player?.iframeSrc && (
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/80 p-2 shadow-2xl backdrop-blur">
              <div className="relative overflow-hidden rounded-[28px] bg-slate-950/90">
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    src={player.iframeSrc}
                    className="absolute inset-0 h-full w-full rounded-[28px]"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={chapterRow.title}
                  />
                  <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow">
                    <div className="text-xs uppercase tracking-[0.3em] text-white/70">Video preview</div>
                    <div className="text-lg font-semibold">{chapterRow.title}</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-[32px] border border-white/10 bg-white/85 p-8 shadow-xl backdrop-blur">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Lessons in this chapter</h2>
                <p className="text-sm text-slate-500">{completedCount} of {lessons.length} completed &bull; {formatCount(totalQuestions, 'question')} across the chapter.</p>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{questionCounts.size} lesson{questionCounts.size === 1 ? '' : 's'} with questions</span>
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
                    className={`group relative overflow-hidden rounded-[24px] border border-white/30 bg-white/80 p-5 shadow-lg ring-1 ring-transparent transition hover:-translate-y-1 hover:shadow-2xl ${completed ? 'ring-emerald-300/80' : 'hover:ring-indigo-300/80'}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500 opacity-60" />
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-indigo-500">
                      <span>Lesson {lesson.position + 1}</span>
                      {completed && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Completed</span>}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900 transition group-hover:text-indigo-600">{lesson.title}</h3>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span>{formatCount(totalQ, 'question')}</span>
                      {attempted > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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
    </div>
  );
}
