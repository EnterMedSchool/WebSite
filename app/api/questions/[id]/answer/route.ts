import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";
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
    let userId = await resolveUserIdFromSession();
    let isPremium = false;
    if (userId) {
      try { const ur = await sql`SELECT is_premium FROM users WHERE id=${userId} LIMIT 1`; isPremium = !!ur.rows[0]?.is_premium; } catch {}
    }

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
    const rewards: any[] = [];

    // Badge label maps
    const ANSWERED_BADGES: Record<number, string> = {
      100: "Question Taster — 100 questions answered.",
      500: "Question Devotee — 500 questions.",
      1000: "Question Centurion — 1,000 questions.",
      2500: "Deep Diver — 2,500 questions.",
      5000: "Question Maestro — 5,000 questions.",
      10000: "Deca‑Maestro — 10,000 questions.",
    };
    const ANSWERED_MILESTONES = Object.keys(ANSWERED_BADGES).map((k)=>Number(k)).sort((a,b)=>a-b);
    const STREAK_BADGES: Record<number, string> = {
      3: "Streak Spark — 3‑day streak.",
      7: "One‑Week Streak — 7 days.",
      14: "Two‑Week Flow — 14 days.",
      21: "Habit Formed — 21 days.",
      30: "Monthly Momentum — 30 days.",
      90: "Quarterly Rhythm — 90 days.",
      180: "Half‑Year Groove — 180 days.",
      365: "Year of Focus — 365 days.",
    };
    const STREAK_MILESTONES = Object.keys(STREAK_BADGES).map((k)=>Number(k)).sort((a,b)=>a-b);
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

    // Badge milestones for total correct answers (existing logic)
    try {
      if (totalCorrectAnswersInc > 0) {
        const cr = await sql`SELECT total_correct_answers FROM users WHERE id=${userId} LIMIT 1`;
        const totalCorrect = Number(cr.rows[0]?.total_correct_answers || 0);
        for (const m of [10, 25, 50, 100]) {
          if (totalCorrect === m) {
            const key = `correct_${m}`;
            const exists = await sql`SELECT 1 FROM lms_events WHERE user_id=${userId} AND action='reward' AND (payload->>'key')=${key} LIMIT 1`;
            if (exists.rows.length === 0) {
              try { await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                               VALUES (${userId}, 'user', ${userId}, 'reward', ${JSON.stringify({ type: 'badge', key, label: `${m} Questions Correct` })}::jsonb)`; } catch {}
              rewards.push({ type: 'badge', key, label: `${m} Questions Correct` });
            }
          }
        }
      }
    } catch {}

    // QBank volume badges for total answered (correct or not): retro-award any missing <= total
    try {
      const ar = await sql`SELECT COUNT(1)::int AS cnt FROM user_question_progress WHERE user_id=${userId}`;
      const answered = Number(ar.rows[0]?.cnt || 0);
      for (const m of ANSWERED_MILESTONES) {
        if (answered >= m) {
          const key = `answered_${m}`;
          const exists = await sql`SELECT 1 FROM lms_events WHERE user_id=${userId} AND action='reward' AND (payload->>'key')=${key} LIMIT 1`;
          if (exists.rows.length === 0) {
            const label = ANSWERED_BADGES[m] || `${m} Questions Answered`;
            try { await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                             VALUES (${userId}, 'user', ${userId}, 'reward', ${JSON.stringify({ type: 'badge', key, label })}::jsonb)`; } catch {}
            rewards.push({ type: 'badge', key, label });
          }
        }
      }
    } catch {}

    // Streak milestones: award when earning XP from this answer (first correct) and crossing thresholds
    try {
      if (awardedXp > 0) {
        const sr = await sql`SELECT created_at FROM lms_events WHERE user_id=${userId} AND action='xp_awarded' AND created_at > now() - interval '40 days' ORDER BY created_at DESC`;
        const days = Array.from(new Set(sr.rows.map((r:any) => new Date(r.created_at).toDateString())));
        let d = new Date(); d.setHours(0,0,0,0);
        let streakDays = 0;
        while (days.includes(d.toDateString())) { streakDays++; d = new Date(d.getTime() - 86400000); }
        for (const m of STREAK_MILESTONES) {
          if (streakDays >= m) {
            const key = `streak_${m}`;
            const exists = await sql`SELECT 1 FROM lms_events WHERE user_id=${userId} AND action='reward' AND (payload->>'key')=${key} LIMIT 1`;
            if (exists.rows.length === 0) {
              const label = STREAK_BADGES[m] || `${m}-day streak`;
              try { await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                               VALUES (${userId}, 'user', ${userId}, 'reward', ${JSON.stringify({ type: 'badge', key, label })}::jsonb)`; } catch {}
              rewards.push({ type: 'badge', key, label });
            }
          }
        }
      }
    } catch {}

    return NextResponse.json({ ok: true, correct: isCorrect, explanation: row.explanation, awardedXp, totalCorrectAnswersInc, newLevel, inLevel, span, pct, rewards });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}
