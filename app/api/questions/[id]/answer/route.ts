import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { questions, choices, userQuestionProgress, users } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { levelFromXp, xpToNext, GOAL_XP, MAX_LEVEL } from "@/lib/xp";

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

    // XP logic: award only on first time correct
    let awardedXp = 0;
    let progress: any = null;
    const justBecameCorrect = !!ch.correct && !(prev && prev.correct === true);
    if (justBecameCorrect) {
      const DAILY_TOTAL_XP_CAP = Math.max(0, Number(process.env.XP_DAILY_CAP_TOTAL || 600));
      const DAILY_QUIZ_XP_CAP = Math.max(0, Number(process.env.XP_DAILY_CAP_QUIZ || 400));
      const BASE_ADD = Math.max(0, Number(process.env.XP_QUIZ_CORRECT_XP || 2));
      let todayTotal = 0, todayQuiz = 0;
      try {
        const r1 = await sql`SELECT COALESCE(SUM((payload->>'amount')::int),0) AS sum FROM lms_events WHERE user_id=${userId} AND action='xp_awarded' AND created_at >= date_trunc('day', now())`;
        todayTotal = Number(r1.rows?.[0]?.sum || 0);
      } catch {}
      try {
        const r2 = await sql`SELECT COALESCE(SUM((payload->>'amount')::int),0) AS sum FROM lms_events WHERE user_id=${userId} AND action='xp_awarded' AND subject_type='quiz' AND created_at >= date_trunc('day', now())`;
        todayQuiz = Number(r2.rows?.[0]?.sum || 0);
      } catch {}
      const remTotal = DAILY_TOTAL_XP_CAP > 0 ? Math.max(0, DAILY_TOTAL_XP_CAP - todayTotal) : BASE_ADD;
      const remQuiz = DAILY_QUIZ_XP_CAP > 0 ? Math.max(0, DAILY_QUIZ_XP_CAP - todayQuiz) : BASE_ADD;
      const grant = Math.max(0, Math.min(BASE_ADD, remTotal, remQuiz));
      if (grant > 0) {
        const ur = await sql`SELECT xp, level FROM users WHERE id=${userId} LIMIT 1`;
        const currXp = Number(ur.rows?.[0]?.xp || 0);
        const nextXp = currXp + grant;
        const newLevel = levelFromXp(nextXp);
        await sql`UPDATE users SET xp=${nextXp}, level=${newLevel} WHERE id=${userId}`;
        await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                  VALUES (${userId}, 'quiz', ${qid}, 'xp_awarded', ${JSON.stringify({ amount: grant, totalXp: nextXp })}::jsonb)`;
        if (newLevel >= MAX_LEVEL) {
          progress = { level: MAX_LEVEL, pct: 100, inLevel: 0, span: 1 };
        } else {
          const start = GOAL_XP[newLevel - 1];
          const { toNext, nextLevelGoal } = xpToNext(nextXp);
          const span = Math.max(1, nextLevelGoal - start);
          const inLevel = Math.max(0, Math.min(span, span - toNext));
          const pct = Math.round((inLevel / span) * 100);
          progress = { level: newLevel, pct, inLevel, span };
        }
        awardedXp = grant;
      } else {
        // cap reached: return signal to client
        return NextResponse.json({ ok: true, awardedXp: 0, capReached: true });
      }
    }

    return NextResponse.json({ ok: true, awardedXp, ...(progress || {}) });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}

