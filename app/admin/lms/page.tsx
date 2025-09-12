import { requireAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { courses } from "@/drizzle/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLmsIndexPage() {
  const admin = await requireAdminEmail();
  if (!admin) return <div className="p-6 text-red-600">Access denied.</div>;
  const list = await db.select().from(courses).orderBy(asc(courses.title as any));
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">LMS Manager</h1>
      <p className="mt-1 text-sm text-gray-600">Signed in as {admin.email}</p>

      <div className="mt-4">
        <a href="/admin/lms/board" className="inline-block rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Open Multi‑Course Board</a>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {list.map((c) => (
          <a key={c.id}
             href={`/admin/lms/${c.id}`}
             className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/30">
            <div className="text-sm text-gray-500">{c.slug}</div>
            <div className="font-semibold text-gray-900">{c.title}</div>
            {c.description ? <div className="mt-1 line-clamp-2 text-xs text-gray-600">{c.description}</div> : null}
          </a>
        ))}
      </div>
    </div>
  );
}
