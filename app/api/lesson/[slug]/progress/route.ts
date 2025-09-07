import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const isAuthConfigured = Boolean(process.env.NEXTAUTH_SECRET);
    if (!isAuthConfigured) {
      return NextResponse.json({ error: 'auth_not_configured' }, { status: 401 });
    }
    const body = await req.json().catch(()=>({}));
    const hasProgress = Object.prototype.hasOwnProperty.call(body, "progress");
    const progress = hasProgress ? Math.max(0, Math.min(100, Number(body.progress))) : 0;
    const hasCompleted = Object.prototype.hasOwnProperty.call(body, "completed");
    // Resolve user id from session (fallback to lookup by email)
    const session = await getServerSession(authOptions as any);
    let userId = session && (session as any).userId ? Number((session as any).userId) : 0;
    // Guard against provider subject ids sneaking in (Google sub is a 21-digit string)
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) {
      userId = 0;
    }
    if (!userId && (session as any)?.user?.email) {
      const email = String((session as any).user.email).toLowerCase();
      const ur = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
      if (ur.rows[0]?.id) userId = Number(ur.rows[0].id);
    }
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

    // Insert or update. On conflict, only update 'completed' to avoid clobbering progress/last_viewed_at when toggling.
    await sql`INSERT INTO user_lesson_progress (user_id, lesson_id, progress, completed)
              VALUES (${userId}, ${lesson.id}, ${progress}, ${completed})
              ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed=${completed}`;

    if (completed) {
      try {
        await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                  VALUES (${userId}, 'lesson', ${lesson.id}, 'completed', ${JSON.stringify({progress})}::jsonb)`;
      } catch (e) {
        console.warn('lms_events insert failed (non-fatal):', e);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('progress POST failed', err);
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const isAuthConfigured = Boolean(process.env.NEXTAUTH_SECRET);
    if (!isAuthConfigured) {
      return NextResponse.json({ error: 'auth_not_configured' }, { status: 401 });
    }
    const session = await getServerSession(authOptions as any);
    let userId = session && (session as any).userId ? Number((session as any).userId) : 0;
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) {
      userId = 0;
    }
    if (!userId && (session as any)?.user?.email) {
      const email = String((session as any).user.email).toLowerCase();
      const ur = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
      if (ur.rows[0]?.id) userId = Number(ur.rows[0].id);
    }
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const lr = await sql`SELECT id FROM lessons WHERE slug=${params.slug} LIMIT 1`;
    const lesson = lr.rows[0];
    if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pr = await sql`SELECT progress, completed FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id=${lesson.id} LIMIT 1`;
    if (pr.rows.length === 0) return NextResponse.json({ progress: 0, completed: false });
    const row = pr.rows[0];
    return NextResponse.json({ progress: Number(row.progress || 0), completed: !!row.completed });
  } catch (err: any) {
    console.error('progress GET failed', err);
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}
