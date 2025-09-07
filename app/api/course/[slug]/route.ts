import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses, lessons } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const course = (await db.select().from(courses).where(eq(courses.slug, slug)))[0];
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const list = await db.select().from(lessons).where(eq(lessons.courseId, course.id));
  list.sort((a:any,b:any)=> (a.rankKey||'') < (b.rankKey||'') ? -1 : 1);
  return NextResponse.json({ course, lessons: list });
}

