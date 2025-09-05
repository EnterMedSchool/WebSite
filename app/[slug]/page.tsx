export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export default async function PostByRootSlug({ params }: { params: { slug: string } }) {
  try {
    const rows = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, params.slug), eq(posts.published, true)))
      .limit(1);
    if (rows.length === 0) {
      return (
        <div>
          <h1 className="text-2xl font-semibold">Not found</h1>
          <p className="text-gray-600">The post you are looking for doesn’t exist.</p>
        </div>
      );
    }
    const post = rows[0] as any;
    return (
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <h1>{post.title}</h1>
        <div className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
      </article>
    );
  } catch (err) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Not available</h1>
        <p className="text-gray-600">Content cannot be loaded right now.</p>
      </div>
    );
  }
}
