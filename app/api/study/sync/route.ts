import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SyncPayload = {
  course_id: number;
  idempotency_key?: string;
  client_ts?: string | number;
  lessons_completed?: [number, string | number][];
  lessons_incomplete?: [number, string | number][];
  question_status?: [number, 'correct' | 'incorrect', string | number][];
  xp_delta?: { lessons?: number; correct?: number; attempted?: number; other?: number };
  version?: number;
};

function toTs(v: any): string | null {
  if (!v) return null;
  const n = Number(v);
  if (Number.isFinite(n) && n > 0) return new Date(n).toISOString();
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const body: SyncPayload = await req.json().catch(() => ({} as any));
  const courseId = Number(body?.course_id || 0);
  if (!courseId) return NextResponse.json({ error: 'invalid_course' }, { status: 400 });

  const lessons = Array.isArray(body.lessons_completed) ? body.lessons_completed : [];
  const lessonsUndo = Array.isArray(body.lessons_incomplete) ? body.lessons_incomplete : [];
  const qstats = Array.isArray(body.question_status) ? body.question_status : [];
  const xpDelta = body.xp_delta || {};
  const version = Number(body.version || 1);

  // Load existing compact snapshot
  const existing = await sql`SELECT data, xp_total, version FROM user_course_progress_compact WHERE user_id=${userId} AND course_id=${courseId} LIMIT 1`;
  const row = existing.rows[0];
  const data = (row?.data || {}) as any;
  if (!data.lessons) data.lessons = {};
  if (!data.questions) data.questions = {};

  // Merge lessons (last-write-wins by timestamp)
  for (const [lidRaw, tsRaw] of lessons) {
    const lid = Number(lidRaw);
    if (!Number.isFinite(lid)) continue;
    const ts = toTs(tsRaw) || new Date().toISOString();
    const current = data.lessons[lid];
    if (!current || !current.completed_at || new Date(ts) > new Date(current.completed_at)) {
      data.lessons[lid] = { completed_at: ts };
    }
  }

  // Process lesson undo (remove when newer than existing)
  for (const [lidRaw, tsRaw] of lessonsUndo) {
    const lid = Number(lidRaw);
    if (!Number.isFinite(lid)) continue;
    const ts = toTs(tsRaw) || new Date().toISOString();
    const current = data.lessons[lid];
    if (!current || !current.completed_at || new Date(ts) >= new Date(current.completed_at)) {
      delete data.lessons[lid];
    }
  }

  // Merge question statuses (last-write-wins by timestamp)
  for (const [qidRaw, status, tsRaw] of qstats) {
    const qid = Number(qidRaw);
    if (!Number.isFinite(qid)) continue;
    const ts = toTs(tsRaw) || new Date().toISOString();
    const current = data.questions[qid];
    if (!current || !current.updated_at || new Date(ts) > new Date(current.updated_at)) {
      data.questions[qid] = { status, updated_at: ts };
    }
  }

  const newXp = Number(row?.xp_total || 0)
    + Number(xpDelta.lessons || 0)
    + Number(xpDelta.correct || 0)
    + Number(xpDelta.attempted || 0)
    + Number(xpDelta.other || 0);

  // Upsert snapshot
  await sql`INSERT INTO user_course_progress_compact (user_id, course_id, data, xp_total, version)
            VALUES (${userId}, ${courseId}, ${JSON.stringify(data)}::jsonb, ${newXp}, ${version})
            ON CONFLICT (user_id, course_id)
            DO UPDATE SET data=EXCLUDED.data, xp_total=EXCLUDED.xp_total, version=EXCLUDED.version, updated_at=NOW()`;

  return NextResponse.json({ ok: true, xpTotal: newXp, version, etag: `v${version}-${Date.now()}` });
}
