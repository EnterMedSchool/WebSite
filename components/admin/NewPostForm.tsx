"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);
}

export default function NewPostForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("# Hello world\n\nWrite your post in Markdown.");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const derivedSlug = useMemo(() => (slug ? slugify(slug) : slugify(title)), [slug, title]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, slug: derivedSlug, published }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Save failed (${res.status})`);
      }
      const { slug: createdSlug } = await res.json();
      router.push(`/blog/${createdSlug}`);
    } catch (err: any) {
      setError(String(err.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Slug (optional)</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={derivedSlug}
        />
        <p className="mt-1 text-xs text-gray-500">Final: /blog/{derivedSlug || "your-slug"}</p>
      </div>
      <div>
        <label className="block text-sm font-medium">Body (Markdown)</label>
        <textarea
          className="mt-1 h-64 w-full rounded border px-3 py-2 font-mono"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input id="published" type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        <label htmlFor="published" className="text-sm">Published</label>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50"
      >
        {saving ? "Saving..." : "Create Post"}
      </button>
    </form>
  );
}

