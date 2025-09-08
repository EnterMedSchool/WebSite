import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studySessionParticipants, studySessions, studyUserMeta } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { publish } from "@/lib/study/pusher";
import { StudyEvents } from "@/lib/study/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  // Resolve slug to session id
  const row = (await db.select({ id: studySessions.id }).from(studySessions).where(eq(studySessions.slug as any, params.slug)).limit(1))[0];
  if (!row) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const sessionId = Number(row.id);

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
    const slug = params.slug as string | undefined;
    if (slug) {
      const meta = await db.select().from(studyUserMeta).where(eq(studyUserMeta.userId as any, userId)).limit(1);
      if (meta[0]) {
        await db.update(studyUserMeta).set({ lastSessionSlug: slug, updatedAt: new Date() as any }).where(eq(studyUserMeta.userId as any, userId));
      } else {
        await db.insert(studyUserMeta).values({ userId, lastSessionSlug: slug });
      }
    }

    // Load user details to include in presence event
    const u = await db.select().from(studySessions).limit(0); // no-op to keep types
    const userRow = (await db.execute<{ name: string | null; image: string | null; username: string | null }>(`SELECT name, image, username FROM users WHERE id = ${userId} LIMIT 1` as any)).rows?.[0];
    await publish(sessionId, StudyEvents.PresenceJoin, { userId, name: userRow?.name ?? null, image: userRow?.image ?? null, username: userRow?.username ?? null });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to join" }, { status: 500 });
  }
}
