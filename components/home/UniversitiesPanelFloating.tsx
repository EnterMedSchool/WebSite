"use client";

import { useMemo, useRef, useState } from "react";
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
  language?: string;
  exam?: string;
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
  emsCount?: number;
};

export default function UniversitiesPanelFloating({ selectedName, items, onAddCompare, compareSet, onHover, savedSet, onToggleSave }: { selectedName: string; items: City[]; onAddCompare?: (item: City & { country?: string }) => void; compareSet?: Set<string>; onHover?: (item: City | null) => void; savedSet?: Set<string>; onToggleSave?: (item: City & { country?: string }) => void }) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<City | null>(null);

  const langs = useMemo(() => new Set((items || []).map((i: any) => (i as any).language || '').filter(Boolean)), [items]);
  const exams = useMemo(() => new Set((items || []).map((i: any) => (i as any).exam || '').filter(Boolean)), [items]);
  const emsTotal = useMemo(() => (items || []).reduce((s, i) => s + (Number((i as any).emsCount || 0)), 0), [items]);

  return (
    <div className="h-full">
      <div className="flex h-full flex-col rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-4 text-white shadow-[0_14px_40px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20 backdrop-blur">
        <div className="mb-3">
          <div className="ems-win-drag cursor-move text-sm font-extrabold uppercase tracking-wide text-white/90">{selectedName}</div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/20"><div className="text-[11px] text-indigo-50">Universities</div><div className="text-base font-bold text-white">{items.length}</div></div>
            <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/20"><div className="text-[11px] text-indigo-50">Languages</div><div className="text-base font-bold text-white">{langs.size}</div></div>
            <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/20"><div className="text-[11px] text-indigo-50">Exams</div><div className="text-base font-bold text-white">{exams.size}</div></div>
            <div className="rounded-lg bg-white/10 p-2 ring-1 ring-white/20"><div className="text-[11px] text-indigo-50">EMS Students</div><div className="text-base font-extrabold text-white">{emsTotal}</div></div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="relative h-full max-h-full overflow-hidden rounded-2xl bg-white/95 p-3 text-gray-900 ring-1 ring-black/5" ref={listRef}>
            {/* Compact chips list */}
            <div className="flex h-full flex-wrap content-start gap-2 overflow-auto pr-1">
              {items.map((c, i) => (
                <button
                  key={`${c.city}-${i}`}
                  type="button"
                  onMouseEnter={() => onHover?.(c)}
                  onMouseLeave={() => onHover?.(null)}
                  onClick={() => setActive(c)}
                  className="group inline-flex max-w-full items-center gap-2 rounded-full bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 ring-1 ring-gray-200 transition hover:bg-indigo-50 hover:text-indigo-800 hover:ring-indigo-200"
                  title={`${c.uni} — ${c.city}`}
                >
                  <span className="relative grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-indigo-100">
                    {c.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logo} alt="logo" className="h-full w-full object-cover" loading="lazy" decoding="async" fetchPriority="low" />
                    ) : (
                      <span className="text-[10px] font-extrabold text-indigo-700">{c.city[0]}</span>
                    )}
                  </span>
                  <span className="truncate max-w-[12rem]">{c.uni}</span>
                </button>
              ))}
            </div>

            {/* Detail overlay when a university is chosen */}
            {active && (
              <div className="absolute inset-0 z-10 rounded-2xl bg-white p-3 ring-1 ring-black/10 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center">
                    {active.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={active.logo} alt="logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold text-indigo-700">{active.city[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-gray-900">{active.uni}</div>
                    <div className="text-sm text-gray-600">{active.city}{active.kind ? ` · ${active.kind}` : ''}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {active.exam && (<span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200">{String(active.exam).toUpperCase()}</span>)}
                      {active.language && (<span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-teal-200">{String(active.language)}</span>)}
                      {typeof active.emsCount === 'number' && (<span className="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-pink-700 ring-1 ring-pink-200">EMS {active.emsCount}</span>)}
                    </div>
                  </div>
                  <button type="button" onClick={() => setActive(null)} className="ml-auto rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800" aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div className="mt-3 rounded-2xl bg-gray-50 p-2">
                  <MiniTrend uni={active.uni} id={active.id} root={listRef.current} prefetch={{ points: (active as any).trendPoints, seats: (active as any).trendSeats }} />
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <DeadlineStrip opens={(active as any).admOpens} deadline={(active as any).admDeadline} results={(active as any).admResults} />
                  <CostTile city={active.city} rent={(active as any).costRent} foodIndex={(active as any).costFoodIndex} transport={(active as any).costTransport} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => onAddCompare?.({ ...active, country: selectedName })} className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${compareSet?.has(active.uni) ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700'}`}>{compareSet?.has(active.uni) ? 'Added to Compare' : 'Add to Compare'}</button>
                  <button type="button" onClick={() => onToggleSave?.({ ...active, country: selectedName })} className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${(typeof savedSet !== 'undefined' && savedSet?.has(active.uni)) ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-white text-pink-600 ring-1 ring-pink-200 hover:bg-pink-50'}`}>{savedSet?.has(active.uni) ? 'Saved' : 'Save'}</button>
                  <button type="button" onClick={() => { const slug = (active.uni || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); try { router.push(`/university/${encodeURIComponent(slug)}`); } catch {} }} className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">Open page</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

