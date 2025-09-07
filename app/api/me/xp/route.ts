import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    const email = (session?.user?.email || "").toString().toLowerCase();
    let userId = 0;
    if (email) {
      const ur = await sql`SELECT id FROM users WHERE lower(email)=${email} LIMIT 1`;
      if (ur.rows[0]?.id) userId = Number(ur.rows[0].id);
    }
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    // recent xp events
    const er = await sql`SELECT action, subject_type, subject_id, created_at, payload
                         FROM lms_events
                         WHERE user_id=${userId} AND (action='xp_awarded' OR action='completed')
                         ORDER BY created_at DESC LIMIT 20`;
    const recent = er.rows.map((r:any)=>({
      what: r.action==='xp_awarded' ? 'Lesson XP' : 'Lesson Completed',
      when: new Date(r.created_at).toLocaleDateString(),
      amount: r.action==='xp_awarded' ? (Number((r.payload||{}).amount)||10) : 0,
    }));

    // naive streak: count consecutive days with at least one xp_awarded event
    const sr = await sql`SELECT created_at FROM lms_events WHERE user_id=${userId} AND action='xp_awarded' AND created_at > now() - interval '30 days' ORDER BY created_at DESC`;
    const dates = Array.from(new Set(sr.rows.map((x:any)=> new Date(x.created_at).toDateString())));
    let streak = 0;
    let d = new Date(); d.setHours(0,0,0,0);
    while (dates.includes(d.toDateString())) { streak++; d = new Date(d.getTime() - 86400000); }

    return NextResponse.json({ recent, streakDays: streak });
  } catch (e:any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message||e) }, { status: 500 });
  }
}

