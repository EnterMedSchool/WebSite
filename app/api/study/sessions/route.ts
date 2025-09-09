import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studySessions, users } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// List sessions (basic pagination + sort)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)));
  const sort = url.searchParams.get("sort") || "latest"; // latest | popular
  const my = url.searchParams.get("mysessions") === "true";

  const userId = await requireUserId(req);

  try {
    const order = sort === "popular" ? desc(studySessions.totalJoins) : desc(studySessions.createdAt);
    const rows = my && userId
      ? await db.select().from(studySessions).where(eq(studySessions.creatorUserId as any, userId)).orderBy(order).limit(limit).offset((page - 1) * limit)
      : await db.select().from(studySessions).orderBy(order).limit(limit).offset((page - 1) * limit);

    // A light-weight count; we can refine later
    let result;
    if (my && userId) {
      result = await sql<{ count: string }>`SELECT COUNT(*)::text as count FROM study_sessions WHERE creator_user_id = ${userId}`;
    } else {
      result = await sql<{ count: string }>`SELECT COUNT(*)::text as count FROM study_sessions`;
    }
    const count = result.rows?.[0]?.count ?? "0";

    return NextResponse.json({
      results: rows.length,
      total: Number(count || 0),
      data: rows,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load sessions" }, { status: 500 });
  }
}

// Create a session
export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const titleInput = (body?.title || "").toString().trim();
  const description = (body?.description || "").toString();

  try {
    // Enforce single personal room per user: return existing if present
    const existing = (await db
      .select({ id: studySessions.id, slug: studySessions.slug })
      .from(studySessions)
      .where(eq(studySessions.creatorUserId as any, userId))
      .limit(1))[0];
    if (existing?.id) {
      return NextResponse.json({ data: existing });
    }

    // Build stable slug from username/name + user id
    const u = (await db
      .select({ username: users.username, name: users.name })
      .from(users)
      .where(eq(users.id as any, userId))
      .limit(1))[0];
    const rawBase = (u?.username || u?.name || `user-${userId}`).toLowerCase();
    const base = rawBase.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    let slug = base ? `${base}-${userId}` : `u-${userId}`;
    // extra safety against slug collisions
    for (let i = 0; i < 2; i++) {
      const taken = (await db
        .select({ id: studySessions.id })
        .from(studySessions)
        .where(eq(studySessions.slug as any, slug))
        .limit(1))[0];
      if (!taken?.id) break;
      slug = `${base}-${userId}-${Math.floor(Math.random() * 1000)}`;
    }

    const title = titleInput || "My Study Room";
    const inserted = await db
      .insert(studySessions)
      .values({ title, description, slug, creatorUserId: userId })
      .returning({ id: studySessions.id, slug: studySessions.slug });

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create session" }, { status: 500 });
  }
}
