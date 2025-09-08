import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studyUserMeta } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(studyUserMeta).where(eq(studyUserMeta.userId as any, userId)).limit(1);
  const meta = rows[0] || null;
  return NextResponse.json({ data: meta });
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = (body?.lastSessionSlug || "").toString();
  if (!slug) return NextResponse.json({ error: "lastSessionSlug required" }, { status: 400 });
  try {
    const existing = await db.select().from(studyUserMeta).where(eq(studyUserMeta.userId as any, userId)).limit(1);
    if (existing[0]) {
      const [updated] = await db
        .update(studyUserMeta)
        .set({ lastSessionSlug: slug, updatedAt: new Date() as any })
        .where(eq(studyUserMeta.userId as any, userId))
        .returning();
      return NextResponse.json({ data: updated });
    }
    const [created] = await db
      .insert(studyUserMeta)
      .values({ userId, lastSessionSlug: slug })
      .returning();
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save" }, { status: 500 });
  }
}
