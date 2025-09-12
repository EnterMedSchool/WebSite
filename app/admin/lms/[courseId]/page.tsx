import { requireAdminEmail } from "@/lib/admin";
import { db, sql } from "@/lib/db";
import { chapters, chapterLessons, courses, lessons } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  attachLessonToChapterAction,
  createChapterAction,
  createLessonAction,
  deleteChapterAction,
  detachLessonFromChapterAction,
  moveChapterAction,
  moveLessonBetweenChaptersAction,
  renameChapterAction,
  reorderChapterLessonsAction,
  reorderChaptersAction,
} from "../actions";
import DndList from "@/components/admin/DndList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ChapterItem = {
  id: number;
  slug: string;
  title: string;
  position: number;
  lessons: { id: number; slug: string; title: string; position: number }[];
};

async function loadCourse(courseId: number) {
  const c = (await db.select().from(courses).where(eq(courses.id as any, courseId)).limit(1))[0] as any;
  if (!c) return null;
  const chr = await db.select().from(chapters).where(eq(chapters.courseId as any, courseId)).orderBy(asc(chapters.position as any), asc(chapters.id as any));
  const chapterIds = chr.map((x) => Number(x.id));
  let lessonMap = new Map<number, { id: number; slug: string; title: string; position: number }[]>();
  if (chapterIds.length > 0) {
    const rows = await sql`SELECT cl.chapter_id, l.id, l.slug, l.title, cl.position
                           FROM chapter_lessons cl JOIN lessons l ON l.id = cl.lesson_id
                           WHERE cl.chapter_id = ANY(${chapterIds as any})
                           ORDER BY cl.chapter_id ASC, cl.position ASC, l.id ASC`;
    for (const r of rows.rows as any[]) {
      const arr = lessonMap.get(Number(r.chapter_id)) || [];
      arr.push({ id: Number(r.id), slug: String(r.slug), title: String(r.title), position: Number(r.position) });
      lessonMap.set(Number(r.chapter_id), arr);
    }
  }
  const chaptersShaped: ChapterItem[] = chr.map((ch) => ({ id: ch.id, slug: ch.slug, title: ch.title, position: ch.position, lessons: lessonMap.get(Number(ch.id)) || [] }));
  const allLessons = await db.select({ id: lessons.id, slug: lessons.slug, title: lessons.title }).from(lessons).where(eq(lessons.courseId as any, courseId)).orderBy(asc(lessons.title as any));
  return { course: c, chapters: chaptersShaped, allLessons };
}

