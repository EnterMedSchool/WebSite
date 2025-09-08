import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studySessions } from "@/drizzle/schema";
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
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = (body?.title || "").toString().trim();
  const description = (body?.description || "").toString();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  // Generate a unique slug token
  const slug = crypto.randomBytes(10).toString("hex");
  try {
    const inserted = await db
      .insert(studySessions)
      .values({ title, description, slug, creatorUserId: userId })
      .returning({ id: studySessions.id, slug: studySessions.slug });

    return NextResponse.json({ data: inserted[0] }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create session" }, { status: 500 });
  }
}
