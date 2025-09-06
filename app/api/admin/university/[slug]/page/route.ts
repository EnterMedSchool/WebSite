export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, universities, universityPages } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

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
  const qp = url.searchParams.get("key");
  const headerKey = request.headers.get("x-seed-key");
  const key = (qp ?? headerKey ?? "").trim().replace(/^['"]|['"]$/g, "");
  const secret = (process.env.SEED_SECRET ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!secret || !key || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  try {
    const uniRows = await db
      .select({ id: universities.id, name: universities.name })
      .from(universities);
    const uni = uniRows.find((u) => slugify(u.name) === slug);
    if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const page = (await db.select().from(universityPages).where(eq(universityPages.universityId, uni.id)))[0] ?? null;
    return NextResponse.json({ page });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;

  const slug = params.slug;
  try {
    const body = await request.json();
    const contentHtml: string | undefined = body?.contentHtml;
    if (!contentHtml) return NextResponse.json({ error: "contentHtml required" }, { status: 400 });

    const uniRows = await db
      .select({ id: universities.id, name: universities.name })
      .from(universities);
    const uni = uniRows.find((u) => slugify(u.name) === slug);
    if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await db.select().from(universityPages).where(eq(universityPages.universityId, uni.id));
    if (existing.length === 0) {
      await db.insert(universityPages).values({ universityId: uni.id, locale: "en", contentHtml });
    } else {
      await db
        .update(universityPages)
        .set({ contentHtml, updatedAt: new Date() })
        .where(eq(universityPages.universityId, uni.id));
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
