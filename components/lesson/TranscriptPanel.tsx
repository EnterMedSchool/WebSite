"use client";

import { useMemo, useState } from "react";

const DEMO = [
  { t: 5, text: "Definition and overview of DIC." },
  { t: 42, text: "Key laboratory findings and pathophysiology." },
  { t: 96, text: "Differential diagnosis and pitfalls." },
  { t: 140, text: "Management priorities and supportive care." },
];

export default function TranscriptPanel() {
  const [q, setQ] = useState("");
  const items = useMemo(() => DEMO.filter(i => i.text.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-indigo-900">Transcript & chapters</div>
        <div className="text-[11px] text-gray-500">Click to seek (UI only)</div>
      </div>
      <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search transcript" className="mb-2 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      <ul className="divide-y divide-gray-100">
        {items.map((i, idx) => (
          <li key={idx} className="flex items-center justify-between py-2">
            <button className="text-left text-sm text-gray-800 hover:underline">{i.text}</button>
            <button className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">{Math.floor(i.t/60)}:{(i.t%60).toString().padStart(2,'0')}</button>
          </li>
        ))}
        {items.length === 0 && <li className="py-4 text-center text-sm text-gray-500">No matches</li>}
      </ul>
    </div>
  );
}

