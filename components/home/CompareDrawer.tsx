"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TrendChart from "@/components/charts/TrendChart";

type Item = {
  uni: string;
  country?: string;
  city: string;
  kind?: string;
  language?: string;
  exam?: string;
  rating?: number;
  lastScore?: number;
  logo?: string;
  // Optional prefetched mini trend data attached by HomeMap
  trendPoints?: Array<{ year: number; type: string; score: number }>;
  trendSeats?: Array<{ year: number; type: string; seats: number }>;
};

function insights(items: Item[]): string {
  if (items.length === 0) return "Add universities to compare.";
  const bestRating = [...items]
    .filter((i) => typeof i.rating === "number")
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  const topScore = [...items]
    .filter((i) => typeof i.lastScore === "number")
    .sort((a, b) => (b.lastScore || 0) - (a.lastScore || 0))[0];
  const langs = Array.from(new Set(items.map((i) => i.language).filter(Boolean))) as string[];
  const exams = Array.from(new Set(items.map((i) => i.exam).filter(Boolean))) as string[];
  const parts: string[] = [];
  if (bestRating)
    parts.push(
      `${bestRating.uni} has the highest rating${bestRating.rating ? ` (${bestRating.rating.toFixed(1)})` : ""}.`
    );
  if (topScore && topScore.uni !== bestRating?.uni)
    parts.push(
      `${topScore.uni} shows the highest last admission score${topScore.lastScore ? ` (${topScore.lastScore}/100)` : ""}.`
    );
  if (langs.length) parts.push(`Languages across your picks: ${langs.join(", ")}.`);
  if (exams.length) parts.push(`Admissions covered: ${exams.join(", ")}.`);
  return parts.join(" ");
}

type Series = {
  uni: string;
  country: string | null;
  points: Array<{ year: number; type: string; score: number }>;
  seats: Array<{ year: number; type: string; seats: number }>;
};

// Use shared TrendChart (full size)

export default function CompareDrawer({
  open,
  items,
  onClose,
  onRemove,
  onClear,
}: {
  open: boolean;
  items: Item[];
  onClose: () => void;
  onRemove: (uni: string) => void;
  onClear: () => void;
}) {
  const [series, setSeries] = useState<Series[]>([]);
  const [candType, setCandType] = useState<"EU" | "NonEU" | "All">("NonEU");

  const slugs = useMemo(
    () =>
      items
        .map((i) => i.uni.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
        .join(","),
    [items]
  );

  useEffect(() => {
    if (!open || items.length === 0) {
      setSeries([]);
      return;
    }
    const byLocal = items
      .filter((i) => (i.trendPoints && i.trendPoints.length) || (i.trendSeats && i.trendSeats.length))
      .map((i) => ({
        uni: i.uni,
        country: i.country ?? null,
        points: (i.trendPoints || []).sort((a,b)=>a.year-b.year),
        seats: (i.trendSeats || []).sort((a,b)=>a.year-b.year),
      }));
    const haveLocal = new Set(byLocal.map((s) => s.uni));
    const missing = items.filter((i) => !haveLocal.has(i.uni));

    let cancelled = false;
    const done = (data: Series[]) => { if (!cancelled) setSeries(data); };

    if (missing.length === 0) {
      done(byLocal);
      return () => { cancelled = true; };
    }
    // Fetch only missing; merge with local
    (async () => {
      try {
        const qs = missing
          .map((i) => i.uni.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
          .join(",");
        const res = await fetch(`/api/compare/scores?unis=${encodeURIComponent(qs)}`);
        const json = await res.json();
        const merged: Series[] = [...byLocal, ...(json.series || [])];
        done(merged);
      } catch {
        done(byLocal);
      }
    })();
    return () => { cancelled = true; };
  }, [open, slugs, items]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="absolute right-0 top-0 h-full w-[min(860px,96vw)] bg-gradient-to-br from-white to-indigo-50 shadow-2xl"
          >
            <div className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur p-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-indigo-800">Compare Universities</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClear}
                    className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="h-full overflow-hidden">
              <div className="h-full overflow-auto p-4 space-y-6">
                {/* Insights + Trends */}
                <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
                  <div className="text-sm font-semibold text-indigo-700">Smart insights</div>
                  <div className="mt-1 text-sm text-gray-700">{insights(items)}</div>
                  {series.length > 0 && (() => {
                    const latest: Record<string, { eu?: number; nonEu?: number }> = {};
                    for (const s of series) {
                      const y = Math.max(...s.seats.map((p) => p.year));
                      latest[s.uni] = {
                        eu: s.seats.find((p) => p.year === y && p.type === "EU")?.seats,
                        nonEu: s.seats.find((p) => p.year === y && p.type === "NonEU")?.seats,
                      };
                    }
                    return (
                      <>
                        <div className="mt-4 mb-2 flex items-center gap-2 text-xs">
                          <span className="text-gray-600">Candidate type:</span>
                          {(["EU", "NonEU", "All"] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setCandType(t)}
                              className={`rounded-full px-2 py-0.5 font-semibold ${
                                candType === t ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <div className="mb-2 flex flex-wrap gap-3 text-xs">
                          {series.map((s, i) => (
                            <div key={`l-${i}`} className="flex items-center gap-1 text-gray-700">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ background: ["#6C63FF","#F59E0B","#10B981","#EF4444","#3B82F6","#A855F7","#14B8A6","#6366F1","#F97316","#8B5CF6"][i % 10] }}
                              />
                              <span className="truncate">{s.uni}</span>
                            </div>
                          ))}
                        </div>
                        <TrendChart series={series} mode={candType} />
                        <div className="mt-3 text-xs text-gray-700">
                          {items.map((it) => (
                            <div key={`seat-${it.uni}`} className="mt-1">
                              {it.uni}: Seats N/A EU <span className="font-semibold">{latest[it.uni]?.eu ?? "N/A"}</span>,
                              NonEU <span className="font-semibold">{latest[it.uni]?.nonEu ?? "N/A"}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Cards under insights */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {items.map((it) => (
                    <div key={it.uni} className="rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-indigo-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {it.logo ? (
                            <img src={it.logo} alt="logo" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{it.uni}</div>
                          <div className="text-xs text-gray-500">
                            {it.city}
                            {it.country ? ` · ${it.country}` : ""}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemove(it.uni)}
                          className="ml-auto text-xs text-gray-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded bg-gray-50 p-2">
                          Rating: {typeof it.rating === "number" ? it.rating.toFixed(1) : "N/A"}
                        </div>
                        <div className="rounded bg-gray-50 p-2">
                          Last Score: {it.lastScore != null ? `${it.lastScore}/100` : "N/A"}
                        </div>
                        <div className="rounded bg-gray-50 p-2">Language: {it.language ?? "N/A"}</div>
                        <div className="rounded bg-gray-50 p-2">Exam: {it.exam ?? "N/A"}</div>
                        <div className="rounded bg-gray-50 p-2">
                          Type: {it.kind ? (it.kind === "private" ? "Private" : "Public") : "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
