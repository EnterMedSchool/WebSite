import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons, lessonBlocks, courses } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const list = await db.select().from(lessons).where(eq(lessons.slug, slug));
  const lesson = list[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const blks = await db.select().from(lessonBlocks).where(eq(lessonBlocks.lessonId, lesson.id));
  blks.sort((a:any,b:any)=> (a.rankKey||'') < (b.rankKey||'') ? -1 : 1);
  const course = (await db.select().from(courses).where(eq(courses.id, lesson.courseId)))[0];
  return NextResponse.json({ lesson, course, blocks: blks });
}

