export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/authz";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  countries,
  universities,
  universityPages,
  universityTestimonials,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const slug = params.slug;
  const uniRows = await db
    .select({ id: universities.id, name: universities.name, logoUrl: universities.logoUrl, rating: universities.rating })
    .from(universities);
  const uni = uniRows.find((u) => slugify(u.name) === slug);
  if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pageRows = await db.select().from(universityPages).where(eq(universityPages.universityId, uni.id));
  const testimonials = await db.select().from(universityTestimonials).where(eq(universityTestimonials.universityId, uni.id));
  return NextResponse.json({ uni, page: pageRows[0] ?? null, testimonials });
}

