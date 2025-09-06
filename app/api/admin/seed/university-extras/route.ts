export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  universities,
  universityPages,
  universityTestimonials,
  universityMedia,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";

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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;

  try {
    // Find University of Pavia (Italy) and attach page HTML from universityarticles/pavia.html
    const uniRows = await db
      .select({
        id: universities.id,
        name: universities.name,
        city: universities.city,
      })
      .from(universities);

    const pavia = uniRows.find((u) => slugify(u.name).includes("pavia"));
    if (!pavia) {
      return NextResponse.json(
        { ok: false, message: "University of Pavia not found. Seed universities first." },
        { status: 400 }
      );
    }

    let html: string;
    try {
      html = await readFile(process.cwd() + "/universityarticles/pavia.html", "utf8");
    } catch {
      // Fallback content if the HTML file isn't bundled; still seed usable page content
      html = `<h1>University of Pavia</h1><p>Placeholder page content. You can update it later via the admin page API.</p>`;
    }

    // Upsert simple page content
    const existing = await db
      .select()
      .from(universityPages)
      .where(eq(universityPages.universityId, pavia.id));
    let pageInserted = false;
    if (existing.length === 0) {
      await db.insert(universityPages).values({ universityId: pavia.id, locale: "en", contentHtml: html });
      pageInserted = true;
    }

    // Add a couple of sample testimonials and media (if none exist)
    const tCount = (await db
      .select({ id: universityTestimonials.id })
      .from(universityTestimonials)
      .where(eq(universityTestimonials.universityId, pavia.id))).length;
    let testimonialsInserted = 0;
    if (tCount === 0) {
      const res = await db.insert(universityTestimonials).values([
        {
          universityId: pavia.id,
          author: "EMS Student",
          quote: "Great clinical exposure at San Matteo Medical Center.",
          rating: 4.5,
          categories: { teaching: 4.0, facilities: 4.5, lifestyle: 4.2 },
        },
        {
          universityId: pavia.id,
          author: "International Student",
          quote: "Flexible study environment and supportive community.",
          rating: 4.6,
          categories: { teaching: 4.4, facilities: 4.3, lifestyle: 4.6 },
        },
      ]).returning({ id: universityTestimonials.id });
      testimonialsInserted = res.length;
    }

    const mCount = (await db
      .select({ id: universityMedia.id })
      .from(universityMedia)
      .where(eq(universityMedia.universityId, pavia.id))).length;
    let mediaInserted = 0;
    if (mCount === 0) {
      const res = await db.insert(universityMedia).values([
        {
          universityId: pavia.id,
          type: "image",
          url: "https://entermedschool.b-cdn.net/wp-content/uploads/2023/03/delfin-pQWJrMMmySA-unsplash-150x150.jpg",
          title: "Campus view",
        },
        {
          universityId: pavia.id,
          type: "image",
          url: "https://entermedschool.b-cdn.net/wp-content/uploads/2023/04/photo_2023-04-10_11-18-15-150x150.jpg",
          title: "Student life",
        },
      ]).returning({ id: universityMedia.id });
      mediaInserted = res.length;
    }

    return NextResponse.json({ ok: true, university: pavia.name, inserted: { page: pageInserted, testimonials: testimonialsInserted, media: mediaInserted } });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
