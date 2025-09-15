import { NextResponse } from "next/server";
import { allowIndexing, buildUrlSet, toEntry } from "@/lib/seo/sitemap";
import { db } from "@/lib/db";
import { universities } from "@/drizzle/schema";
import { SITEMAP_CONFIG } from "@/lib/seo/config";

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function fetchUniversitySlugs(): Promise<string[]> {
  const rows = await db.select({ name: universities.name }).from(universities);
  const unique = new Set(
    rows
      .map((r) => slugify(r.name))
      .filter(Boolean)
      .filter((s) => SITEMAP_CONFIG.filters.university(s))
  );
  return [...unique];
}

export async function GET() {
  const ok = allowIndexing();
  const slugs = ok ? await fetchUniversitySlugs() : [];
  const entries = slugs.map((slug) => toEntry(`/university/${slug}`));
  const xml = buildUrlSet(entries);
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
