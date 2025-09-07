import Link from "next/link";
import { db } from "@/lib/db";
import { courses, lessons } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = (await db.select().from(courses).where(eq(courses.slug, params.slug)))[0];
  if (!course) return <div className="mx-auto max-w-5xl p-6">Course not found.</div>;
  const list = await db.select().from(lessons).where(eq(lessons.courseId, course.id));
  list.sort((a:any,b:any)=> (a.rankKey||'') < (b.rankKey||'') ? -1 : 1);
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">{course.title}</h1>
      <p className="mt-1 text-gray-600">{course.description}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((l:any)=> (
          <Link href={`/lesson/${l.slug}`} key={l.id} className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5 hover:shadow-md">
            <div className="text-sm font-semibold text-indigo-700">Lesson</div>
            <div className="mt-1 line-clamp-2 font-medium">{l.title}</div>
            <div className="mt-2 text-xs text-gray-500">Order: {l.rankKey || '-'}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

