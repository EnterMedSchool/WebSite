import { NextResponse } from "next/server";
import { allowIndexing, buildUrlSet, toEntry } from "@/lib/seo/sitemap";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { SITEMAP_CONFIG } from "@/lib/seo/config";

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour

async function fetchBlogEntries() {
  const rows = await db
    .select({ slug: posts.slug, updatedAt: posts.updatedAt, changefreq: posts.sitemapChangefreq, priority: posts.sitemapPriority, noindex: posts.noindex, published: posts.published })
    .from(posts)
    .where(eq(posts.published, true));
  return rows.filter((r) => r.noindex !== true && SITEMAP_CONFIG.filters.blog(r.slug));
}

export async function GET() {
  const ok = allowIndexing();
  const rows = ok ? await fetchBlogEntries() : [];
  const entries = rows.map((r) =>
    toEntry(`/blog/${r.slug}`, {
      lastModified: r.updatedAt || undefined,
      changefreq: (r.changefreq as any) || undefined,
      priority: typeof r.priority === "number" ? r.priority : undefined,
    })
  );
  const xml = buildUrlSet(entries);
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
