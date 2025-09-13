import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseBool(v: any): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).toLowerCase();
  if (["1", "true", "yes"].includes(s)) return true;
  if (["0", "false", "no"].includes(s)) return false;
  return undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const publishedParam = searchParams.get("published");
  const published = parseBool(publishedParam);
  const limit = Math.max(1, Math.min(Number(searchParams.get("limit") || 50), 200));
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));

  const whereClauses: any[] = [];
  if (q) {
    whereClauses.push(or(ilike(posts.title as any, `%${q}%`), ilike(posts.slug as any, `%${q}%`)));
  }
  if (published !== undefined) {
    whereClauses.push(eq(posts.published as any, published));
  }
  const where = whereClauses.length ? and(...whereClauses) : undefined;

  const list = await db
    .select()
    .from(posts)
    .where(where as any)
    .orderBy(desc(posts.updatedAt as any))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ items: list });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const now = new Date();
    // Basic validation
    const slug = String(data.slug || "").trim();
    const title = String(data.title || "").trim();
    const body = String(data.body || "");
    if (!slug || !/^[a-z0-9\-]+$/.test(slug)) return NextResponse.json({ error: "invalid_slug", hint: "use lowercase letters, numbers and dashes only; no slashes" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "missing_title" }, { status: 400 });
    if (!body) return NextResponse.json({ error: "missing_body" }, { status: 400 });

    // Optional parsing
    let tags: string[] | null = null;
    if (Array.isArray(data.tags)) tags = data.tags.map((t: any) => String(t)).filter(Boolean);
    else if (typeof data.tags === "string") tags = String(data.tags).split(",").map(s => s.trim()).filter(Boolean);

    let structuredData: any = null;
    if (data.structuredData) structuredData = data.structuredData;
    if (typeof structuredData === "string") {
      try { structuredData = JSON.parse(structuredData); } catch { structuredData = null; }
    }

    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;

    const [inserted] = await db.insert(posts).values({
      slug,
      title,
      body,
      excerpt: data.excerpt ?? null,
      published: !!data.published,
      noindex: !!data.noindex,
      coverImageUrl: data.coverImageUrl ?? null,
      coverImageAlt: data.coverImageAlt ?? null,
      coverImageWidth: data.coverImageWidth ?? null,
      coverImageHeight: data.coverImageHeight ?? null,
      coverImageCaption: data.coverImageCaption ?? null,
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
      canonicalUrl: data.canonicalUrl ?? null,
      ogTitle: data.ogTitle ?? null,
      ogDescription: data.ogDescription ?? null,
      ogImageUrl: data.ogImageUrl ?? null,
      twitterCard: data.twitterCard ?? "summary_large_image",
      twitterTitle: data.twitterTitle ?? null,
      twitterDescription: data.twitterDescription ?? null,
      twitterImageUrl: data.twitterImageUrl ?? null,
      twitterCreator: data.twitterCreator ?? null,
      twitterImageAlt: data.twitterImageAlt ?? null,
      structuredData: structuredData ?? null,
      tags: tags as any,
      lang: data.lang ?? null,
      hreflangAlternates: data.hreflangAlternates ?? null,
      redirectFrom: data.redirectFrom ?? null,
      robotsDirectives: data.robotsDirectives ?? null,
      publisherName: data.publisherName ?? null,
      publisherLogoUrl: data.publisherLogoUrl ?? null,
      sitemapChangefreq: data.sitemapChangefreq ?? null,
      sitemapPriority: data.sitemapPriority ?? null,
      authorName: data.authorName ?? null,
      authorEmail: data.authorEmail ?? null,
      publishedAt: publishedAt as any,
      createdAt: now as any,
      updatedAt: now as any,
    }).returning();

    return NextResponse.json(inserted);
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", message: String(e?.message || e) }, { status: 500 });
  }
}
