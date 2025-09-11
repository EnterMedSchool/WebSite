"use client";

import dynamic from "next/dynamic";
const WowGraph = dynamic(() => import("@/components/graph/WowGraph"), { ssr: false });

export default function GraphPage() {
  return (
    <main className="mx-auto max-w-[1600px] px-4">
      <div className="py-6">
        <h1 className="text-2xl font-bold">Learning Graph</h1>
        <p className="text-sm text-gray-600">Click a lesson to animate the full prerequisite chain. Data loads from static files — no API calls.</p>
      </div>
      <div className="h-[calc(100vh-12rem)]"><WowGraph /></div>
    </main>
  );
}
