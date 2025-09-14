import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function whenLabel(d: Date) {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    let userId = session && (session as any).userId ? Number((session as any).userId) : 0;
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) {
      // fallback by email when using provider
      if ((session as any)?.user?.email) {
        const email = String((session as any).user.email).toLowerCase();
        const ur = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
        if (ur.rows[0]?.id) userId = Number(ur.rows[0].id);
      }
    }
    if (!userId) {
      const res = NextResponse.json({ recent: [], rewards: [], streakDays: 0 });
      res.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=86400');
      res.headers.set('Vary', 'Cookie');
      return res;
    }

    // Recent XP events
    const xr = await sql`SELECT payload, created_at FROM lms_events WHERE user_id=${userId} AND action='xp_awarded' ORDER BY created_at DESC LIMIT 12`;
    const recent = xr.rows.map((r: any) => {
      const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload || {};
      const when = new Date(r.created_at as string);
      const amount = Number(p.amount || 0);
      const what = p.subject || (amount ? `${amount} XP` : 'XP');
      return { when: whenLabel(when), what, amount };
    });

    // Rewards inventory (dedupe by key keeping latest)
    const rr = await sql`SELECT payload, created_at FROM lms_events WHERE user_id=${userId} AND action='reward' ORDER BY created_at DESC LIMIT 50`;
    const seen = new Set<string>();
    const rewards: { key: string; type: string; label: string; earnedAt: string }[] = [];
    for (const r of rr.rows) {
      const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload || {};
      const key = String(p.key || `${p.type}:${p.label}`);
      if (seen.has(key)) continue;
      seen.add(key);
      rewards.push({ key, type: String(p.type || 'badge'), label: String(p.label || 'Reward'), earnedAt: new Date(r.created_at as string).toISOString() });
    }

    // Streak: count consecutive days with any xp_awarded event
    let streakDays = 0;
    try {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const sr = await sql`SELECT DATE(created_at) AS d FROM lms_events WHERE user_id=${userId} AND action='xp_awarded' AND created_at >= ${since.toISOString()} GROUP BY DATE(created_at) ORDER BY d DESC`;
      const days = sr.rows.map((r:any)=> new Date(r.d as string));
      let cursor = new Date(); cursor.setHours(0,0,0,0);
      for (;;) {
        const has = days.find((d)=> d.getTime() === cursor.getTime());
        if (!has) break;
        streakDays++;
        cursor.setDate(cursor.getDate() - 1);
      }
    } catch {}

    const res = NextResponse.json({ recent, rewards, streakDays });
    // Browser-only caching to avoid repeated server hits across navigations
    res.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=86400');
    res.headers.set('Vary', 'Cookie');
    return res;
  } catch (e: any) {
    const res = NextResponse.json({ recent: [], rewards: [], streakDays: 0 }, { status: 200 });
    res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=86400');
    res.headers.set('Vary', 'Cookie');
    return res;
  }
}
