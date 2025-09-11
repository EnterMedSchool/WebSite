"use client";

import dynamic from "next/dynamic";

const LearningGraph = dynamic(() => import("@/components/graph/LearningGraph"), { ssr: false });

export default function GraphPage() {
  return (
    <main className="mx-auto max-w-[1600px] px-4">
      <div className="py-6">
        <h1 className="text-2xl font-bold">Learning Graph</h1>
        <p className="text-sm text-gray-600">Click a lesson to highlight all its prerequisites. Data loads from static files — no API calls.</p>
      </div>
      <LearningGraph />
    </main>
  );
}

