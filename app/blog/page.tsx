export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";

export default async function BlogIndex() {
  let items: Array<{ slug: string; title: string; createdAt: Date }> = [];
  try {
    items = await db
      .select({ slug: posts.slug, title: posts.title, createdAt: posts.createdAt })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(50);
  } catch {
    items = [];
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Blog</h1>
      {items.length === 0 ? (
        <p className="text-gray-600">No posts yet.</p>
      ) : (
        <ul className="grid gap-4">
          {items.map((p) => (
            <li key={p.slug} className="rounded-lg border bg-white p-4 shadow-sm">
              <Link className="text-lg font-medium hover:underline" href={`/${p.slug}`}>
                {p.title}
              </Link>
              <div className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
