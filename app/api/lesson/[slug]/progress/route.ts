import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons, userLessonProgress, lmsEvents } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const body = await req.json().catch(()=>({}));
  const progress = Math.max(0, Math.min(100, Number(body.progress || 0)));
  const completed = !!body.completed || progress === 100;
  // MVP: no auth hook — we can use 0 as demo user or anonymous
  const userId = 0;
  const lesson = (await db.select().from(lessons).where(eq(lessons.slug, params.slug)))[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = (await db.select().from(userLessonProgress).where(and(eq(userLessonProgress.userId, userId), eq(userLessonProgress.lessonId, lesson.id))))[0];
  if (existing) {
    await db.update(userLessonProgress).set({ progress, completed, lastViewedAt: new Date() }).where(eq(userLessonProgress.id, existing.id));
  } else {
    await db.insert(userLessonProgress).values({ userId, lessonId: lesson.id, progress, completed });
  }
  if (completed) {
    await db.insert(lmsEvents).values({ userId, subjectType: 'lesson', subjectId: lesson.id, action: 'completed', payload: { progress } });
  }
  return NextResponse.json({ ok: true });
}

