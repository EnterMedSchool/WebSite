import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons, questions, choices } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const lesson = (await db.select().from(lessons).where(eq(lessons.slug, params.slug)))[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const qs = await db.select().from(questions).where(eq(questions.lessonId, lesson.id));
  qs.sort((a:any,b:any)=> (a.rankKey||'') < (b.rankKey||'') ? -1 : 1);
  const result: any[] = [];
  for (const q of qs) {
    const ch = await db.select().from(choices).where(eq(choices.questionId, q.id));
    result.push({ id: q.id, prompt: q.prompt, explanation: q.explanation, choices: ch.map(c=>({ id: c.id, text: c.content, correct: c.correct })) });
  }
  // Note: For MVP we include correct flags; later we can hide until review
  return NextResponse.json({ questions: result });
}

