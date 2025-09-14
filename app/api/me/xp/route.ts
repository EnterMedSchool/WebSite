import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Skeleton endpoint: returns empty XP data while system is rebuilt.
export async function GET() {
  const res = NextResponse.json({ recent: [], rewards: [], streakDays: 0 });
  res.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=86400');
  res.headers.set('Vary', 'Cookie');
  return res;
}
