import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// This page uses DB data and global Navbar calls noStore(),
// so force dynamic rendering to avoid SSG/export failures.
export const dynamic = "force-dynamic";

async function getPostBySlug(slug: string) {
  // Select only stable columns (omit recently added ones like `excerpt`).
  const row = (
    await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        body: posts.body,
        published: posts.published,
        coverImageUrl: posts.coverImageUrl,
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
  const title = p.title;
  const description = undefined;
  const canonical = `/${p.slug}`;
  const ogImage = p.coverImageUrl || undefined;
  const twitterImage = ogImage;
  return {
    title,
    description,
    robots: { index: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: twitterImage ? [twitterImage] : undefined,
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
            <img src={p.coverImageUrl} alt={p.coverImageAlt || ''} className="w-full rounded-md" />
            {p.coverImageAlt ? <figcaption className="text-sm text-gray-500">{p.coverImageAlt}</figcaption> : null}
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
