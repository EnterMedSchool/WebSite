import { NextResponse } from "next/server";
import { allowIndexing, buildUrlSet, toEntry } from "@/lib/seo/sitemap";
import { db } from "@/lib/db";
import { lessons } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { SITEMAP_CONFIG } from "@/lib/seo/config";

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour

async function fetchPublicLessonSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: lessons.slug })
    .from(lessons)
    .where(eq(lessons.visibility, "public"));
  const unique = new Set(
    rows
      .map((r) => r.slug)
      .filter(Boolean)
      .filter((s) => SITEMAP_CONFIG.filters.lesson(s))
  );
  return [...unique];
}

export async function GET() {
  const ok = allowIndexing();
  const slugs = ok ? await fetchPublicLessonSlugs() : [];
  const entries = slugs.map((slug) => toEntry(`/lesson/${slug}`));
  const xml = buildUrlSet(entries);
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
