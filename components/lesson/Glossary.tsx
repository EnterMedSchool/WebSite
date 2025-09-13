"use client";

import { useMemo, useState } from "react";

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
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Term | null>(null);
  const filtered = useMemo(() => list.filter(t => t.term.toLowerCase().includes(q.toLowerCase())), [q, list]);
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 rounded-2xl border bg-white/95 p-4 shadow-sm ring-1 ring-black/5">
        <div className="mb-2 text-xs font-semibold tracking-wide text-indigo-700">Glossary</div>
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Search terms"
          className="mb-2 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="max-h-64 overflow-auto pr-1">
          <ul className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <li key={t.term} className="py-2">
                <button onClick={() => setOpen(t)} className="w-full text-left">
                  <div className="text-sm font-semibold text-gray-900 hover:underline">{t.term}</div>
                  <div className="text-[12px] text-gray-600 line-clamp-2">{t.blurb}</div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="py-4 text-center text-sm text-gray-500">No matching terms</li>
            )}
          </ul>
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
            <div className="mt-3 flex items-center justify-between text-[12px] text-gray-500">
              <button className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">Save to notes</button>
              <div>Related lessons (coming soon)</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
