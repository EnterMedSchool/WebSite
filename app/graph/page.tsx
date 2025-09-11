"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const LearningGraph = dynamic(() => import("@/components/graph/LearningGraph"), { ssr: false });
const WowGraph = dynamic(() => import("@/components/graph/WowGraph"), { ssr: false });

export default function GraphPage() {
  const [mode, setMode] = useState<"classic" | "animated">("classic");
  return (
    <main className="mx-auto max-w-[1600px] px-4">
      <div className="py-6">
        <h1 className="text-2xl font-bold">Learning Graph</h1>
        <p className="text-sm text-gray-600">Click a lesson to highlight all its prerequisites. Data loads from static files — no API calls.</p>
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-inset ring-gray-200 shadow-sm">
          <button onClick={() => setMode("classic")} className={`inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold transition ${mode==='classic' ? 'bg-white text-indigo-700 shadow' : 'text-gray-700 hover:text-indigo-700'}`}>Classic</button>
          <button onClick={() => setMode("animated")} className={`inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold transition ${mode==='animated' ? 'bg-white text-indigo-700 shadow' : 'text-gray-700 hover:text-indigo-700'}`}>Animated</button>
        </div>
      </div>
      <div className="h-[calc(100vh-12rem)]">
        {mode === 'classic' ? <LearningGraph /> : <WowGraph />}
      </div>
    </main>
  );
}
