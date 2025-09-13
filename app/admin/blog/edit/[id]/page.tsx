import { requireAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import PostForm, { PostFormValues } from "@/components/admin/blog/PostForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const admin = await requireAdminEmail();
  if (!admin) return <div className="p-6 text-red-600">Access denied.</div>;
  const id = Number(params.id);
  const post = (
    await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        body: posts.body,
        published: posts.published,
        coverImageUrl: posts.coverImageUrl,
        // Include SEO/meta fields used by the form
        excerpt: posts.excerpt,
        noindex: posts.noindex,
        coverImageAlt: posts.coverImageAlt,
        coverImageWidth: posts.coverImageWidth,
        coverImageHeight: posts.coverImageHeight,
        coverImageCaption: posts.coverImageCaption,
        metaTitle: posts.metaTitle,
        metaDescription: posts.metaDescription,
        canonicalUrl: posts.canonicalUrl,
        ogTitle: posts.ogTitle,
        ogDescription: posts.ogDescription,
        ogImageUrl: posts.ogImageUrl,
        twitterCard: posts.twitterCard,
        twitterTitle: posts.twitterTitle,
        twitterDescription: posts.twitterDescription,
        twitterImageUrl: posts.twitterImageUrl,
        twitterCreator: posts.twitterCreator,
        twitterImageAlt: posts.twitterImageAlt,
        structuredData: posts.structuredData,
        tags: posts.tags,
        lang: posts.lang,
        hreflangAlternates: posts.hreflangAlternates,
        redirectFrom: posts.redirectFrom,
        robotsDirectives: posts.robotsDirectives,
        publisherName: posts.publisherName,
        publisherLogoUrl: posts.publisherLogoUrl,
        sitemapChangefreq: posts.sitemapChangefreq,
        sitemapPriority: posts.sitemapPriority,
        authorName: posts.authorName,
        authorEmail: posts.authorEmail,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.id as any, id))
      .limit(1)
  )[0];
  if (!post) return <div className="p-6">Post not found.</div>;
  const hasDeployHook = Boolean(process.env.VERCEL_DEPLOY_HOOK_URL);

  // Prepare initial values for client form
  const initial: any = {
    ...post,
    tags: Array.isArray(post.tags as any) ? post.tags : (post.tags ? [] : []),
    structuredData: post.structuredData ? JSON.stringify(post.structuredData, null, 2) : "",
    publishedAt: post.publishedAt ? new Date(post.publishedAt as any).toISOString() : "",
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <a href="/admin/blog" className="text-sm text-indigo-600 hover:underline">Back</a>
      </div>
      <div className="mt-2 flex gap-3">
        <PublishActions id={id} slug={post.slug as any} hasDeployHook={hasDeployHook} />
      </div>
      <div className="mt-4">
        <ClientWrapper initial={initial} id={id} />
      </div>
    </div>
  );
}

function ClientWrapper({ initial, id }: { initial: any; id: number }) {
  return <ClientInner initial={initial} id={id} />;
}

function ClientInner({ initial, id }: { initial: any; id: number }) {
  async function onSubmit(values: PostFormValues) {
    const res = await fetch(`/api/admin/blog/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Failed: ' + (err.error || res.status));
      return;
    }
    alert('Saved');
  }
  return <PostForm initial={initial} onSubmit={onSubmit} submitLabel="Save"/>;
}

// Client buttons: open public URL and trigger redeploy
function PublishActions({ id, slug, hasDeployHook }: { id: number; slug: string; hasDeployHook: boolean }) {
  async function redeploy() {
    const res = await fetch('/api/admin/redeploy', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Redeploy failed: ' + (err.error || res.status));
      return;
    }
    alert('Redeploy triggered. Vercel will rebuild static pages.');
  }
  return (
    <div className="flex items-center gap-3">
      <a className="rounded-md border px-3 py-1.5 text-sm" href={`/${slug}`} target="_blank" rel="noopener noreferrer">View Public Page</a>
      {hasDeployHook ? (
        <button onClick={redeploy} className="rounded-md border px-3 py-1.5 text-sm">Publish & Redeploy</button>
      ) : (
        <span className="text-xs text-gray-500">Deploy Hook not configured. Deploy manually after saving.</span>
      )}
    </div>
  );
}
