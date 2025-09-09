import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studySessions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { emit } from "@/lib/study/sse";
import { StudyEvents } from "@/lib/study/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const rows = await db.select().from(studySessions).where(eq(studySessions.slug as any, params.slug)).limit(1);
    const sessionRow = rows[0];
    if (!sessionRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // lightweight participant count (optional for now)
    const result = await sql<{ count: string }>`SELECT COUNT(*)::text as count FROM study_session_participants WHERE session_id = ${sessionRow.id}`;
    const count = Number(result.rows?.[0]?.count || 0);
    return NextResponse.json({ data: { ...sessionRow, participantCount: count } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

// Update session (owner only). Allows editing slug or sharedEndAt.
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const newSlug = body?.slug ? String(body.slug).trim() : undefined;
  const sharedEndAt = body?.sharedEndAt ? new Date(String(body.sharedEndAt)) : undefined;
  try {
    const rows = await db.select().from(studySessions).where(eq(studySessions.slug as any, params.slug)).limit(1);
    const s = rows[0];
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (s.creatorUserId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const toUpdate: any = {};
    if (newSlug) toUpdate.slug = newSlug;
    const updatingShared = sharedEndAt instanceof Date && !isNaN(sharedEndAt.getTime());
    if (updatingShared) toUpdate.sharedEndAt = sharedEndAt as any;
    if (Object.keys(toUpdate).length === 0) return NextResponse.json({ data: s });

    const updated = await db
      .update(studySessions)
      .set(toUpdate)
      .where(eq(studySessions.id as any, s.id))
      .returning({ id: studySessions.id, slug: studySessions.slug, sharedEndAt: studySessions.sharedEndAt });
    const out = updated[0];
    if (updatingShared && out?.sharedEndAt) {
      emit(Number(s.id), StudyEvents.TimerTick, { sharedEndAt: out.sharedEndAt });
    }
    return NextResponse.json({ data: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update" }, { status: 500 });
  }
}

// Delete a session (owner only)
export async function DELETE(
  req: Request,
  { params }: { params: { slug: string } }
) {
  // Deleting personal rooms is disabled to enforce one room per user
  return NextResponse.json({ error: "Deleting personal rooms is disabled" }, { status: 405 });
}
