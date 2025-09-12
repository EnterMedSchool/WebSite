"use client";

import { useEffect, useState } from "react";

export default function LessonBody({ slug }: { slug: string }) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/lesson/${encodeURIComponent(slug)}/body`, { cache: 'force-cache' });
        const j = await r.json();
        if (!alive) return;
        setHtml(String(j?.html || ""));
      } catch {
        if (!alive) return;
        setHtml("");
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  if (!html) return null;
  return (
    <div className="prose prose-indigo max-w-none text-sm">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <style>{`.glossary-term{ text-decoration: underline dotted; text-underline-offset: 2px; cursor: help; }`}</style>
    </div>
  );
}

