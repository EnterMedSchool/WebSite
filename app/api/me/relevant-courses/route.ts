export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const sel = await sql`SELECT course_id FROM user_relevant_courses WHERE user_id=${userId} ORDER BY created_at ASC`;
    // Keep it simple: return the full course list for now (limited for UI)
    const all = await sql`SELECT id, slug, title, description FROM courses ORDER BY created_at DESC LIMIT 200`;
    return NextResponse.json({ selected: sel.rows.map((r:any)=> Number(r.course_id)), courses: all.rows });
  } catch (e:any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await request.json().catch(()=>({}));
    const arr: any = Array.isArray(body?.courseIds) ? body.courseIds : [];
    const courseIds = arr
      .map((x:any)=> Number(x))
      .filter((n:number)=> Number.isFinite(n) && n>0 && n<=2147483647)
      .slice(0, 50);

    // Upsert set: simple replace strategy for now
    await sql`DELETE FROM user_relevant_courses WHERE user_id=${userId}`;
    if (courseIds.length) {
      for (const cid of courseIds) {
        await sql`INSERT INTO user_relevant_courses (user_id, course_id) VALUES (${userId}, ${cid}) ON CONFLICT DO NOTHING`;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
