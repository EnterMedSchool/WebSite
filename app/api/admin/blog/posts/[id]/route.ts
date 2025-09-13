import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  const row = (
    await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        body: posts.body,
        published: posts.published,
        coverImageUrl: posts.coverImageUrl,
        excerpt: posts.excerpt,
        noindex: posts.noindex,
        coverImageAlt: posts.coverImageAlt,
        coverImageWidth: posts.coverImageWidth,
        coverImageHeight: posts.coverImageHeight,
        coverImageCaption: posts.coverImageCaption,
        metaTitle: posts.metaTitle,
        metaDescription: posts.metaDescription,
        canonicalUrl: posts.canonicalUrl,
        ogTitle: posts.ogTitle,
        ogDescription: posts.ogDescription,
        ogImageUrl: posts.ogImageUrl,
        twitterCard: posts.twitterCard,
        twitterTitle: posts.twitterTitle,
        twitterDescription: posts.twitterDescription,
        twitterImageUrl: posts.twitterImageUrl,
        twitterCreator: posts.twitterCreator,
        twitterImageAlt: posts.twitterImageAlt,
        structuredData: posts.structuredData,
        tags: posts.tags,
        lang: posts.lang,
        hreflangAlternates: posts.hreflangAlternates,
        redirectFrom: posts.redirectFrom,
        robotsDirectives: posts.robotsDirectives,
        publisherName: posts.publisherName,
        publisherLogoUrl: posts.publisherLogoUrl,
        sitemapChangefreq: posts.sitemapChangefreq,
        sitemapPriority: posts.sitemapPriority,
        authorName: posts.authorName,
        authorEmail: posts.authorEmail,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.id as any, id))
      .limit(1)
  )[0];
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    const data = await req.json();
    let tags: string[] | null = null;
    if (Array.isArray(data.tags)) tags = data.tags.map((t: any) => String(t)).filter(Boolean);
    else if (typeof data.tags === "string") tags = String(data.tags).split(",").map((s) => s.trim()).filter(Boolean);
    let structuredData: any = null;
    if (data.structuredData) structuredData = data.structuredData;
    if (typeof structuredData === "string") {
      try { structuredData = JSON.parse(structuredData); } catch { structuredData = null; }
    }
    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;

    const [updated] = await db
      .update(posts)
      .set({
        // Slug update: ensure no slashes if provided
        slug: (typeof data.slug === 'string' && /^[a-z0-9\-]+$/.test(data.slug)) ? data.slug : undefined,
        title: data.title ?? undefined,
        body: data.body ?? undefined,
        excerpt: data.excerpt ?? undefined,
        published: data.published ?? undefined,
        noindex: data.noindex ?? undefined,
        coverImageUrl: data.coverImageUrl ?? undefined,
        coverImageAlt: data.coverImageAlt ?? undefined,
        coverImageWidth: data.coverImageWidth ?? undefined,
        coverImageHeight: data.coverImageHeight ?? undefined,
        coverImageCaption: data.coverImageCaption ?? undefined,
        metaTitle: data.metaTitle ?? undefined,
        metaDescription: data.metaDescription ?? undefined,
        canonicalUrl: data.canonicalUrl ?? undefined,
        ogTitle: data.ogTitle ?? undefined,
        ogDescription: data.ogDescription ?? undefined,
        ogImageUrl: data.ogImageUrl ?? undefined,
        twitterCard: data.twitterCard ?? undefined,
        twitterTitle: data.twitterTitle ?? undefined,
        twitterDescription: data.twitterDescription ?? undefined,
        twitterImageUrl: data.twitterImageUrl ?? undefined,
        twitterCreator: data.twitterCreator ?? undefined,
        twitterImageAlt: data.twitterImageAlt ?? undefined,
        structuredData: structuredData ?? undefined,
        tags: (tags as any) ?? undefined,
        lang: data.lang ?? undefined,
        hreflangAlternates: data.hreflangAlternates ?? undefined,
        redirectFrom: data.redirectFrom ?? undefined,
        robotsDirectives: data.robotsDirectives ?? undefined,
        publisherName: data.publisherName ?? undefined,
        publisherLogoUrl: data.publisherLogoUrl ?? undefined,
        sitemapChangefreq: data.sitemapChangefreq ?? undefined,
        sitemapPriority: data.sitemapPriority ?? undefined,
        authorName: data.authorName ?? undefined,
        authorEmail: data.authorEmail ?? undefined,
        publishedAt: (publishedAt as any) ?? undefined,
        updatedAt: new Date() as any,
      })
      .where(eq(posts.id as any, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", message: String(e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  const [deleted] = await db.delete(posts).where(eq(posts.id as any, id)).returning();
  if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
