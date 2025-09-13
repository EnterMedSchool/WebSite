"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TrendChart, { TrendSeries } from "@/components/charts/TrendChart";

// All optimization and batching removed. This component no longer
// fetches any data; it only renders what is passed via `prefetch`.

export default function MiniTrend({ uni, id, root, prefetch }: { uni: string; id?: number; root?: Element | null; prefetch?: { points?: Array<{ year: number; type: string; score: number }>; seats?: Array<{ year: number; type: string; seats: number }> } }) {
  const [series, setSeries] = useState<TrendSeries[] | null>(null);
  const [seats, setSeats] = useState<{ eu?: number; nonEu?: number; year?: number }>({});
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  // If prefetch is provided (from /api/universities), hydrate immediately.
  // Only skip network fetch when we actually have points; otherwise allow fetch.
  useEffect(() => {
    if (!prefetch) return;
    const prePts = Array.isArray(prefetch.points) ? prefetch.points : [];
    const preSeats = Array.isArray(prefetch.seats) ? prefetch.seats : [];
    const euPts = prePts.filter((p: any) => p.type === "EU").map((p: any) => ({ year: p.year, type: p.type, score: p.score }));
    const nePts = prePts.filter((p: any) => p.type === "NonEU").map((p: any) => ({ year: p.year, type: p.type, score: p.score }));
    const out: TrendSeries[] = [];
    if (euPts.length) out.push({ uni: "EU", points: euPts });
    if (nePts.length) out.push({ uni: "NonEU", points: nePts });
    if (out.length) setSeries(out);
    if (preSeats.length) {
      const latestYear = Math.max(...(preSeats.map((x: any) => x.year) ?? [0]));
      const eu = preSeats.find((x: any) => x.year === latestYear && x.type === "EU")?.seats;
      const nonEu = preSeats.find((x: any) => x.year === latestYear && x.type === "NonEU")?.seats;
      setSeats({ eu, nonEu, year: latestYear > 0 ? latestYear : undefined });
    }
    setShouldLoad(!(out.length > 0));
  }, [prefetch]);

  // Previously deferred network loading; now only toggles internal state
  useEffect(() => {
    const hasPrefetchedPoints = !!(prefetch && Array.isArray(prefetch.points) && prefetch.points.length > 0);
    if (shouldLoad || hasPrefetchedPoints) return;
    const el = holderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0) {
            setShouldLoad(true);
            break;
          }
        }
      },
      { root: root ?? null, rootMargin: "200px 0px", threshold: [0, 0.01] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [root, shouldLoad, prefetch?.points]);

  useEffect(() => {
    // No network load; if nothing was prefetched, remain empty
    if (!shouldLoad) return;
    setSeries((s) => s ?? []);
  }, [shouldLoad]);

  const noData = !series || series.length === 0;

  return (
    <div ref={holderRef} className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <TrendChart series={series ?? []} mode="All" compact className="ring-1 ring-gray-200/60 w-full" />
      </div>
      <div className="grid w-[132px] grid-rows-2 gap-2">
        <div className="rounded-xl bg-indigo-50 px-2 py-1.5 text-indigo-800 ring-1 ring-indigo-200/60">
          <div className="text-[9px] font-semibold uppercase tracking-wide">EU</div>
          <div className="text-base font-extrabold leading-5">{seats.eu ?? (noData ? "-" : "-")}</div>
          <div className="text-[9px] text-indigo-700/70">{seats.year ? `seats in ${seats.year}` : ""}</div>
        </div>
        <div className="rounded-xl bg-amber-50 px-2 py-1.5 text-amber-800 ring-1 ring-amber-200/60">
          <div className="text-[9px] font-semibold uppercase tracking-wide">NonEU</div>
          <div className="text-base font-extrabold leading-5">{seats.nonEu ?? (noData ? "—" : "—")}</div>
          <div className="text-[9px] text-amber-700/70">{seats.year ? `seats in ${seats.year}` : ""}</div>
        </div>
      </div>
    </div>
  );
}

