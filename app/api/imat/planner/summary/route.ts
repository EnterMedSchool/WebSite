import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { imatUserPlan } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { IMAT_PLANNER, getDevResources } from "@/lib/imat/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  try {
    const plan = (await db.select().from(imatUserPlan).where(eq(imatUserPlan.userId as any, userId)).limit(1))[0] || null;
    // Compute ETag from rollups first, fallback to tasks
    const et1 = await sql`SELECT MAX(updated_at) AS m FROM imat_user_day_rollups WHERE user_id=${userId}`;
    const et2 = await sql`SELECT MAX(updated_at) AS m FROM imat_user_plan_tasks WHERE user_id=${userId}`;
    const maxTs = (et1.rows[0]?.m as any) || (et2.rows[0]?.m as any) || plan?.updatedAt || null;
    const latest = maxTs ? String(new Date(maxTs).getTime()) : '';
    const inm = (req.headers.get('if-none-match') || '').replace(/^W\//, '').trim();
    if (inm && latest && inm === latest) {
      return new NextResponse(null, { status: 304, headers: { ETag: latest } });
    }

    // Prefer rollups; fallback to GROUP BY if rollups not present
    let rows: any[] = [];
    const qr = await sql`SELECT day_number AS day, total, done FROM imat_user_day_rollups WHERE user_id=${userId} ORDER BY day_number`;
    if (qr.rowCount && qr.rowCount > 0) {
      rows = qr.rows.map((r:any)=> ({ day: Number(r.day), total: Number(r.total||0), done: Number(r.done||0) }));
    } else {
      const q = await sql`SELECT day_number AS day, COUNT(*) AS total, SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) AS done
                          FROM imat_user_plan_tasks WHERE user_id=${userId}
                          GROUP BY day_number ORDER BY day_number`;
      rows = q.rows.map((r: any) => ({ day: Number(r.day), total: Number(r.total), done: Number(r.done || 0) }));
    }
    // Fill missing days with zeros to 60
    const totals: Record<number, { day: number; total: number; done: number }> = {} as any;
    rows.forEach((r) => (totals[r.day] = r));
    const days = Array.from({ length: 60 }, (_, i) => i + 1).map((d) => {
      const meta = IMAT_PLANNER.days.find((x) => x.day === d);
      const dev = getDevResources(d);
      const agg = totals[d] || { day: d, total: 0, done: 0 };
      return { day: d, title: meta?.title || `Day ${d}`, rest: meta?.rest, total: agg.total, done: agg.done, videos: meta?.videos || dev.videos, lessons: meta?.lessons || dev.lessons, chapters: meta?.chapters || dev.chapters };
    });
    // Return with ETag header
    return NextResponse.json({ data: { plan, days }, etag: latest }, { headers: { ETag: latest } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}
