"use client";

import dynamic from "next/dynamic";
const WowGraph = dynamic(() => import("@/components/graph/WowGraph"), { ssr: false });

export default function GraphPage() {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100">
      <div className="mx-auto grid h-full max-w-[1700px] grid-cols-12 gap-4 px-4 py-4">
        {/* Left sidebar (non-functional placeholders) */}
        <aside className="col-span-3 hidden flex-col gap-4 lg:flex">
          <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/5">
            <div className="mb-2 text-sm font-semibold text-slate-200">Search Concepts</div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 p-2 ring-1 ring-white/10">
              <input placeholder="Search topics, lessons…" className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none" />
              <span className="rounded-md bg-indigo-600/80 px-2 py-1 text-xs">⌘K</span>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/5">
            <div className="mb-2 text-sm font-semibold text-slate-200">Popular Concepts</div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="rounded-lg bg-slate-900/40 p-2">Action Potentials</li>
              <li className="rounded-lg bg-slate-900/40 p-2">Glycolysis</li>
              <li className="rounded-lg bg-slate-900/40 p-2">Hemoglobin Curve</li>
              <li className="rounded-lg bg-slate-900/40 p-2">Cardiac Cycle</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/5">
            <div className="mb-2 text-sm font-semibold text-slate-200">Latest Concepts</div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="rounded-lg bg-slate-900/40 p-2">CRISPR Applications</li>
              <li className="rounded-lg bg-slate-900/40 p-2">Immunotherapy Basics</li>
              <li className="rounded-lg bg-slate-900/40 p-2">Nephron Transporters</li>
            </ul>
          </div>
        </aside>

        {/* Center canvas */}
        <main className="col-span-12 lg:col-span-6 xl:col-span-7">
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-white">Learning Graph</h1>
            <p className="text-sm text-slate-300">Click a lesson to animate the full prerequisite chain.</p>
          </div>
          <div className="h-[calc(100vh-130px)] w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
            <WowGraph />
          </div>
        </main>

        {/* Right sidebar placeholder */}
        <aside className="col-span-3 hidden flex-col gap-4 xl:flex">
          <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/5">
            <div className="mb-2 text-sm font-semibold text-slate-200">Filters</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button className="rounded-lg bg-indigo-600/80 px-2 py-1">Required</button>
              <button className="rounded-lg bg-slate-900/60 px-2 py-1 ring-1 ring-white/10">Recommended</button>
              <button className="col-span-2 rounded-lg bg-slate-900/60 px-2 py-1 ring-1 ring-white/10">Show Completed</button>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-800/60 p-4 ring-1 ring-white/5">
            <div className="mb-2 text-sm font-semibold text-slate-200">Categories</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-pink-600/70 px-2 py-1">Anatomy</span>
              <span className="rounded-full bg-emerald-600/70 px-2 py-1">Physiology</span>
              <span className="rounded-full bg-sky-600/70 px-2 py-1">Biochem</span>
              <span className="rounded-full bg-amber-600/70 px-2 py-1">Path</span>
              <span className="rounded-full bg-violet-600/70 px-2 py-1">Pharm</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
