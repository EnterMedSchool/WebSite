"use client";

import { useState } from "react";

export default function ConceptChecklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-2 text-sm font-semibold text-indigo-900">Concept check</div>
      <ul className="grid gap-2">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-3">
            <button
              className={`mt-0.5 grid h-5 w-5 place-items-center rounded border ${checked[i] ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-500'}`}
              onClick={() => setChecked((s) => ({ ...s, [i]: !s[i] }))}
              aria-pressed={!!checked[i]}
            >
              {checked[i] ? '✓' : ''}
            </button>
            <span className={`text-sm ${checked[i] ? 'text-gray-500 line-through' : 'text-gray-900'}`}>Do you understand: {t}?</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

