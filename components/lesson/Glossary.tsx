"use client";

import { useState } from "react";

type Term = { term: string; blurb: string };

export default function Glossary({ terms }: { terms?: Term[] }) {
  const list: Term[] = terms?.length
    ? terms
    : [
        { term: "Thrombosis", blurb: "Pathologic formation of a blood clot within a vessel." },
        { term: "Fibrinogen", blurb: "Soluble protein converted to fibrin during clot formation." },
        { term: "D-dimer", blurb: "Fibrin degradation product used to detect clot breakdown." },
        { term: "aPTT", blurb: "Intrinsic pathway coagulation test." },
      ];
  const [open, setOpen] = useState<Term | null>(null);
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 rounded-2xl border bg-white/90 p-4 shadow-sm ring-1 ring-black/5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">Glossary</div>
        <div className="flex flex-wrap gap-1">
          {list.map((t) => (
            <button
              key={t.term}
              onClick={() => setOpen(t)}
              className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100"
            >
              {t.term}
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 p-4" onClick={() => setOpen(null)}>
          <div className="max-w-md rounded-2xl border bg-white p-4 shadow-lg ring-1 ring-black/5" onClick={(e)=>e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <div className="text-sm font-semibold text-indigo-900">{open.term}</div>
              <button onClick={() => setOpen(null)} className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">Close</button>
            </div>
            <div className="text-sm text-gray-700">{open.blurb}</div>
            <div className="mt-3 text-[12px] text-gray-500">Related lessons (coming soon)</div>
          </div>
        </div>
      )}
    </aside>
  );
}

