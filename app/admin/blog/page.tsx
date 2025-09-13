import { requireAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBlogIndexPage() {
  const admin = await requireAdminEmail();
  if (!admin) return <div className="p-6 text-red-600">Access denied.</div>;
  const list = await db
    .select({ id: posts.id, title: posts.title, slug: posts.slug, published: posts.published, updatedAt: posts.updatedAt })
    .from(posts)
    .orderBy(desc(posts.updatedAt as any))
    .limit(100);
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Admin</h1>
          <p className="mt-1 text-sm text-gray-600">Signed in as {admin.email}</p>
        </div>
        <a href="/admin/blog/new" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">New Post</a>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Title</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Slug</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Published</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Updated</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {list.map(p => (
              <tr key={p.id}>
                <td className="px-3 py-2">{p.title}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-600">/{p.slug}</td>
                <td className="px-3 py-2">{p.published ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">published</span> : <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">draft</span>}</td>
                <td className="px-3 py-2 text-sm text-gray-600">{p.updatedAt?.toISOString?.() ? new Date(p.updatedAt as any).toLocaleString() : ''}</td>
                <td className="px-3 py-2 text-right"><a className="text-indigo-600 hover:underline" href={`/admin/blog/edit/${p.id}`}>Edit</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
