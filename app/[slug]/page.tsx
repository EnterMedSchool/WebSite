import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// This page uses DB data and global Navbar calls noStore(),
// so force dynamic rendering to avoid SSG/export failures.
export const dynamic = "force-dynamic";

async function getPostBySlug(slug: string) {
  const row = (
    await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        body: posts.body,
        published: posts.published,
        noindex: posts.noindex,

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

        coverImageUrl: posts.coverImageUrl,
        coverImageAlt: posts.coverImageAlt,
        coverImageWidth: posts.coverImageWidth,
        coverImageHeight: posts.coverImageHeight,
        coverImageCaption: posts.coverImageCaption,

        lang: posts.lang,
        hreflangAlternates: posts.hreflangAlternates,
        robotsDirectives: posts.robotsDirectives,

        authorName: posts.authorName,
        authorEmail: posts.authorEmail,
        publishedAt: posts.publishedAt,
        structuredData: posts.structuredData,

        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.slug as any, slug))
      .limit(1)
  )[0];
  return row as any;
}

// Disable pre-rendering of all post slugs during build. The DB schema
// may differ across environments; rendering at request time is safer.
// If you want SSG later, re-enable and ensure DB has needed columns.

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const p = await getPostBySlug(slug);
  if (!p || !p.published) return {};
  const title = p.metaTitle || p.title;
  const description = p.metaDescription || p.excerpt || undefined;
  const canonical = p.canonicalUrl || `/${p.slug}`;
  const ogImage = p.ogImageUrl || p.coverImageUrl || undefined;
  const twitterImage = p.twitterImageUrl || ogImage;
  const lang = p.lang as string | undefined;
  const locale = lang ? lang.replace('-', '_') : undefined;
  const languages: Record<string, string> | undefined = Array.isArray(p.hreflangAlternates)
    ? (p.hreflangAlternates as any[]).reduce((acc: any, cur: any) => {
        if (cur?.lang && cur?.href) acc[String(cur.lang)] = String(cur.href);
        return acc;
      }, {})
    : undefined;
  const robotsObj: any = {};
  if (p.noindex) robotsObj.index = false;
  if (p.robotsDirectives) {
    const r = p.robotsDirectives as any;
    if (typeof r.nofollow === 'boolean') robotsObj.follow = !r.nofollow;
    const googleBot: any = {};
    if (typeof r.maxSnippet === 'number') googleBot.maxSnippet = r.maxSnippet;
    if (typeof r.maxVideoPreview === 'number') googleBot.maxVideoPreview = r.maxVideoPreview;
    if (typeof r.maxImagePreview === 'string') googleBot.maxImagePreview = r.maxImagePreview; // none|standard|large
    if (Object.keys(googleBot).length) robotsObj.googleBot = googleBot;
  }
  return {
    title,
    description,
    robots: Object.keys(robotsObj).length ? robotsObj : { index: !p.noindex },
    alternates: { canonical, languages },
    openGraph: {
      title: p.ogTitle || title,
      description: p.ogDescription || description,
      url: canonical,
      type: "article",
      locale,
      images: ogImage ? [{ url: ogImage, alt: p.coverImageAlt }] : undefined,
    },
    twitter: {
      card: (p.twitterCard as any) || "summary_large_image",
      title: p.twitterTitle || title,
      description: p.twitterDescription || description,
      creator: p.twitterCreator || undefined,
      images: twitterImage ? [{ url: twitterImage, alt: p.twitterImageAlt || p.coverImageAlt }] as any : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const p = await getPostBySlug(params.slug);
  if (!p || !p.published) return notFound();
  const sd = p.structuredData ? (typeof p.structuredData === 'string' ? p.structuredData : JSON.stringify(p.structuredData)) : null;
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 prose prose-slate">
      <header>
        <h1>{p.title}</h1>
        {p.authorName || p.publishedAt ? (
          <p className="text-sm text-gray-600">
            {p.authorName ? <span>By {p.authorName}</span> : null}
            {p.authorName && p.publishedAt ? <span> · </span> : null}
            {p.publishedAt ? <time dateTime={new Date(p.publishedAt as any).toISOString()}>{new Date(p.publishedAt as any).toLocaleDateString()}</time> : null}
          </p>
        ) : null}
        {p.coverImageUrl ? (
          <figure className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.coverImageUrl} alt={p.coverImageAlt || ''} className="w-full rounded-md" width={p.coverImageWidth || undefined} height={p.coverImageHeight || undefined} />
            {p.coverImageCaption ? <figcaption className="text-sm text-gray-500">{p.coverImageCaption}</figcaption> : null}
          </figure>
        ) : null}
      </header>

      <div className="mt-6" dangerouslySetInnerHTML={{ __html: p.body }} />

      {sd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sd }} />
      ) : null}
    </article>
  );
}
