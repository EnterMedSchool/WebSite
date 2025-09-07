"use client";

import MiniTrend from "@/components/home/MiniTrend";

type City = {
  city: string;
  lat: number;
  lng: number;
  uni: string;
  kind?: "public" | "private";
  country?: string;
  logo?: string;
  rating?: number;
  lastScore?: number;
  photos?: string[];
  orgs?: string[];
  article?: { title: string; href?: string };
};

export default function UniversitiesListMobile({ selectedName, items, onAddCompare, compareSet }: { selectedName: string; items: City[]; onAddCompare?: (item: City) => void; compareSet?: Set<string> }) {
  return (
    <div className="px-1">
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">{selectedName}</div>
      <div className="space-y-3">
        {items.map((c, i) => (
          <div key={`${c.city}-${i}`} className="rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.logo ? <img src={c.logo} alt="logo" className="h-full w-full object-cover" /> : <span className="text-sm font-semibold text-indigo-700">{c.city[0]}</span>}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{c.uni}</div>
                <div className="text-xs text-gray-500">{c.city}{c.kind ? ` · ${c.kind === 'private' ? 'Private' : 'Public'}` : ''}</div>
              </div>
              {typeof c.rating === "number" && (
                <div className="ml-auto text-xs font-semibold text-gray-700">⭐ {c.rating.toFixed(1)}</div>
              )}
            </div>
            <div className="mt-2">
              <MiniTrend uni={c.uni} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAddCompare?.(c)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${compareSet?.has(c.uni) ? "bg-green-600 text-white hover:bg-green-700" : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"}`}
              >
                {compareSet?.has(c.uni) ? "Added" : "Add to Compare"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

