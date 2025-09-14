import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { questions, choices, userQuestionProgress, users } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
// XP awarding disabled while system is rebuilt

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const qid = Number(params.id);
  if (!Number.isFinite(qid)) return NextResponse.json({ error: 'invalid_question' }, { status: 400 });
  const body = await req.json().catch(()=>({}));
  const choiceId = Number(body?.choiceId);
  if (!Number.isFinite(choiceId)) return NextResponse.json({ error: 'invalid_choice' }, { status: 400 });
  try {
    const q = (await db.select({ id: questions.id, lessonId: questions.lessonId }).from(questions).where(eq(questions.id as any, qid)).limit(1))[0];
    if (!q) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const ch = (await db.select({ id: choices.id, correct: choices.correct }).from(choices).where(and(eq(choices.id as any, choiceId), eq(choices.questionId as any, qid))).limit(1))[0] as any;
    if (!ch) return NextResponse.json({ error: 'invalid_choice' }, { status: 400 });

    // Read previous state to decide XP grant
    const prev = (await db.select().from(userQuestionProgress).where(and(eq(userQuestionProgress.userId as any, userId), eq(userQuestionProgress.questionId as any, qid))).limit(1))[0] as any;
    // Upsert per-user per-question progress
    if (prev) {
      await db.update(userQuestionProgress).set({ choiceId, correct: !!ch.correct, answeredAt: new Date() as any }).where(eq(userQuestionProgress.id as any, prev.id));
    } else {
      await db.insert(userQuestionProgress).values({ userId, questionId: qid, choiceId, correct: !!ch.correct });
    }

    // XP removed — do not award XP
    return NextResponse.json({ ok: true, awardedXp: 0 });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}
