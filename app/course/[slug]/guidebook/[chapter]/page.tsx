import { sql } from "@/lib/db";
import { authGetServerSession } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ChapterGuidebookPage({ params }: { params: { slug: string; chapter: string } }) {
  // Load course and chapter
  const cr = await sql`SELECT id, slug, title FROM courses WHERE slug=${params.slug} LIMIT 1`;
  const course = cr.rows[0];
  if (!course) return <div className="mx-auto max-w-5xl p-6">Course not found.</div>;
  const chR = await sql`SELECT id, slug, title, description, position FROM chapters WHERE course_id=${course.id} AND slug=${params.chapter} LIMIT 1`;
  const chapter = chR.rows[0];
  if (!chapter) return <div className="mx-auto max-w-5xl p-6">Chapter not found.</div>;

  // Lessons within chapter
  const lr = await sql`
    SELECT l.id, l.slug, l.title, COALESCE(l.length_min, l.duration_min) as length_min, cl.position
    FROM chapter_lessons cl JOIN lessons l ON l.id=cl.lesson_id
    WHERE cl.chapter_id=${chapter.id}
    ORDER BY cl.position ASC, l.id ASC`;

  // Progress for authed user
  let pct: number | null = null;
  let completedCnt = 0; let totalCnt = Number(lr.rows.length || 0);
  let nextSlug: string | null = null;
  try {
    const session = await authGetServerSession();
    let userId = session && (session as any).userId ? Number((session as any).userId) : 0;
    if (Number.isFinite(userId) && userId > 0) {
      const cr = await sql`SELECT lesson_id FROM user_lesson_progress WHERE user_id=${userId} AND completed=true AND lesson_id = ANY(${lr.rows.map((r:any)=> Number(r.id))})`;
      const done = new Set<number>(cr.rows.map((r:any)=> Number(r.lesson_id)));
      completedCnt = Array.from(done).length;
      pct = totalCnt ? Math.round((completedCnt / totalCnt) * 100) : 0;
      const ordered = lr.rows as any[];
      const next = ordered.find((r:any)=> !done.has(Number(r.id)));
      nextSlug = next?.slug || null;
    }
  } catch {}

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 text-sm text-indigo-700"><Link href={`/course/${course.slug}`} className="hover:underline">← Back to course</Link></div>
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow ring-1 ring-indigo-900/20">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/80">Guidebook</div>
        <h1 className="mt-1 text-2xl font-extrabold">{chapter.title}</h1>
        {chapter.description ? <p className="mt-1 text-sm text-white/90">{chapter.description}</p> : null}
        <div className="mt-3 flex items-center gap-3 text-sm">
          {pct != null ? (
            <>
              <span className="rounded-full bg-white/15 px-3 py-1 text-white/90">{completedCnt}/{totalCnt} lessons</span>
              {pct === 100 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-3 py-1 text-white shadow">🎁 Chapter chest claimed</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-white/90">Complete all lessons to unlock 🎁</span>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-slate-700">Progress</div>
          {pct != null && (
            <div className="text-xs font-semibold text-indigo-700">{pct}%</div>
          )}
        </div>
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" style={{ width: `${pct ?? 0}%` }} />
        </div>
        {nextSlug && (
          <Link href={`/lesson/${nextSlug}`} className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700">Continue chapter</Link>
        )}
      </div>

      <div className="mt-2 grid gap-3">
        {lr.rows.map((l: any) => (
          <Link key={l.id} href={`/lesson/${l.slug}`} className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm ring-1 ring-black/5 hover:bg-indigo-50">
            <div className="text-xs font-semibold text-indigo-700">Lesson {l.position}</div>
            <div className="font-semibold text-slate-900">{l.title}</div>
            <div className="text-[11px] text-slate-500">{l.length_min ? `${l.length_min} min` : 'Lesson'}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
