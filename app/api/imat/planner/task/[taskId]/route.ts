import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUserId } from "@/lib/study/auth";
// XP awarding disabled while system is rebuilt

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { taskId: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized', code: 'NO_SESSION' }, { status: 401 });
  const id = Number(params.taskId);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const checked: boolean = !!body?.isCompleted;

  try {
    let progress: any = null;

    // 1) Update completion and timestamps
    await sql`UPDATE imat_user_plan_tasks
              SET is_completed=${checked},
                  completed_at=CASE WHEN ${checked} THEN COALESCE(completed_at, NOW()) ELSE completed_at END,
                  updated_at=NOW()
              WHERE id=${id} AND user_id=${userId}`;

    // XP disabled — no XP awarded
    return NextResponse.json({ ok: true, xpAwarded: 0, progress });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update task' }, { status: 500 });
  }
}
