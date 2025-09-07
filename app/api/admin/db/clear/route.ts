export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { universityScores, universitySeats, universityTestimonials, universityMedia, universityArticles } from "@/drizzle/schema";

function requireKey(request: Request) {
  const url = new URL(request.url);
  const qp = url.searchParams.get("key");
  const headerKey = request.headers.get("x-admin-key");
  const key = (qp ?? headerKey ?? "").trim().replace(/^['"]|['"]$/g, "");
  const secret = (process.env.SEED_SECRET ?? process.env.ADMIN_SECRET ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!secret || !key || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function DELETE(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;
  try {
    const res: Record<string, number> = {};
    res.scores = (await db.delete(universityScores)).rowCount ?? 0;
    res.seats = (await db.delete(universitySeats)).rowCount ?? 0;
    // Optional extras: comment out if you don't want these cleared
    // res.testimonials = (await db.delete(universityTestimonials)).rowCount ?? 0;
    // res.media = (await db.delete(universityMedia)).rowCount ?? 0;
    // res.articles = (await db.delete(universityArticles)).rowCount ?? 0;
    return NextResponse.json({ ok: true, cleared: res });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

