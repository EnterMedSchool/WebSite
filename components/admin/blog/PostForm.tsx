"use client";
import { useEffect, useMemo, useState } from "react";

export type PostFormValues = {
  slug: string;
  title: string;
  excerpt?: string;
  body: string;
  published?: boolean;
  noindex?: boolean;
  coverImageUrl?: string;
  coverImageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;
  structuredData?: any;
  tags?: string[] | string;
  authorName?: string;
  authorEmail?: string;
  publishedAt?: string; // ISO or datetime-local value
};

export default function PostForm({
  initial,
  onSubmit,
  submitLabel = "Save",
}: {
  initial?: Partial<PostFormValues>;
  onSubmit: (values: PostFormValues) => Promise<void> | void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<PostFormValues>({
    slug: initial?.slug || "",
    title: initial?.title || "",
    excerpt: initial?.excerpt || "",
    body: initial?.body || "",
    published: !!initial?.published,
    noindex: !!initial?.noindex,
    coverImageUrl: initial?.coverImageUrl || "",
    coverImageAlt: initial?.coverImageAlt || "",
    metaTitle: initial?.metaTitle || "",
    metaDescription: initial?.metaDescription || "",
    canonicalUrl: initial?.canonicalUrl || "",
    ogTitle: initial?.ogTitle || "",
    ogDescription: initial?.ogDescription || "",
    ogImageUrl: initial?.ogImageUrl || "",
    twitterCard: initial?.twitterCard || "summary_large_image",
    twitterTitle: initial?.twitterTitle || "",
    twitterDescription: initial?.twitterDescription || "",
    twitterImageUrl: initial?.twitterImageUrl || "",
    structuredData: initial?.structuredData ?? "",
    tags: Array.isArray(initial?.tags) ? (initial!.tags as string[]).join(", ") : (initial?.tags as string) || "",
    authorName: initial?.authorName || "",
    authorEmail: initial?.authorEmail || "",
    publishedAt: initial?.publishedAt ? new Date(initial.publishedAt as any).toISOString().slice(0,16) : "",
  });
  const [jsonError, setJsonError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setJsonError("");
  }, [values.structuredData]);

  function set<K extends keyof PostFormValues>(key: K, v: PostFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function fillArticleTemplate() {
    const iso = values.publishedAt ? new Date(values.publishedAt).toISOString() : new Date().toISOString();
    const data = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: values.metaTitle || values.title,
      description: values.metaDescription || values.excerpt || "",
      datePublished: iso,
      dateModified: iso,
      author: values.authorName ? { "@type": "Person", name: values.authorName } : undefined,
      image: values.ogImageUrl || values.coverImageUrl || undefined,
      mainEntityOfPage: values.canonicalUrl || undefined,
    };
    set("structuredData", JSON.stringify(data, null, 2));
  }

  function validateJson(): any | null {
    if (!values.structuredData) { setJsonError(""); return null; }
    try {
      const parsed = typeof values.structuredData === "string" ? JSON.parse(values.structuredData) : values.structuredData;
      setJsonError("");
      return parsed;
    } catch (e: any) {
      setJsonError(String(e?.message || e));
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sd = validateJson();
    if (jsonError) return;
    const payload: any = { ...values, structuredData: sd ?? undefined };
    setSaving(true);
    try {
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={values.title} onChange={(e)=>set("title", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input value={values.slug} onChange={(e)=>set("slug", e.target.value)} placeholder="imat" className="mt-1 w-full rounded-md border px-3 py-2 font-mono" required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Excerpt</label>
          <textarea value={values.excerpt} onChange={(e)=>set("excerpt", e.target.value)} rows={2} className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">HTML Content</label>
          <textarea value={values.body} onChange={(e)=>set("body", e.target.value)} rows={14} className="mt-1 w-full rounded-md border px-3 py-2 font-mono" placeholder="<h1>...</h1>" required />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Publication</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!values.published} onChange={(e)=>set("published", e.target.checked)} /> Published</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!values.noindex} onChange={(e)=>set("noindex", e.target.checked)} /> Noindex</label>
          <div>
            <label className="block text-sm font-medium">Published At</label>
            <input type="datetime-local" value={values.publishedAt} onChange={(e)=>set("publishedAt", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Images</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Cover Image URL</label>
            <input value={values.coverImageUrl} onChange={(e)=>set("coverImageUrl", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Cover Image Alt</label>
            <input value={values.coverImageAlt} onChange={(e)=>set("coverImageAlt", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-800">SEO</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Meta Title</label>
            <input value={values.metaTitle} onChange={(e)=>set("metaTitle", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Meta Description</label>
            <input value={values.metaDescription} onChange={(e)=>set("metaDescription", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Canonical URL</label>
            <input value={values.canonicalUrl} onChange={(e)=>set("canonicalUrl", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Tags (comma separated)</label>
            <input value={values.tags as any} onChange={(e)=>set("tags", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Open Graph</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">OG Title</label>
            <input value={values.ogTitle} onChange={(e)=>set("ogTitle", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">OG Description</label>
            <input value={values.ogDescription} onChange={(e)=>set("ogDescription", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">OG Image URL</label>
            <input value={values.ogImageUrl} onChange={(e)=>set("ogImageUrl", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Twitter</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium">Card</label>
            <select value={values.twitterCard} onChange={(e)=>set("twitterCard", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
              <option value="summary">summary</option>
              <option value="summary_large_image">summary_large_image</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input value={values.twitterTitle} onChange={(e)=>set("twitterTitle", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input value={values.twitterDescription} onChange={(e)=>set("twitterDescription", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Image URL</label>
            <input value={values.twitterImageUrl} onChange={(e)=>set("twitterImageUrl", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-800">JSON‑LD Structured Data</h3>
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-md border px-3 py-1.5 text-sm" onClick={fillArticleTemplate}>Fill BlogPosting template</button>
          <button type="button" className="rounded-md border px-3 py-1.5 text-sm" onClick={validateJson}>Validate</button>
          {jsonError ? <span className="text-sm text-red-600">{jsonError}</span> : <span className="text-sm text-green-700">{values.structuredData ? "Valid" : ""}</span>}
        </div>
        <textarea value={typeof values.structuredData === 'string' ? values.structuredData : JSON.stringify(values.structuredData ?? "", null, 2)} onChange={(e)=>set("structuredData", e.target.value)} rows={10} className="mt-2 w-full rounded-md border px-3 py-2 font-mono" placeholder='{"@context":"https://schema.org","@type":"BlogPosting",...}' />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Author</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Author Name</label>
            <input value={values.authorName} onChange={(e)=>set("authorName", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Author Email</label>
            <input value={values.authorEmail} onChange={(e)=>set("authorEmail", e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-60">{saving ? "Saving..." : submitLabel}</button>
      </div>
    </form>
  );
}

