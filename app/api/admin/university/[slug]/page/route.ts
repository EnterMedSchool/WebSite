export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/authz";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { universities, universityPages } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.contentHtml !== "string") {
    return NextResponse.json({ error: "Missing contentHtml" }, { status: 400 });
  }

  const slug = params.slug;
  const uniRows = await db.select({ id: universities.id, name: universities.name }).from(universities);
  const uni = uniRows.find((u) => slugify(u.name) === slug);
  if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.select().from(universityPages).where(eq(universityPages.universityId, uni.id));
  if (existing.length) {
    await db
      .update(universityPages)
      .set({ contentHtml: body.contentHtml, updatedAt: new Date() })
      .where(eq(universityPages.id, (existing[0] as any).id));
  } else {
    await db.insert(universityPages).values({ universityId: uni.id as number, locale: "en", contentHtml: body.contentHtml });
  }
  return NextResponse.json({ ok: true });
}

