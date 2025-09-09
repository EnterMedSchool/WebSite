export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import CuteArticle from "@/components/blog/CuteArticle";

export default async function PostByRootSlug({ params }: { params: { slug: string } }) {
  try {
    const rows = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, params.slug), eq(posts.published, true)))
      .limit(1);
    if (rows.length === 0) return notFound();
    const post = rows[0] as any;
    return (
      <CuteArticle
        title={post.title}
        body={post.body}
        coverImage={post.coverImageUrl}
        date={post.createdAt}
        category={post.category || 'Article'}
        author={post.author || 'EnterMedSchool'}
        stats={{ likes: post.likes || 0, views: post.views || 0, comments: post.comments || 0 }}
      />
    );
  } catch {
    return notFound();
  }
}

