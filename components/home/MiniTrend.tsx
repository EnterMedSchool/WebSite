"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TrendChart, { TrendSeries } from "@/components/charts/TrendChart";

// Simple in-memory cache shared across component instances per page load
const _seriesCache = new Map<string, any>();
const _pending = new Set<string>();
const _resolvers = new Map<string, Array<(v: any) => void>>();
let _flushTimer: any = null;

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

async function enqueueLoad(slug: string): Promise<any> {
  const ver = process.env.NEXT_PUBLIC_UNIS_DATA_V ? `&_v=${process.env.NEXT_PUBLIC_UNIS_DATA_V}` : "";
  const key = `/api/compare/scores?unis=${slug}${ver}`;
  if (_seriesCache.has(key)) return _seriesCache.get(key);
  return new Promise((resolve) => {
    const list = _resolvers.get(slug) || [];
    list.push(resolve);
    _resolvers.set(slug, list);
    _pending.add(slug);
    if (_flushTimer) return;
    _flushTimer = setTimeout(async () => {
      const batch = Array.from(_pending);
      _pending.clear();
      _flushTimer = null;
      try {
        const url = `/api/compare/scores?unis=${encodeURIComponent(batch.join(","))}${ver}`;
        const res = await fetch(url);
        const json = await res.json();
        // Build cache entries per slug
        const bySlug = new Map<string, any>();
        for (const s of json.series || []) {
          const sl = slugify(s.uni || "");
          bySlug.set(sl, { series: [s] });
        }
        for (const s of batch) {
          const entry = bySlug.get(s) || { series: [] };
          _seriesCache.set(`/api/compare/scores?unis=${s}${ver}`, entry);
          const resolvers = _resolvers.get(s) || [];
          _resolvers.delete(s);
          resolvers.forEach((fn) => fn(entry));
        }
      } catch {
        for (const s of batch) {
          const entry = { series: [] };
          _seriesCache.set(`/api/compare/scores?unis=${s}${ver}`, entry);
          const resolvers = _resolvers.get(s) || [];
          _resolvers.delete(s);
          resolvers.forEach((fn) => fn(entry));
        }
      }
    }, 40); // small delay to coalesce many minis
  });
}

export default function MiniTrend({ uni, id, root, prefetch }: { uni: string; id?: number; root?: Element | null; prefetch?: { points?: Array<{ year: number; type: string; score: number }>; seats?: Array<{ year: number; type: string; seats: number }> } }) {
  const slug = useMemo(() => uni.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), [uni]);
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

  // Defer network work until item is near visible
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
    if (!shouldLoad) return;
    let off = false;
    (async () => {
      try {
        // Dedupe across instances in the same session
        const ver = process.env.NEXT_PUBLIC_UNIS_DATA_V ? `&_v=${process.env.NEXT_PUBLIC_UNIS_DATA_V}` : "";
        const key = id ? `/api/compare/scores?ids=${id}${ver}` : `/api/compare/scores?unis=${slug}${ver}`;
        let json;
        if (_seriesCache.has(key)) {
          json = _seriesCache.get(key);
        } else if (id) {
          const res = await fetch(key);
          json = await res.json();
          _seriesCache.set(key, json);
        } else {
          json = await enqueueLoad(slug);
          _seriesCache.set(key, json);
        }
        const s = json.series?.[0];
        if (off) return;
        if (!s || !Array.isArray(s.points) || s.points.length === 0) {
          setSeries([]);
          setSeats({});
          return;
        }
        // Build two series (EU, NonEU) so the mini chart shows both lines.
        const euPts = s.points.filter((p: any) => p.type === "EU").map((p: any) => ({ year: p.year, type: p.type, score: p.score }));
        const nePts = s.points.filter((p: any) => p.type === "NonEU").map((p: any) => ({ year: p.year, type: p.type, score: p.score }));
        const out: TrendSeries[] = [];
        if (euPts.length) out.push({ uni: "EU", points: euPts });
        if (nePts.length) out.push({ uni: "NonEU", points: nePts });
        setSeries(out);

        const latestYear = Math.max(...(s.seats?.map((x: any) => x.year) ?? [0]));
        const eu = s.seats?.find((x: any) => x.year === latestYear && x.type === "EU")?.seats;
        const nonEu = s.seats?.find((x: any) => x.year === latestYear && x.type === "NonEU")?.seats;
        setSeats({ eu, nonEu, year: latestYear > 0 ? latestYear : undefined });
      } catch {
        if (!off) {
          setSeries([]);
          setSeats({});
        }
      }
    })();
    return () => {
      off = true;
    };
  }, [slug, shouldLoad]);

  const noData = !series || series.length === 0;

  return (
    <div ref={holderRef} className="flex items-center justify-between gap-3">
      <div className="shrink-0">
        <TrendChart series={series ?? []} mode="All" compact className="ring-1 ring-gray-200/60" />
      </div>
      <div className="grid w-[132px] grid-rows-2 gap-2">
        <div className="rounded-xl bg-indigo-50 px-2 py-1.5 text-indigo-800 ring-1 ring-indigo-200/60">
          <div className="text-[9px] font-semibold uppercase tracking-wide">EU</div>
          <div className="text-base font-extrabold leading-5">{seats.eu ?? (noData ? "—" : "—")}</div>
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

