export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { universities, universityTestimonials } from "@/drizzle/schema";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function requireKey(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!process.env.SEED_SECRET || !key || key !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const { author, quote, rating, categories } = body ?? {};
    if (!author || !quote) return NextResponse.json({ error: "author and quote required" }, { status: 400 });

    const uniRows = await db
      .select({ id: universities.id, name: universities.name })
      .from(universities);
    const uni = uniRows.find((u) => slugify(u.name) === params.slug);
    if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.insert(universityTestimonials).values({
      universityId: uni.id,
      author,
      quote,
      rating: rating ?? null,
      categories: categories ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

