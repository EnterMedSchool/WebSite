"use client";

import { useEffect, useState } from "react";

export default function LessonBody({ slug, html: htmlProp, noApi }: { slug: string; html?: string; noApi?: boolean }) {
  const [html, setHtml] = useState<string>(htmlProp || "");

  useEffect(() => {
    if (htmlProp != null) { setHtml(htmlProp); return; }
    if (!slug) return;
    // For guests, avoid serverless requests entirely when instructed
    if (noApi) { setHtml(""); return; }
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/lesson/${encodeURIComponent(slug)}/body`, { cache: 'no-store' });
        const j = await r.json();
        if (!alive) return;
        setHtml(String(j?.html || ""));
      } catch {
        if (!alive) return;
        setHtml("");
      }
    })();
    return () => { alive = false; };
  }, [slug, htmlProp, noApi]);

  if (!html) return null;
  return (
    <div className="prose prose-indigo relative max-w-none text-sm">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
