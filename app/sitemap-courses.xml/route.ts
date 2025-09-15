import { NextResponse } from "next/server";
import { allowIndexing, buildUrlSet, toEntry } from "@/lib/seo/sitemap";
import { db } from "@/lib/db";
import { courses } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { SITEMAP_CONFIG } from "@/lib/seo/config";

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour

async function fetchCourseSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: courses.slug })
    .from(courses)
    .where(eq(courses.visibility, "public"));
  const unique = new Set(
    rows
      .map((r) => r.slug)
      .filter(Boolean)
      .filter((s) => SITEMAP_CONFIG.filters.course(s))
  );
  return [...unique];
}

export async function GET() {
  const ok = allowIndexing();
  const slugs = ok ? await fetchCourseSlugs() : [];
  const entries = slugs.map((slug) => toEntry(`/course/${slug}`));
  const xml = buildUrlSet(entries);
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
