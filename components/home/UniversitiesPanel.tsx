"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import MiniTrend from "@/components/home/MiniTrend";
import DeadlineStrip from "@/components/home/DeadlineStrip";
import CostTile from "@/components/home/CostTile";

type City = {
  id?: number;
  slug?: string;
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
  costRent?: number;
  costFoodIndex?: number;
  costTransport?: number;
  admOpens?: string;
  admDeadline?: string;
  admResults?: string;
  trendPoints?: Array<{ year: number; type: string; score: number }>;
  trendSeats?: Array<{ year: number; type: string; seats: number }>;
};

export default function UniversitiesPanel({ selectedName, items, topOffset = 4, onAddCompare, compareSet, onHover, savedSet, onToggleSave }: { selectedName: string; items: City[]; topOffset?: number; onAddCompare?: (item: City & { country?: string }) => void; compareSet?: Set<string>; onHover?: (item: City | null) => void; savedSet?: Set<string>; onToggleSave?: (item: City & { country?: string }) => void }) {
  const router = useRouter();
  const PANEL_GUTTER = 8;
  const PANEL_TOP_GAP = topOffset;
  const langs = new Set((items || []).map((i: any) => (i as any).language || '').filter(Boolean));
  const exams = new Set((items || []).map((i: any) => (i as any).exam || '').filter(Boolean));
  const listRef = useRef<HTMLDivElement | null>(null);
  const enriched = (items || []).some((i: any) => Array.isArray((i as any).trendPoints) && (i as any).trendPoints.length > 0);

  return (
    <div
      className="pointer-events-auto absolute right-3 z-20 w-[min(520px,42vw)] rounded-2xl border bg-white/95 p-4 shadow-2xl backdrop-blur overflow-hidden"
      style={{ top: PANEL_TOP_GAP, bottom: PANEL_GUTTER, maxHeight: `calc(100% - ${PANEL_TOP_GAP + PANEL_GUTTER}px)` }}
    >
      <div className="mb-3">
        <div className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{selectedName}</div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-gray-200"><div className="text-[11px] text-gray-600">Universities</div><div className="text-base font-bold text-gray-900">{items.length}</div></div>
          <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-gray-200"><div className="text-[11px] text-gray-600">Languages</div><div className="text-base font-bold text-gray-900">{langs.size}</div></div>
          <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-gray-200"><div className="text-[11px] text-gray-600">Exams</div><div className="text-base font-bold text-gray-900">{exams.size}</div></div>
        </div>
        {!enriched && (
          <div className="mt-2 text-xs text-gray-500">Loading details…</div>
        )}
      </div>
      <div className="space-y-3 max-h-full overflow-auto pr-1" ref={listRef}>
        {items.map((c, i) => (
          <div
            key={`${c.city}-${i}`}
            className="group rounded-xl border p-3 hover:bg-gray-50 transition-all"
            onMouseEnter={() => onHover?.(c)}
            onMouseLeave={() => onHover?.(null)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                {c.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logo} alt="logo" className="h-full w-full object-cover" loading="lazy" decoding="async" fetchPriority="low" />
                ) : (
                  <span className="text-lg font-semibold text-indigo-700">{c.city[0]}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{c.uni}</div>
                <div className="text-sm text-gray-500">
                  {c.city}
                  {c.kind && (
                    <>
                      {" · "}
                      {c.kind === "private" ? "Private" : "Public"}
                    </>
                  )}
                </div>
              </div>
              {typeof c.rating === "number" && (
                <div className="ml-auto text-sm font-semibold text-gray-700">⭐ {c.rating.toFixed(1)}</div>
              )}
              {/* Favorite heart (placeholder) */}
              <button aria-label="Favorite" title="Favorite" className="ml-2 rounded-full bg-gray-100 p-1 text-gray-500 transition-colors hover:bg-pink-50 hover:text-pink-600">
                ♥
              </button>
            </div>

            {/* Meta grid */}
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="col-span-3 rounded-lg bg-gray-50 p-2">
                <div className="mb-1 text-xs font-semibold text-gray-700">Gallery</div>
                <div className="flex gap-1">
                  {(c.photos ?? []).slice(0, 3).map((src, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={src} alt="photo" className="h-12 w-12 rounded object-cover" loading="lazy" decoding="async" fetchPriority="low" />
                  ))}
                  {(!c.photos || c.photos.length === 0) && (
                    <div className="min-h-[28px] w-full min-w-[6rem] rounded bg-gray-100/70 px-2 py-1 text-[10px] text-gray-500 grid place-items-center">
                      No images
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trend + seats */}
            <div
              className="mt-2 cursor-pointer rounded-2xl bg-gray-50 p-2 transition-all hover:ring-2 hover:ring-indigo-200"
              onClick={() => {
                const slug = (c.uni || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                try {
                  router.push(`/university/${encodeURIComponent(slug)}`);
                } catch {}
              }}
            >
              <MiniTrend
                uni={c.uni}
                id={(c as any).id}
                root={listRef.current}
                prefetch={{ points: (c as any).trendPoints, seats: (c as any).trendSeats }}
              />
            </div>

            {/* Orgs + article */}
            {(c.orgs?.length || c.article) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {(c.orgs ?? []).slice(0, 3).map((o) => (
                  <span key={o} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {o}
                  </span>
                ))}
                {c.article && (
                  <button
                    type="button"
                    onClick={() => {
                      const slug = (c.uni || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                      try {
                        router.push(`/university/${encodeURIComponent(slug)}`);
                      } catch {}
                    }}
                    className="ml-auto text-xs text-indigo-600 underline"
                  >
                    {c.article.title}
                  </button>
                )}
              </div>
            )}

            {/* Decision aids (placeholders) */}
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DeadlineStrip opens={(c as any).admOpens} deadline={(c as any).admDeadline} results={(c as any).admResults} />
              <CostTile city={c.city} rent={(c as any).costRent} foodIndex={(c as any).costFoodIndex} transport={(c as any).costTransport} />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAddCompare?.({ ...c, country: selectedName })}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                  compareSet?.has(c.uni)
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
                }`}
              >
                {compareSet?.has(c.uni) ? "Added to Compare" : "Add to Compare"}
              </button>
              <button
                type="button"
                onClick={() => onToggleSave?.({ ...c, country: selectedName })}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                  (typeof savedSet !== 'undefined' && savedSet?.has(c.uni))
                    ? 'bg-pink-600 text-white hover:bg-pink-700'
                    : 'bg-white text-pink-600 ring-1 ring-pink-200 hover:bg-pink-50'
                }`}
              >
                {savedSet?.has(c.uni) ? 'Saved' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => { const slug = (c.uni || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); try { window.location.href = `/university/${encodeURIComponent(slug)}`; } catch {} }}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50"
              >
                Visit page
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



