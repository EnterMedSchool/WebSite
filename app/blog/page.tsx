import { headers } from "next/headers";
import Link from "next/link";

export default async function BlogIndex() {
  const h = headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";
  const res = await fetch(`${origin}/api/posts`, { cache: "no-store" });
  const data = await res.json();
  const posts = (data?.posts ?? []) as Array<{ slug: string; title: string; createdAt: string }>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Blog</h1>
      {posts.length === 0 ? (
        <p className="text-gray-600">No posts yet.</p>
      ) : (
        <ul className="grid gap-4">
          {posts.map((p) => (
            <li key={p.slug} className="rounded-lg border bg-white p-4 shadow-sm">
              <Link className="text-lg font-medium hover:underline" href={`/blog/${p.slug}`}>
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

