import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studySessionParticipants, studySessions, studyUserMeta } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { authGetServerSession } from "@/lib/auth";
import { publish } from "@/lib/study/pusher";
import { StudyEvents } from "@/lib/study/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  const auth = await authGetServerSession();
  const userId = (auth as any)?.userId ? Number((auth as any).userId) : null;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionId = Number(params.sessionId);
  if (!Number.isFinite(sessionId)) return NextResponse.json({ error: "Invalid session id" }, { status: 400 });

  try {
    const existing = await db
      .select({ id: studySessionParticipants.id })
      .from(studySessionParticipants)
      .where(and(eq(studySessionParticipants.sessionId as any, sessionId), eq(studySessionParticipants.userId as any, userId)))
      .limit(1);
    if (!existing[0]) {
      await db.insert(studySessionParticipants).values({ sessionId, userId });
      // Optional: bump totalJoins
      await sql`UPDATE study_sessions SET total_joins = total_joins + 1 WHERE id = ${sessionId}`;
    }

    // Update user's last session slug in isolated meta table
    const sessionRow = await db.select({ slug: studySessions.slug }).from(studySessions).where(eq(studySessions.id as any, sessionId)).limit(1);
    const slug = sessionRow[0]?.slug as string | undefined;
    if (slug) {
      const meta = await db.select().from(studyUserMeta).where(eq(studyUserMeta.userId as any, userId)).limit(1);
      if (meta[0]) {
        await db.update(studyUserMeta).set({ lastSessionSlug: slug, updatedAt: new Date() as any }).where(eq(studyUserMeta.userId as any, userId));
      } else {
        await db.insert(studyUserMeta).values({ userId, lastSessionSlug: slug });
      }
    }

    await publish(sessionId, StudyEvents.PresenceJoin, { userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to join" }, { status: 500 });
  }
}
