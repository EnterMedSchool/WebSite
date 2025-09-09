import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const key = process.env.LEADERBOARD_CRON_SECRET;
  const hdr = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("key");
  if (!key || hdr !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    try {
      await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_weekly_xp`;
    } catch (e) {
      // Fallback if concurrently not available (first build or lock issue)
      await sql`REFRESH MATERIALIZED VIEW leaderboard_weekly_xp`;
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "refresh_failed", message: String(err?.message || err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Allow GET for easy manual trigger in staging
  return POST(req);
}

