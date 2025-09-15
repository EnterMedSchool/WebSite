import { NextResponse } from "next/server";
import { buildSitemapIndex, getBaseUrl, allowIndexing } from "@/lib/seo/sitemap";

export const revalidate = 3600; // 1 hour

export async function GET() {
  const base = getBaseUrl().replace(/\/$/, "");
  const urls = [
    `${base}/sitemap-static.xml`,
    `${base}/sitemap-lessons.xml`,
    `${base}/sitemap-universities.xml`,
    `${base}/sitemap-courses.xml`,
    `${base}/sitemap-blog.xml`,
  ];

  // In dev/non-indexing mode, still return the index so you can inspect it.
  const xml = buildSitemapIndex(urls);
  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

