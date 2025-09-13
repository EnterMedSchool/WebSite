import { requireAdminEmail } from "@/lib/admin";
import PostForm, { PostFormValues } from "@/components/admin/blog/PostForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewPostPage() {
  const admin = await requireAdminEmail();
  if (!admin) return <div className="p-6 text-red-600">Access denied.</div>;
  async function create(data: PostFormValues) {
    "use server";
    // This server action is a no-op placeholder to allow the component to render on the server.
  }
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">New Post</h1>
      <div className="mt-4">
        {/* Client-side submit to API */}
        {/* @ts-expect-error Server Component type */}
        <ClientWrapper />
      </div>
    </div>
  );
}

// Split client logic into a Client Component wrapper
function ClientWrapper() {
  // @ts-expect-error async server boundary
  return <ClientInner/>;
}

// Actual Client Component with submission logic
// eslint-disable-next-line @next/next/no-unstable-nested-components
function ClientInner() {
  async function onSubmit(values: PostFormValues) {
    const res = await fetch('/api/admin/blog/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Failed: ' + (err.error || res.status));
      return;
    }
    const row = await res.json();
    window.location.href = `/admin/blog/edit/${row.id}`;
  }
  return <PostForm onSubmit={onSubmit} submitLabel="Create"/>;
}

