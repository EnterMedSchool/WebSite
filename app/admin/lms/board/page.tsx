import { requireAdminEmail } from "@/lib/admin";
import { db, sql } from "@/lib/db";
import { courses, chapters, lessons } from "@/drizzle/schema";
import { asc, eq } from "drizzle-orm";
import CoursesBoard from "@/components/admin/CoursesBoard";
import { moveLessonToCourseAndChapterAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LessonLite = { id: number; slug: string; title: string };
type ChapterLite = { id: number; title: string; slug: string; lessons: LessonLite[] };
type CourseLite = { id: number; title: string; slug: string; chapters: ChapterLite[]; unassigned: LessonLite[] };

async function loadCourse(courseId: number): Promise<CourseLite | null> {
  const c = (await db.select().from(courses).where(eq(courses.id as any, courseId)).limit(1))[0] as any;
  if (!c) return null;
  const chr = await db.select().from(chapters).where(eq(chapters.courseId as any, courseId)).orderBy(asc(chapters.position as any), asc(chapters.id as any));
  const chapterIds = chr.map((x) => Number(x.id));
  const map = new Map<number, LessonLite[]>();
  if (chapterIds.length) {
    const lr = await sql`SELECT cl.chapter_id, l.id, l.slug, l.title, cl.position
                         FROM chapter_lessons cl JOIN lessons l ON l.id = cl.lesson_id
                         WHERE cl.chapter_id = ANY(${chapterIds as any})
                         ORDER BY cl.chapter_id ASC, cl.position ASC, l.id ASC`;
    for (const r of lr.rows as any[]) {
      const arr = map.get(Number(r.chapter_id)) || [];
      arr.push({ id: Number(r.id), slug: String(r.slug), title: String(r.title) });
      map.set(Number(r.chapter_id), arr);
    }
  }
  const chaptersShaped: ChapterLite[] = chr.map((ch) => ({ id: ch.id, slug: ch.slug, title: ch.title, lessons: map.get(Number(ch.id)) || [] }));
  const allLessons = await db.select({ id: lessons.id, slug: lessons.slug, title: lessons.title }).from(lessons).where(eq(lessons.courseId as any, courseId));
  const used = new Set<number>(); chaptersShaped.forEach((ch)=>ch.lessons.forEach((l)=>used.add(l.id)));
  const unassigned = allLessons.filter((l)=>!used.has(l.id)).map((l)=>({ id: l.id as any, slug: String(l.slug), title: String(l.title) }));
  return { id: c.id, slug: c.slug, title: c.title, chapters: chaptersShaped, unassigned };
}

export default async function AdminLmsBoardPage({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const admin = await requireAdminEmail();
  if (!admin) return <div className="p-6 text-red-600">Access denied.</div>;

  const list = await db.select().from(courses).orderBy(asc(courses.title as any));
  const cids: number[] = [];
  const parseIds = (v?: string | string[]) => (Array.isArray(v) ? v.join(',') : (v || '')).split(',').map((s)=>Number(s)).filter((n)=>Number.isFinite(n) && n>0);
  const qs = parseIds(searchParams.courses || (searchParams.c as any) || `${list[0]?.id || ''},${list[1]?.id || ''}`);
  cids.push(...qs.slice(0, 3));
  const data = (await Promise.all(cids.map((id)=>loadCourse(id)))).filter(Boolean) as CourseLite[];

  async function move(formData: FormData) {
    "use server";
    const lessonId = Number(formData.get('lessonId'));
    const toCourseId = Number(formData.get('toCourseId'));
    const toChapterIdRaw = formData.get('toChapterId');
    const toChapterId = toChapterIdRaw ? Number(toChapterIdRaw) : null;
    if (!Number.isFinite(lessonId) || !Number.isFinite(toCourseId)) return;
    await moveLessonToCourseAndChapterAction(lessonId, toCourseId, toChapterId ?? undefined);
  }

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">LMS Board — Move Lessons Across Courses</h1>
          <div className="text-xs text-gray-600">Drag lessons between courses/chapters. Save happens instantly on drop.</div>
        </div>
        <a href="/admin/lms" className="text-sm text-indigo-700 hover:underline">Back</a>
      </div>

      {/* Course pickers */}
      <form method="get" className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-3">
        {[0,1,2].map((i)=> (
          <div key={i}>
            <label className="block text-xs text-gray-600">Course {i+1}</label>
            <select name="courses" className="mt-1 w-64 rounded-md border px-2 py-1 text-sm" defaultValue={cids[i] || ''}>
              <option value="">(none)</option>
              {list.map((c)=> (<option key={c.id} value={c.id as any}>{c.title}</option>))}
            </select>
          </div>
        ))}
        <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Open</button>
      </form>

      {data.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700">Select 2–3 courses above.</div>
      ) : (
        <CoursesBoard courses={data} moveAction={move} />
      )}
    </div>
  );
}

