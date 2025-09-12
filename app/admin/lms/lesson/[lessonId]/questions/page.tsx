import { requireAdminEmail } from "@/lib/admin";
import { db, sql } from "@/lib/db";
import { lessons, courses, questions } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import { createQuestionAction, moveQuestionToLessonAction, reorderQuestionsAction, updateQuestionAction, deleteQuestionAction } from "../../../actions";
import DndList from "@/components/admin/DndList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function orderByRankThenId(rows: any[]) {
  return [...rows].sort((a, b) => {
    const ra = String(a.rank_key || a.rankKey || "");
    const rb = String(b.rank_key || b.rankKey || "");
    if (ra && rb && ra !== rb) return ra.localeCompare(rb);
    return Number(a.id) - Number(b.id);
  });
}

export default async function LessonQuestionsAdminPage({ params }: { params: { lessonId: string } }) {
  const admin = await requireAdminEmail();
  if (!admin) return <div className="p-6 text-red-600">Access denied.</div>;
  const lid = Number(params.lessonId);
  if (!Number.isFinite(lid)) return <div className="p-6">Bad lesson id.</div>;

  const l = (await db.select().from(lessons).where(eq(lessons.id as any, lid)).limit(1))[0] as any;
  if (!l) return <div className="p-6">Lesson not found.</div>;
  const course = (await db.select().from(courses).where(eq(courses.id as any, l.courseId)).limit(1))[0] as any;
  const qr = await sql`SELECT id, lesson_id, prompt, explanation, rank_key, access FROM questions WHERE lesson_id=${lid}`;
  const qs = orderByRankThenId(qr.rows as any[]);
  const otherLessons = await db
    .select({ id: lessons.id, title: lessons.title })
    .from(lessons)
    .where(eq(lessons.courseId as any, l.courseId))
    .orderBy(asc(lessons.title as any));

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 text-sm text-gray-600"><a href={`/admin/lms/${course.id}`} className="text-indigo-700 hover:underline">Back to course</a></div>
      <div className="text-xs text-gray-500">{course.slug} &middot; Lesson</div>
      <h1 className="text-2xl font-bold">{l.title}</h1>
      <div className="text-xs text-gray-600">{l.slug}</div>

      {/* Create question */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
        <form action={async (fd: FormData) => { "use server"; const p = String(fd.get("prompt")||""); await createQuestionAction(lid, p); }} className="flex items-end gap-2">
          <div className="grow">
            <label className="block text-xs text-gray-600">New question prompt</label>
            <input name="prompt" className="mt-1 w-full rounded-md border px-2 py-1 text-sm" placeholder="Type prompt text" required />
          </div>
          <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Add Question</button>
        </form>
      </div>

      {/* Questions list + DnD reorder */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-3">
        <div className="text-sm font-semibold text-gray-800">Questions</div>
        {/* DnD reorder */}
        {qs.length > 1 && (
          <form action={async (fd: FormData) => {
            "use server";
            const raw = String(fd.get("order") || "[]");
            let ids: number[] = [];
            try { ids = JSON.parse(raw); } catch {}
            if (Array.isArray(ids) && ids.length) await reorderQuestionsAction(lid, ids.map((n:any)=>Number(n)).filter((n)=>Number.isFinite(n)));
          }} className="mb-3">
            <DndList
              items={qs.map((q:any)=>({ id: q.id, label: q.prompt.slice(0, 80) + (q.prompt.length>80?'…':''), subtitle: q.rank_key || '' }))}
              inputName="order"
            />
            <div className="mt-3 text-right"><button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Save Order</button></div>
          </form>
        )}
        <ul className="mt-2 divide-y">
            {qs.map((q, idx) => (
              <li key={q.id} className="grid grid-cols-12 items-start gap-3 py-3">
                <div className="col-span-8">
                  <div className="text-xs text-gray-500">{q.rank_key || ""}</div>
                  <form action={async (fd: FormData) => { "use server"; await updateQuestionAction(q.id, { prompt: String(fd.get("prompt")||q.prompt) }); }} className="flex items-center gap-2">
                    <input name="prompt" defaultValue={q.prompt} className="w-full rounded-md border px-2 py-1 text-sm" />
                    <button className="rounded-md border px-2 py-1 text-xs">Save</button>
                  </form>
                  <form action={async (fd: FormData) => { "use server"; const exp = String(fd.get("explanation")||""); await updateQuestionAction(q.id, { explanation: exp }); }} className="mt-1">
                    <textarea name="explanation" defaultValue={q.explanation || ""} className="h-16 w-full rounded-md border px-2 py-1 text-xs" placeholder="Explanation (optional)" />
                    <div className="mt-1 text-right"><button className="rounded-md border px-2 py-1 text-xs">Save Explanation</button></div>
                  </form>
                </div>
                <div className="col-span-4">
                  <form action={async (fd: FormData) => { "use server"; const to = Number(fd.get("toLessonId")); if (Number.isFinite(to)&&to>0 && to!==lid) await moveQuestionToLessonAction(q.id, to); }} className="flex items-center gap-2">
                    <select name="toLessonId" className="w-full rounded-md border px-2 py-1 text-xs">
                      {otherLessons.filter((ol)=>ol.id!==lid).map((ol)=>(<option key={ol.id} value={ol.id}>{ol.title}</option>))}
                    </select>
                    <button className="rounded-md border px-2 py-1 text-xs">Move</button>
                  </form>
                  <form action={async () => { "use server"; await deleteQuestionAction(q.id); }} className="mt-2 text-right">
                    <button className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
      </div>
    </div>
  );
}
