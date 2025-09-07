"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

function TrendChart({ series, mode }: { series: Series[]; mode: "EU" | "NonEU" | "All" }) {
  const colors = ["#6C63FF", "#F59E0B", "#10B981", "#EF4444", "#3B82F6", "#A855F7", "#14B8A6", "#6366F1", "#F97316", "#8B5CF6"];
  const years = useMemo(
    () => Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.year)))).sort((a, b) => a - b),
    [series]
  );
  const values = useMemo(() => {
    const out: Array<{ uni: string; color: string; points: Array<{ year: number; value: number | null }> }> = [];
    series.forEach((s, i) => {
      const pts = years.map((yr) => {
        const eu = s.points.find((p) => p.year === yr && p.type === "EU");
        const ne = s.points.find((p) => p.year === yr && p.type === "NonEU");
        let v: number | null = null;
        if (mode === "EU") v = eu ? Number(eu.score) : null;
        else if (mode === "NonEU") v = ne ? Number(ne.score) : null;
        else {
          const arr = [eu?.score, ne?.score].filter((x) => typeof x === "number") as number[];
          v = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
        }
        return { year: yr, value: v };
      });
      out.push({ uni: s.uni, color: colors[i % colors.length], points: pts });
    });
    return out;
  }, [series, years, mode]);

  const flat = values.flatMap((v) => v.points.map((p) => p.value).filter((n): n is number => n != null));
  const minScore = Math.min(0, ...flat, 0);
  const maxScore = Math.max(100, ...flat, 100);

  const W = 640;
  const H = 220;
  const P = 30;
  const innerW = W - 2 * P;
  const innerH = H - 2 * P;
  const x = (i: number) => P + (i / Math.max(1, years.length - 1)) * innerW;
  const y = (v: number) => H - P - ((v - minScore) / (maxScore - minScore || 1)) * innerH;

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  function pathFor(points: Array<{ value: number | null }>) {
    let d = "";
    points.forEach((p, i) => {
      if (p.value == null) return;
      const cmd = d ? "L" : "M";
      d += `${cmd}${x(i)},${y(p.value)} `;
    });
    return d.trim();
  }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      className="rounded-lg bg-gray-50"
      onMouseMove={(e) => {
        const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const rel = Math.max(0, Math.min(1, (mx - P) / innerW));
        const idx = Math.round(rel * Math.max(1, years.length - 1));
        setHoverIdx(Math.max(0, Math.min(years.length - 1, idx)));
      }}
      onMouseLeave={() => setHoverIdx(null)}
    >
      {/* Axes */}
      <line x1={P} y1={P} x2={P} y2={H - P} stroke="#CBD5E1" strokeWidth="1" />
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#CBD5E1" strokeWidth="1" />

      {/* Year labels */}
      {years.map((yr, i) => (
        <text
          key={yr}
          x={x(i)}
          y={H - P + 18}
          fontSize={hoverIdx === i ? 12 : 10}
          textAnchor="middle"
          fill={hoverIdx === i ? "#334155" : "#64748B"}
          fontWeight={hoverIdx === i ? 700 : 500}
        >
          {yr}
        </text>
      ))}

      {/* Vertical hover guide */}
      {hoverIdx != null && (
        <line x1={x(hoverIdx)} y1={P - 6} x2={x(hoverIdx)} y2={H - P} stroke="#94A3B8" strokeDasharray="3,3" />
      )}

      {/* Series paths */}
      {values.map((v, si) => (
        <g key={si}>
          <path d={pathFor(v.points)} fill="none" stroke={v.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {v.points.map((p, i) =>
            p.value != null ? (
              <circle key={i} cx={x(i)} cy={y(p.value)} r={hoverIdx === i ? 4.5 : 2.8} fill="#fff" stroke={v.color} strokeWidth={2} />
            ) : null
          )}
          {hoverIdx != null && v.points[hoverIdx]?.value != null && (
            <>
              <circle cx={x(hoverIdx)} cy={y(v.points[hoverIdx]!.value!)} r={6} fill={v.color} fillOpacity={0.12} />
              <text
                x={x(hoverIdx)}
                y={y(v.points[hoverIdx]!.value!) - 8}
                fontSize={11}
                textAnchor="middle"
                fill="#334155"
                fontWeight={700}
              >
                {Math.round(v.points[hoverIdx]!.value!)}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

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
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/compare/scores?unis=${encodeURIComponent(slugs)}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setSeries(json.series || []);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [open, slugs, items.length]);

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
