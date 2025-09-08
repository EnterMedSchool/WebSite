import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { levelFromXp, MAX_LEVEL, GOAL_XP } from "@/lib/xp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const qid = Number(params.id);
    if (!Number.isFinite(qid)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    const body = await req.json().catch(()=>({}));
    const choiceId = Number((body as any).choiceId);
    if (!Number.isFinite(choiceId)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

    const qr = await sql`SELECT q.id, q.lesson_id, q.access, q.explanation, c.id AS cid, c.correct
                         FROM questions q JOIN choices c ON c.question_id=q.id
                         WHERE q.id=${qid} AND c.id=${choiceId}
                         LIMIT 1`;
    if (qr.rows.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const row = qr.rows[0];
    const isCorrect = !!row.correct;

    // Resolve user
    let userId = 0;
    let isPremium = false;
    try {
      const session = await getServerSession(authOptions as any);
      if (session) {
        userId = Number((session as any).userId || 0);
        if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) userId = 0;
        if (!userId && (session as any)?.user?.email) {
          const email = String((session as any).user.email).toLowerCase();
          const ur = await sql`SELECT id, is_premium FROM users WHERE email=${email} LIMIT 1`;
          if (ur.rows[0]?.id) {
            userId = Number(ur.rows[0].id);
            isPremium = !!ur.rows[0].is_premium;
          }
        } else if (userId) {
          const ur = await sql`SELECT is_premium FROM users WHERE id=${userId} LIMIT 1`;
          isPremium = !!ur.rows[0]?.is_premium;
        }
      }
    } catch {}

    // Access gating
    const access = String(row.access || 'public');
    const authed = userId > 0;
    const accessDenied = (
      (access === 'auth' && !authed) ||
      (access === 'guest' && authed) ||
      (access === 'premium' && (!authed || !isPremium))
    );
    if (accessDenied) {
      return NextResponse.json({ ok: true, correct: isCorrect, gated: true, explanation: row.explanation });
    }

    // If not authenticated, don't persist/award
    if (!authed) {
      return NextResponse.json({ ok: true, correct: isCorrect, explanation: row.explanation });
    }

    // Persist user's answer, including incorrect attempts. Award XP only on first correct.
    const existing = await sql`SELECT correct FROM user_question_progress WHERE user_id=${userId} AND question_id=${qid} LIMIT 1`;
    let awardedXp = 0;
    let totalCorrectAnswersInc = 0;
    if (existing.rows.length === 0) {
      await sql`INSERT INTO user_question_progress (user_id, question_id, choice_id, correct) VALUES (${userId}, ${qid}, ${choiceId}, ${isCorrect})`;
      if (isCorrect) {
        const ur = await sql`SELECT xp, level, total_correct_answers FROM users WHERE id=${userId} LIMIT 1`;
        const currXp = Number(ur.rows[0]?.xp || 0);
        const currLevel = Number(ur.rows[0]?.level || 1);
        const add = 5;
        const nextXp = currXp + add;
        const newLevel = levelFromXp(nextXp);
        await sql`UPDATE users SET xp=${nextXp}, level=${newLevel}, total_correct_answers=${Number(ur.rows[0]?.total_correct_answers || 0) + 1} WHERE id=${userId}`;
        awardedXp = add;
        totalCorrectAnswersInc = 1;
        try {
          await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                    VALUES (${userId}, 'question', ${qid}, 'xp_awarded', ${JSON.stringify({ amount: add, totalXp: nextXp })}::jsonb)`;
        } catch {}
        try {
          await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                    VALUES (${userId}, 'question', ${qid}, 'correct', ${JSON.stringify({ choiceId })}::jsonb)`;
        } catch {}
      } else {
        try {
          await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                    VALUES (${userId}, 'question', ${qid}, 'incorrect', ${JSON.stringify({ choiceId })}::jsonb)`;
        } catch {}
      }
    } else {
      const wasCorrect = !!existing.rows[0].correct;
      await sql`UPDATE user_question_progress SET choice_id=${choiceId}, correct=${isCorrect || wasCorrect}, answered_at=now() WHERE user_id=${userId} AND question_id=${qid}`;
      if (isCorrect && !wasCorrect) {
        const ur = await sql`SELECT xp, level, total_correct_answers FROM users WHERE id=${userId} LIMIT 1`;
        const currXp = Number(ur.rows[0]?.xp || 0);
        const currLevel = Number(ur.rows[0]?.level || 1);
        const add = 5;
        const nextXp = currXp + add;
        const newLevel = levelFromXp(nextXp);
        await sql`UPDATE users SET xp=${nextXp}, level=${newLevel}, total_correct_answers=${Number(ur.rows[0]?.total_correct_answers || 0) + 1} WHERE id=${userId}`;
        awardedXp = add;
        totalCorrectAnswersInc = 1;
        try {
          await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                    VALUES (${userId}, 'question', ${qid}, 'xp_awarded', ${JSON.stringify({ amount: add, totalXp: nextXp })}::jsonb)`;
        } catch {}
        try {
          await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                    VALUES (${userId}, 'question', ${qid}, 'correct', ${JSON.stringify({ choiceId })}::jsonb)`;
        } catch {}
      } else if (!isCorrect) {
        try { await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                        VALUES (${userId}, 'question', ${qid}, 'incorrect', ${JSON.stringify({ choiceId })}::jsonb)`; } catch {}
      }
    }

    // Include updated XP progress in response when authenticated
    let newLevel: number | null = null;
    let inLevel: number | null = null;
    let span: number | null = null;
    let pct: number | null = null;
    try {
      const ur2 = await sql`SELECT xp, level FROM users WHERE id=${userId} LIMIT 1`;
      const newXp = Number(ur2.rows[0]?.xp || 0);
      const lvl = Math.max(1, Math.min(levelFromXp(newXp), MAX_LEVEL));
      const start = GOAL_XP[lvl - 1] ?? 0;
      const nextGoal = GOAL_XP[Math.min(GOAL_XP.length - 1, lvl)] ?? start + 1;
      const sp = Math.max(1, nextGoal - start);
      const inL = Math.max(0, Math.min(sp, newXp - start));
      newLevel = lvl; inLevel = inL; span = sp; pct = Math.round((inL / sp) * 100);
    } catch {}

    return NextResponse.json({ ok: true, correct: isCorrect, explanation: row.explanation, awardedXp, totalCorrectAnswersInc, newLevel, inLevel, span, pct });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}