export default async function AdminCourseLmsPage({ params }: { params: { courseId: string } }) {
  const admin = await requireAdminEmail();
  if (!admin) return <div className="p-6 text-red-600">Access denied.</div>;
  const cid = Number(params.courseId);
  if (!Number.isFinite(cid)) return <div className="p-6">Bad course id.</div>;
  const data = await loadCourse(cid);
  if (!data) return <div className="p-6">Course not found.</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">Course</div>
          <h1 className="text-2xl font-bold">{data.course.title}</h1>
          <div className="text-xs text-gray-600">{data.course.slug}</div>
        </div>
        <a href="/admin/lms" className="text-sm text-indigo-700 hover:underline">Back to courses</a>
      </div>

      {/* Add Chapter */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <form action={async (fd: FormData) => {
          "use server";
          const title = String(fd.get("title") || "");
          const slug = String(fd.get("slug") || "");
          await createChapterAction(cid, title, slug);
        }} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-600">New chapter title</label>
            <input name="title" className="mt-1 w-64 rounded-md border px-2 py-1 text-sm" placeholder="Title" required />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Slug (optional)</label>
            <input name="slug" className="mt-1 w-64 rounded-md border px-2 py-1 text-sm" placeholder="auto" />
          </div>
          <button type="submit" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Add Chapter</button>
        </form>
      </div>

      {/* Chapters list */}
      <div className="mt-6 space-y-6">
        {/* Drag-and-drop reorder chapters */}
        {data.chapters.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 text-sm font-semibold text-gray-800">Reorder chapters</div>
            <form action={async (fd: FormData) => {
              "use server";
              const raw = String(fd.get("order") || "[]");
              let ids: number[] = [];
              try { ids = JSON.parse(raw); } catch {}
              if (Array.isArray(ids) && ids.length) await reorderChaptersAction(cid, ids.map((n:any)=>Number(n)).filter((n)=>Number.isFinite(n)));
            }}>
              <DndList
                items={data.chapters.map((c)=>({ id: c.id, label: c.title, subtitle: c.slug }))}
                inputName="order"
              />
              <div className="mt-3 text-right">
                <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Save Order</button>
              </div>
            </form>
          </div>
        )}

        {data.chapters.map((ch, chIdx) => (
          <div key={ch.id} className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b p-3">
              <div>
                <div className="text-xs text-gray-500">#{ch.position} &middot; {ch.slug}</div>
                <div className="text-lg font-semibold">{ch.title}</div>
              </div>
              <div className="flex items-center gap-2">
                {/* Move up/down */}
                <form action={async () => { "use server"; await moveChapterAction(cid, ch.id, "up"); }}>
                  <button className="rounded-md border px-2 py-1 text-sm" disabled={chIdx === 0}>↑</button>
                </form>
                <form action={async () => { "use server"; await moveChapterAction(cid, ch.id, "down"); }}>
                  <button className="rounded-md border px-2 py-1 text-sm" disabled={chIdx === data.chapters.length - 1}>↓</button>
                </form>
                {/* Rename */}
                <form action={async (fd: FormData) => { "use server"; await renameChapterAction(ch.id, String(fd.get("title") || ch.title)); }} className="flex items-center gap-2">
                  <input name="title" defaultValue={ch.title} className="w-64 rounded-md border px-2 py-1 text-sm" />
                  <button className="rounded-md border px-2 py-1 text-sm">Rename</button>
                </form>
                {/* Delete */}
                <form action={async () => { "use server"; await deleteChapterAction(ch.id); }}>
                  <button className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-sm text-red-700">Delete</button>
                </form>
              </div>
            </div>

            {/* Lessons */}
            <div className="p-3">
              <div className="text-sm font-medium text-gray-700">Lessons in this chapter</div>
              <ul className="mt-2 divide-y">
                {ch.lessons.map((l, li) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">{l.slug}</div>
                      <div className="truncate text-sm font-semibold">{l.title}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Move within chapter */}
                      <form action={async () => { "use server"; const ids = ch.lessons.map((x) => x.id); if (li>0) { const tmp = ids[li-1]; ids[li-1]=ids[li]; ids[li]=tmp; await reorderChapterLessonsAction(ch.id, ids); } }}>
                        <button className="rounded-md border px-2 py-1 text-sm" disabled={li === 0}>↑</button>
                      </form>
                      <form action={async () => { "use server"; const ids = ch.lessons.map((x) => x.id); if (li<ids.length-1) { const tmp = ids[li+1]; ids[li+1]=ids[li]; ids[li]=tmp; await reorderChapterLessonsAction(ch.id, ids); } }}>
                        <button className="rounded-md border px-2 py-1 text-sm" disabled={li === ch.lessons.length - 1}>↓</button>
                      </form>
                      {/* Manage questions */}
                      <a className="rounded-md border px-2 py-1 text-sm text-indigo-700" href={`/admin/lms/lesson/${l.id}/questions`}>Questions</a>
                      {/* Detach */}
                      <form action={async () => { "use server"; await detachLessonFromChapterAction(ch.id, l.id); }}>
                        <button className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-sm text-amber-700">Remove</button>
                      </form>
                      {/* Move to another chapter */}
                      {data.chapters.length > 1 ? (
                        <form action={async (fd: FormData) => { "use server"; const toCh = Number(fd.get("to")); if (Number.isFinite(toCh) && toCh>0 && toCh!==ch.id) await moveLessonBetweenChaptersAction(l.id, ch.id, toCh); }} className="flex items-center gap-1 text-sm">
                          <select name="to" className="rounded-md border px-2 py-1 text-xs">
                            {data.chapters.filter((x) => x.id !== ch.id).map((x) => (<option key={x.id} value={x.id}>{x.title}</option>))}
                          </select>
                          <button className="rounded-md border px-2 py-1 text-sm">Move</button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>

              {/* DnD reorder lessons */}
              {ch.lessons.length > 1 && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 text-sm text-gray-800">Reorder lessons</div>
                  <form action={async (fd: FormData) => {
                    "use server";
                    const raw = String(fd.get("order") || "[]");
                    let ids: number[] = [];
                    try { ids = JSON.parse(raw); } catch {}
                    if (Array.isArray(ids) && ids.length) await reorderChapterLessonsAction(ch.id, ids.map((n:any)=>Number(n)).filter((n)=>Number.isFinite(n)));
                  }}>
                    <DndList
                      items={ch.lessons.map((l)=>({ id: l.id, label: l.title, subtitle: l.slug }))}
                      inputName="order"
                    />
                    <div className="mt-3 text-right">
                      <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Save Lesson Order</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Attach existing lesson */}
              <div className="mt-3">
                <form action={async (fd: FormData) => { "use server"; const lid = Number(fd.get("lessonId")); if (Number.isFinite(lid) && lid>0) await attachLessonToChapterAction(ch.id, lid); }} className="flex items-center gap-2">
                  <select name="lessonId" className="w-96 rounded-md border px-2 py-1 text-sm">
                    {data.allLessons.filter((l) => !ch.lessons.find((x)=>x.id===l.id)).map((l) => (
                      <option key={l.id} value={l.id}>{l.title} ({l.slug})</option>
                    ))}
                  </select>
                  <button className="rounded-md border px-2 py-1 text-sm">Attach Lesson</button>
                </form>
              </div>

              {/* Create new lesson and attach */}
              <div className="mt-3">
                <form action={async (fd: FormData) => { "use server"; const title = String(fd.get("title")||""); const slug = String(fd.get("slug")||""); const ins = await createLessonAction(cid, title, slug); if (ins?.id) await attachLessonToChapterAction(ch.id, ins.id); }} className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs text-gray-600">New lesson title</label>
                    <input name="title" className="mt-1 w-64 rounded-md border px-2 py-1 text-sm" placeholder="Title" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Slug (optional)</label>
                    <input name="slug" className="mt-1 w-64 rounded-md border px-2 py-1 text-sm" placeholder="auto" />
                  </div>
                  <button type="submit" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Create + Attach</button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Removed numeric batch reorder (replaced by DnD above) */}
    </div>
  );
}
