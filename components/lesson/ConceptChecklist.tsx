"use client";

import { useState } from "react";

export default function ConceptChecklist({ items, comingSoon }: { items: string[]; comingSoon?: boolean }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-2 text-sm font-semibold text-indigo-900">Concept check</div>
      {comingSoon && <div className="-mt-1 mb-3 text-[11px] text-gray-500">Smart concepts & syncing • coming soon</div>}
      <ul className="grid gap-2">
        {items.map((t, i) => (
          <li key={i} className={`group flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${checked[i] ? 'bg-emerald-50 border-emerald-200' : 'bg-white hover:bg-gray-50'}`}>
            <button
              className={`grid h-5 w-5 place-items-center rounded border text-[12px] font-bold ${checked[i] ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-500 border-gray-300'}`}
              onClick={() => setChecked((s) => ({ ...s, [i]: !s[i] }))}
              aria-pressed={!!checked[i]}
              aria-label={checked[i] ? 'Uncheck' : 'Check'}
            >
              {checked[i] ? '✓' : ''}
            </button>
            <span className={`flex-1 text-sm ${checked[i] ? 'text-emerald-800 line-through' : 'text-gray-900'}`}>Do you understand: {t}?</span>
            <span className="hidden text-[11px] text-gray-500 group-hover:inline">Details</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
