import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const body = await req.json().catch(()=>({}));
  const progress = Math.max(0, Math.min(100, Number(body.progress || 0)));
  const completed = !!body.completed || progress === 100;
  // MVP: no auth hook — we can use 0 as demo user or anonymous
  const userId = 0;
  const lr = await sql`SELECT id FROM lessons WHERE slug=${params.slug} LIMIT 1`;
  const lesson = lr.rows[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await sql`INSERT INTO user_lesson_progress (user_id, lesson_id, progress, completed)
            VALUES (${userId}, ${lesson.id}, ${progress}, ${completed})
            ON CONFLICT (user_id, lesson_id) DO UPDATE SET progress=${progress}, completed=${completed}, last_viewed_at=now()`;
  if (completed) { await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload) VALUES (${userId}, 'lesson', ${lesson.id}, 'completed', ${JSON.stringify({progress})}::jsonb)`; }
  return NextResponse.json({ ok: true });
}
