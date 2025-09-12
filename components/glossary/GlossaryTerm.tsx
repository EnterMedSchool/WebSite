"use client";

import { useEffect, useRef, useState } from "react";

type Preview = {
  id: string;
  title: string;
  definition?: string;
  primary_tag?: string;
  tags?: string[];
  image?: { src: string; alt?: string };
};

async function fetchPreview(id: string): Promise<Preview | null> {
  try {
    const r = await fetch(`/glossary/terms/${encodeURIComponent(id)}.json`, { cache: 'force-cache' });
    if (!r.ok) return null;
    return (await r.json()) as Preview;
  } catch { return null; }
}

export default function GlossaryTerm({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const [pv, setPv] = useState<Preview | null>(null);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open || pv) return;
    fetchPreview(id).then(setPv);
  }, [open, id, pv]);

  return (
    <span
      ref={ref}
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={"cursor-help underline decoration-dotted underline-offset-2 " + (className || "")}
      data-term-id={id}
    >
      {children}
      {open && (
        <span className="absolute z-50 ml-1 inline-block rounded-xl border bg-white p-3 text-sm shadow ring-1 ring-black/5">
          <div className="font-semibold text-gray-900">{pv?.title || id}</div>
          {pv?.definition && <div className="mt-1 max-w-[320px] text-gray-700">{pv.definition}</div>}
        </span>
      )}
    </span>
  );
}

