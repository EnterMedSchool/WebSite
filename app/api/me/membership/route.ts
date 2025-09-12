export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";

function allowToggle(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_MEMBERSHIP_TOGGLE === "1";
}

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const ur = await sql`SELECT id, email, is_premium FROM users WHERE id=${userId} LIMIT 1`;
    const u = ur.rows[0] || {} as any;
    const pr = await sql`SELECT id, start_date, current_day FROM imat_user_plan WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 1`;
    const plan = pr.rows[0] || null;

    return NextResponse.json({
      userId,
      email: u?.email || null,
      isPremium: !!u?.is_premium,
      hasImat: !!plan,
      imat: plan ? { id: Number(plan.id), startDate: plan.start_date, currentDay: plan.current_day } : null,
      canToggle: allowToggle(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!allowToggle()) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const { premium, grantImat, revokeImat } = body || {};

    if (typeof premium === "boolean") {
      await sql`UPDATE users SET is_premium=${premium} WHERE id=${userId}`;
    }
    if (grantImat) {
      const r = await sql`SELECT id FROM imat_user_plan WHERE user_id=${userId} LIMIT 1`;
      if (!r.rows[0]?.id) {
        await sql`INSERT INTO imat_user_plan (user_id, start_date, current_day) VALUES (${userId}, now(), 1)`;
      }
    }
    if (revokeImat) {
      await sql`DELETE FROM imat_user_plan WHERE user_id=${userId}`;
    }

    return await GET();
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

