import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studySessions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  try {
    const row = (await db.select().from(studySessions).where(eq(studySessions.id as any, id)).limit(1))[0];
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ data: { id: row.id, slug: row.slug, title: row.title } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

