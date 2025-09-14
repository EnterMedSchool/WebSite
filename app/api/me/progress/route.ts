import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";
import { xpToNext, levelFromXp, MAX_LEVEL, GOAL_XP } from "@/lib/xp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    const email = String((session as any)?.user?.email || "").toLowerCase();
    let userId = 0;
    if (email) {
      const ur = await sql`SELECT id, xp, level FROM users WHERE lower(email)=${email} LIMIT 1`;
      if (ur.rows[0]?.id) {
        userId = Number(ur.rows[0].id);
        const xp = Number(ur.rows[0].xp || 0);
        const level = Math.max(1, Math.min(levelFromXp(xp), MAX_LEVEL));
        if (level >= MAX_LEVEL) {
          return NextResponse.json({ level: MAX_LEVEL, xp, pct: 100, inLevel: 0, span: 1, isMax: true });
        }
        const { toNext, nextLevelGoal } = xpToNext(xp);
        const start = GOAL_XP[level - 1];
        const span = Math.max(1, nextLevelGoal - start);
        const inLevel = Math.max(0, Math.min(span, span - toNext));
        const pct = Math.round((inLevel / span) * 100);
        return NextResponse.json({ level, xp, pct, inLevel, span, isMax: false });
      }
    }
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  } catch (e:any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message||e) }, { status: 500 });
  }
}
