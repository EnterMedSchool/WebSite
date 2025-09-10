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
    // Aggregate per-day counts
    const q = await sql`SELECT day_number AS day, COUNT(*) AS total, SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) AS done
                        FROM imat_user_plan_tasks WHERE user_id=${userId}
                        GROUP BY day_number ORDER BY day_number`;
    const rows: any[] = q.rows.map((r: any) => ({ day: Number(r.day), total: Number(r.total), done: Number(r.done || 0) }));
    // Fill missing days with zeros to 60
    const totals: Record<number, { day: number; total: number; done: number }> = {} as any;
    rows.forEach((r) => (totals[r.day] = r));
    const days = Array.from({ length: 60 }, (_, i) => i + 1).map((d) => {
      const meta = IMAT_PLANNER.days.find((x) => x.day === d);
      const dev = getDevResources(d);
      const agg = totals[d] || { day: d, total: 0, done: 0 };
      return { day: d, title: meta?.title || `Day ${d}`, rest: meta?.rest, total: agg.total, done: agg.done, videos: meta?.videos || dev.videos, lessons: meta?.lessons || dev.lessons, chapters: meta?.chapters || dev.chapters };
    });
    // Basic ETag from max updated_at of user's tasks (optional; clients can use If-None-Match)
    const et = await sql`SELECT MAX(updated_at) AS m FROM imat_user_plan_tasks WHERE user_id=${userId}`;
    const etag = et?.rows?.[0]?.m ? String(new Date(et.rows[0].m).getTime()) : String(plan?.updatedAt || 0);
    return NextResponse.json({ data: { plan, days }, etag }, { headers: { ETag: etag } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}

