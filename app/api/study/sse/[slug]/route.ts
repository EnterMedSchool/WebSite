import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studySessions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { subscribe } from "@/lib/study/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const rows = await db.select().from(studySessions).where(eq(studySessions.slug as any, params.slug)).limit(1);
  const s = rows[0];
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { stream } = subscribe(Number(s.id));
  const headers = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });
  return new Response(stream as any, { headers, status: 200 });
}

