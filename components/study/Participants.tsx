"use client";

import { useStudyStore } from "@/lib/study/store";

export default function Participants() {
  const participants = useStudyStore((s) => s.participants);
  return (
    <div className="border rounded p-4">
      <h2 className="font-semibold mb-3">Participants ({participants.length})</h2>
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

