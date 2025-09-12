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
          <div className="h-full max-h-full overflow-auto rounded-2xl bg-white/95 p-3 text-gray-900 ring-1 ring-black/5" ref={listRef}>
            <div className="space-y-3">
              {items.map((c, i) => (
                <div key={`${c.city}-${i}`} className="group rounded-xl border p-3 hover:bg-gray-50 transition-all" onMouseEnter={() => onHover?.(c)} onMouseLeave={() => onHover?.(null)}>
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
                <div className="text-sm text-gray-500">{c.city}{c.kind ? ' • ' + (c.kind === 'private' ? 'Private' : 'Public') : ''}</div>
              </div>
              {typeof (c as any).emsCount === 'number' && (
                <div className="ml-auto text-[11px] font-semibold text-indigo-700 bg-indigo-50 rounded-full px-2 py-0.5 ring-1 ring-indigo-200">EMS {(c as any).emsCount}</div>
              )}
              {typeof c.rating === 'number' && (
                <div className="ml-2 text-sm font-semibold text-gray-700">★ {c.rating.toFixed(1)}</div>
              )}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="col-span-3 rounded-lg bg-gray-50 p-2">
                <div className="mb-1 text-xs font-semibold text-gray-700">Gallery</div>
                <div className="flex gap-1">
                  {(c.photos ?? []).slice(0, 3).map((src, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={src} alt="photo" className="h-12 w-12 rounded object-cover" loading="lazy" decoding="async" fetchPriority="low" />
                  ))}
                  {(!c.photos || c.photos.length === 0) && (
                    <div className="min-h-[28px] w-full min-w-[6rem] rounded bg-gray-100/70 px-2 py-1 text-[10px] text-gray-500 grid place-items-center">No images</div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 cursor-pointer rounded-2xl bg-gray-50 p-2 transition-all hover:ring-2 hover:ring-indigo-200" onClick={() => { const slug = (c.uni || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); try { router.push(`/university/${encodeURIComponent(slug)}`); } catch {} }}>
              <MiniTrend uni={c.uni} id={c.id} root={listRef.current} prefetch={{ points: (c as any).trendPoints, seats: (c as any).trendSeats }} />
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DeadlineStrip opens={(c as any).admOpens} deadline={(c as any).admDeadline} results={(c as any).admResults} />
              <CostTile city={c.city} rent={(c as any).costRent} foodIndex={(c as any).costFoodIndex} transport={(c as any).costTransport} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button type="button" onClick={() => onAddCompare?.({ ...c, country: selectedName })} className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${compareSet?.has(c.uni) ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700'}`}>{compareSet?.has(c.uni) ? 'Added to Compare' : 'Add to Compare'}</button>
              <button type="button" onClick={() => onToggleSave?.({ ...c, country: selectedName })} className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${(typeof savedSet !== 'undefined' && savedSet?.has(c.uni)) ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-white text-pink-600 ring-1 ring-pink-200 hover:bg-pink-50'}`}>{savedSet?.has(c.uni) ? 'Saved' : 'Save'}</button>
            </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
