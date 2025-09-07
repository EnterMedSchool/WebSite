"use client";

import { useEffect, useMemo, useState } from "react";
import TrendChart, { TrendSeries } from "@/components/charts/TrendChart";

export default function MiniTrend({ uni }: { uni: string }) {
  const slug = useMemo(() => uni.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), [uni]);
  const [series, setSeries] = useState<TrendSeries[] | null>(null);
  const [seats, setSeats] = useState<{ eu?: number; nonEu?: number; year?: number }>({});

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`/api/compare/scores?unis=${slug}`, { cache: "no-store" });
        const json = await res.json();
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
  }, [slug]);

  const noData = !series || series.length === 0;

  return (
    <div className="flex items-center justify-between gap-3">
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
