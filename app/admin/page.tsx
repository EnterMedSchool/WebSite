import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/authz";
import { headers } from "next/headers";
import Link from "next/link";

export default async function AdminHome() {
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminSession(session);
  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-gray-600">You must sign in as an admin to access this page.</p>
        <p className="text-sm text-gray-500">
          Set `ADMIN_USERS` (comma-separated usernames) in Vercel to grant admin access.
        </p>
        <Link className="text-blue-600 underline" href="/api/auth/signin">Sign in</Link>
      </div>
    );
  }

  const h = headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";
  let posts: Array<{ id: number; slug: string; title: string; published: boolean; createdAt: string }> = [];
  let loadError: string | null = null;
  try {
    const res = await fetch(`${origin}/api/admin/posts`, { cache: "no-store" });
    if (!res.ok) throw new Error(`(${res.status})`);
    const data = await res.json();
    posts = (data?.posts ?? []) as any;
  } catch (e: any) {
    loadError = String(e?.message ?? e);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin • Posts</h1>
        <Link href="/admin/posts/new" className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black">New post</Link>
      </div>
      {loadError ? (
        <div className="rounded border bg-yellow-50 p-3 text-sm text-yellow-900">
          Could not load posts (maybe DB not initialized). As admin, POST to <code className="font-mono">/api/admin/init</code> once to create tables.
        </div>
      ) : posts.length === 0 ? (
        <p className="text-gray-600">No posts yet.</p>
      ) : (
        <ul className="grid gap-3">
          {posts.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded border bg-white p-3 shadow-sm">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-sm text-gray-500">
                  {p.published ? "Published" : "Draft"} • {new Date(p.createdAt).toLocaleString()} • /blog/{p.slug}
                </div>
              </div>
              <Link className="text-blue-600 underline" href={`/blog/${p.slug}`}>View</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
