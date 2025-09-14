"use client";

import { useEffect, useState } from "react";

export default function LessonBody({ slug, html: htmlProp, noApi }: { slug: string; html?: string; noApi?: boolean }) {
  const [html, setHtml] = useState<string>(htmlProp || "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);

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
    <div className="prose prose-indigo relative max-w-none text-sm" onClick={async (e) => {
      const el = (e.target as HTMLElement)?.closest('.glossary-term') as HTMLElement | null;
      if (!el) return;
      const id = el.getAttribute('data-term-id') || '';
      const choices = el.getAttribute('data-choices') || '';
      const pickId = (choices ? choices.split(',')[0] : id) || '';
      if (!pickId) return;
      e.preventDefault();
      setOpenId(pickId);
      try {
        const r = await fetch(`/glossary/terms/${encodeURIComponent(pickId)}.json`, { cache: 'force-cache' });
        setPreview(await r.json());
      } catch {}
    }}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {openId && preview && (
        <div className="fixed inset-x-0 top-12 z-40 mx-auto w-full max-w-lg rounded-xl border bg-white p-3 text-sm shadow ring-1 ring-black/5" onClick={(e)=>e.stopPropagation()}>
          <div className="mb-1 flex items-center justify-between">
            <div className="font-semibold text-gray-900">{preview.title || openId}</div>
            <button className="rounded-md bg-gray-100 px-2 py-1 text-xs" onClick={()=>setOpenId(null)}>Close</button>
          </div>
          {preview.definition && <div className="text-gray-700">{preview.definition}</div>}
        </div>
      )}
      <style>{`.glossary-term{ text-decoration: underline dotted; text-underline-offset: 2px; cursor: help; }`}</style>
    </div>
  );
}
