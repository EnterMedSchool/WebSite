"use client";

import { useStudyStore } from "@/lib/study/store";

export default function Participants() {
  const participants = useStudyStore((s) => s.participants);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">Participants ({participants.length})</h2>
      <ul className="space-y-2">
        {participants.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            {p.image ? <img src={p.image} alt={p.name || String(p.id)} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-gray-300" />}
            <span>{p.name || p.username || `User #${p.id}`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
