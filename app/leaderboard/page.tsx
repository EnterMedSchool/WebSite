"use client";

import { useState } from "react";

export default function LeaderboardPage() {
  const [range, setRange] = useState<"weekly" | "all">("weekly");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => setRange("weekly")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${range === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Weekly</button>
        <button onClick={() => setRange("all")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${range === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All Time</button>
      </div>
      <div className="rounded-2xl border border-indigo-200 bg-white p-6 text-gray-800 shadow">
        <div className="text-lg font-bold text-indigo-700">Leaderboard Rebuild In Progress</div>
        <p className="mt-2 text-sm">The leaderboard and related functionality are temporarily disabled while we rebuild the system. This page remains as a UI placeholder.</p>
      </div>
    </div>
  );
}
