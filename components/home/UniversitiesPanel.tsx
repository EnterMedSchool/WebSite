"use client";

import { useRouter } from "next/navigation";

type City = {
  city: string;
  lat: number;
  lng: number;
  uni: string;
  kind?: "public" | "private";
  logo?: string;
  rating?: number;
  lastScore?: number;
  photos?: string[];
  orgs?: string[];
  article?: { title: string; href?: string };
};

export default function UniversitiesPanel({ selectedName, items, topOffset = 4, onAddCompare, compareSet }: { selectedName: string; items: City[]; topOffset?: number; onAddCompare?: (item: City & { country?: string }) => void; compareSet?: Set<string> }) {
  const router = useRouter();
  const PANEL_GUTTER = 8;
  const PANEL_TOP_GAP = topOffset;

  return (
    <div
      className="pointer-events-auto absolute left-3 z-20 w-[min(520px,42vw)] rounded-2xl border bg-white/95 p-4 shadow-2xl backdrop-blur overflow-hidden"
      style={{ top: PANEL_TOP_GAP, bottom: PANEL_GUTTER, maxHeight: `calc(100% - ${PANEL_TOP_GAP + PANEL_GUTTER}px)` }}
    >
      <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">{selectedName}</div>
      <div className="space-y-3 max-h-full overflow-auto pr-1">
        {items.map((c, i) => (
          <div key={`${c.city}-${i}`} className="rounded-xl border p-3 hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                {c.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logo} alt="logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-indigo-700">{c.city[0]}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{c.uni}</div>
                <div className="text-sm text-gray-500">
                  {c.city}
                  {c.kind ? ` • ${c.kind === "private" ? "Private" : "Public"}` : ""}
                </div>
              </div>
              {typeof c.rating === "number" && (
                <div className="ml-auto text-sm font-semibold text-gray-700">⭐ {c.rating.toFixed(1)}</div>
              )}
            </div>

            {/* Meta grid */}
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="col-span-1 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
                <div className="font-semibold text-gray-700">Last Score</div>
                <div className="mt-1 text-gray-800">{c.lastScore != null ? `${c.lastScore}/100` : "—"}</div>
              </div>
              <div className="col-span-2 rounded-lg bg-gray-50 p-2">
                <div className="mb-1 text-xs font-semibold text-gray-700">Gallery</div>
                <div className="flex gap-1">
                  {(c.photos ?? []).slice(0, 3).map((src, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={src} alt="photo" className="h-12 w-12 rounded object-cover" />
                  ))}
                  {(!c.photos || c.photos.length === 0) && (
                    <div className="h-12 w-full min-w-[6rem] rounded bg-gray-100 text-[10px] text-gray-500 grid place-items-center">
                      No images
                    </div>
                  )}
                </div>
              </div>
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

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAddCompare?.({ ...c, country: selectedName })}
                className={`rounded-lg px-2 py-1 text-xs font-semibold ${compareSet?.has(c.uni) ? "bg-green-50 text-green-700" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
              >
                {compareSet?.has(c.uni) ? "Added to Compare" : "Add to Compare"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
