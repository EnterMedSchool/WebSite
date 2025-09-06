export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/authz";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { universities, universityTestimonials } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

function averageFromCategories(categories: Record<string, number> | null | undefined): number | null {
  if (!categories) return null;
  const vals = Object.values(categories).map(Number).filter((n) => Number.isFinite(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body || !body.author || !body.quote) {
    return NextResponse.json({ error: "Missing author or quote" }, { status: 400 });
  }
  const categories = (body.categories ?? {}) as Record<string, number>;
  const rating = averageFromCategories(categories) ?? body.rating ?? null;

  const slug = params.slug;
  const uniRows = await db.select({ id: universities.id, name: universities.name }).from(universities);
  const uni = uniRows.find((u) => slugify(u.name) === slug);
  if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.id) {
    await db
      .update(universityTestimonials)
      .set({ author: body.author, quote: body.quote, rating, categories })
      .where(eq(universityTestimonials.id, Number(body.id)));
    return NextResponse.json({ ok: true, id: Number(body.id) });
  }

  const res = await db
    .insert(universityTestimonials)
    .values({ universityId: uni.id as number, author: body.author, quote: body.quote, rating, categories })
    .returning({ id: universityTestimonials.id });
  return NextResponse.json({ ok: true, id: res[0].id });
}

