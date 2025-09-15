import { NextResponse } from "next/server";
import { SITEMAP_CONFIG } from "@/lib/seo/config";
import { allowIndexing, buildUrlSet, filterAllowed, toEntry } from "@/lib/seo/sitemap";

export const revalidate = 3600; // 1 hour

export async function GET() {
  // If indexing is disabled, keep the sitemap minimal (home only) to avoid noise.
  const allowed = allowIndexing();
  const paths = allowed ? filterAllowed(SITEMAP_CONFIG.staticPaths) : ["/"];
  const entries = paths.map((p) => toEntry(p));
  const xml = buildUrlSet(entries);
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

