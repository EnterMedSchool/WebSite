import Link from "next/link";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";

export default async function LatestArticles() {
  let items: Array<{ slug: string; title: string; createdAt: Date }> = [];
  try {
    items = await db
      .select({ slug: posts.slug, title: posts.title, createdAt: posts.createdAt })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(6);
  } catch {
    items = [];
  }

  return (
    <section className="my-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Latest Articles</h2>
          <p className="mt-1 text-gray-600">Stay Updated — Read our latest articles and blog posts about studying medicine.</p>
        </div>
        <Link href="/blog" className="text-sm font-semibold text-indigo-700 hover:underline">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border bg-white p-5 text-gray-600">No posts yet.</div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {items.map((p) => (
            <li key={p.slug} className="rounded-xl border bg-white p-5 shadow-sm">
              <Link href={`/${p.slug}`} className="text-lg font-medium hover:underline">
                {p.title}
              </Link>
              <div className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

