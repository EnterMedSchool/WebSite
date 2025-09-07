import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const body = await req.json().catch(()=>({}));
  const progress = Math.max(0, Math.min(100, Number(body.progress || 0)));
  const hasCompleted = Object.prototype.hasOwnProperty.call(body, "completed");
  // Resolve user id from session (fallback to 0 if not authenticated)
  const session = await getServerSession(authOptions as any);
  const userId = session && (session as any).userId ? Number((session as any).userId) : 0;
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const lr = await sql`SELECT id FROM lessons WHERE slug=${params.slug} LIMIT 1`;
  const lesson = lr.rows[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // If caller didn't explicitly set completed, preserve existing state
  let completed: boolean;
  if (hasCompleted) {
    completed = !!(body as any).completed;
  } else {
    const existing = await sql`SELECT completed FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id=${lesson.id} LIMIT 1`;
    completed = existing.rows.length ? !!existing.rows[0].completed : progress === 100;
  }
  await sql`INSERT INTO user_lesson_progress (user_id, lesson_id, progress, completed)
            VALUES (${userId}, ${lesson.id}, ${progress}, ${completed})
            ON CONFLICT (user_id, lesson_id) DO UPDATE SET progress=${progress}, completed=${completed}, last_viewed_at=now()`;
  if (completed) { await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload) VALUES (${userId}, 'lesson', ${lesson.id}, 'completed', ${JSON.stringify({progress})}::jsonb)`; }
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  // Resolve user id from session (fallback to 0 if not authenticated)
  const session = await getServerSession(authOptions as any);
  const userId = session && (session as any).userId ? Number((session as any).userId) : 0;
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const lr = await sql`SELECT id FROM lessons WHERE slug=${params.slug} LIMIT 1`;
  const lesson = lr.rows[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const pr = await sql`SELECT progress, completed FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id=${lesson.id} LIMIT 1`;
  if (pr.rows.length === 0) return NextResponse.json({ progress: 0, completed: false });
  const row = pr.rows[0];
  return NextResponse.json({ progress: Number(row.progress || 0), completed: !!row.completed });
}
