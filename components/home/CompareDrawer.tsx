"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

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
  const bestRating = [...items].filter(i => typeof i.rating === 'number').sort((a,b)=> (b.rating||0)-(a.rating||0))[0];
  const topScore = [...items].filter(i => typeof i.lastScore === 'number').sort((a,b)=> (b.lastScore||0)-(a.lastScore||0))[0];
  const langs = Array.from(new Set(items.map(i=>i.language).filter(Boolean))) as string[];
  const exams = Array.from(new Set(items.map(i=>i.exam).filter(Boolean))) as string[];
  const parts: string[] = [];
  if (bestRating) parts.push(`${bestRating.uni} has the highest rating${bestRating.rating ? ` (${bestRating.rating.toFixed(1)})` : ''}.`);
  if (topScore && topScore.uni !== bestRating?.uni) parts.push(`${topScore.uni} shows the highest last admission score${topScore.lastScore ? ` (${topScore.lastScore}/100)` : ''}.`);
  if (langs.length) parts.push(`Languages across your picks: ${langs.join(', ')}.`);
  if (exams.length) parts.push(`Admissions covered: ${exams.join(', ')}.`);
  return parts.join(' ');
}

type Series = { uni: string; country: string | null; points: Array<{ year: number; type: string; score: number }>; seats: Array<{ year: number; type: string; seats: number }> };

function buildPaths(series: Series[]): { paths: Array<{ d: string; color: string; uni: string }>; years: number[] } {
  const colors = ["#6C63FF", "#F59E0B", "#10B981", "#EF4444", "#3B82F6", "#A855F7", "#14B8A6", "#6366F1", "#F97316", "#8B5CF6"];
  const allYears = Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.year)))).sort((a,b)=>a-b);
  const maxScore = Math.max(100, ...series.flatMap(s => s.points.map(p => p.score || 0)));
  const minScore = Math.min(0, ...series.flatMap(s => s.points.map(p => p.score || 0)));
  const W = 640, H = 180, P = 30;
  const x = (year: number) => {
    const idx = allYears.indexOf(year);
    const span = Math.max(1, allYears.length - 1);
    return P + (idx / span) * (W - 2*P);
  };
  const y = (score: number) => {
    const t = (score - minScore) / (maxScore - minScore || 1);
    return H - P - t * (H - 2*P);
  };
  const paths = series.map((s, i) => {
    const pts = allYears.map((yr) => {
      const m = s.points.find((p) => p.year === yr && (p.type === 'NonEU' || p.type === 'All')) || s.points.find(p => p.year === yr) || null;
      return m ? { x: x(yr), y: y(m.score) } : null;
    });
    const d = pts.reduce((acc, p, idx) => {
      if (!p) return acc;
      return acc + (idx === 0 ? `M ${p.x},${p.y}` : ` L ${p.x},${p.y}`);
    }, "");
    return { d, color: colors[i % colors.length], uni: s.uni };
  });
  return { paths, years: allYears };
}

export default function CompareDrawer({ open, items, onClose, onRemove, onClear }: { open: boolean; items: Item[]; onClose: () => void; onRemove: (uni: string) => void; onClear: () => void; }) {
  const [series, setSeries] = useState<Series[]>([]);
  const slugs = useMemo(() => items.map(i => i.uni.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).join(','), [items]);
  useEffect(() => {
    if (!open || items.length === 0) { setSeries([]); return; }
    (async () => {
      try {
        const res = await fetch(`/api/compare/scores?unis=${encodeURIComponent(slugs)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        setSeries(json.series || []);
      } catch {}
    })();
  }, [open, slugs, items.length]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            className="absolute right-0 top-0 h-full w-[min(720px,96vw)] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-4">
              <div className="text-lg font-semibold">Compare Universities</div>
              <div className="flex items-center gap-2">
                <button onClick={onClear} className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200">Clear</button>
                <button onClick={onClose} className="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Close</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              {items.map((it) => (
                <div key={it.uni} className="rounded-xl border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-indigo-100">
                      {it.logo ? <img src={it.logo} alt="logo" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{it.uni}</div>
                      <div className="text-xs text-gray-500">{it.city}{it.country ? ` • ${it.country}` : ''}</div>
                    </div>
                    <button onClick={() => onRemove(it.uni)} className="ml-auto text-xs text-gray-500 hover:underline">Remove</button>
                  </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-gray-50 p-2">Rating: {typeof it.rating === 'number' ? it.rating.toFixed(1) : '—'}</div>
                  <div className="rounded bg-gray-50 p-2">Last Score: {it.lastScore != null ? `${it.lastScore}/100` : '—'}</div>
                  <div className="rounded bg-gray-50 p-2">Language: {it.language ?? '—'}</div>
                  <div className="rounded bg-gray-50 p-2">Exam: {it.exam ?? '—'}</div>
                  <div className="rounded bg-gray-50 p-2">Type: {it.kind ? (it.kind === 'private' ? 'Private' : 'Public') : '—'}</div>
                </div>
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <div className="text-sm font-semibold text-indigo-700">Smart insights</div>
              <div className="mt-1 text-sm text-gray-700">{insights(items)}</div>
              {series.length > 0 && (() => {
                const latest: Record<string, { eu?: number; nonEu?: number }> = {};
                for (const s of series) {
                  const y = Math.max(...s.seats.map(p=>p.year));
                  latest[s.uni] = {
                    eu: s.seats.find(p=>p.year===y && p.type==='EU')?.seats,
                    nonEu: s.seats.find(p=>p.year===y && p.type==='NonEU')?.seats,
                  };
                }
                return (
                <>
                <div className="mt-4">
                  <div className="mb-2 text-sm font-semibold text-gray-700">Admission score trends (NonEU/overall)</div>
                  {(() => {
                    const { paths, years } = buildPaths(series);
                    return (
                      <svg width="100%" viewBox="0 0 640 200" className="rounded-lg bg-gray-50">
                        {/* Axes */}
                        <line x1="30" y1="10" x2="30" y2="170" stroke="#CBD5E1" strokeWidth="1" />
                        <line x1="30" y1="170" x2="610" y2="170" stroke="#CBD5E1" strokeWidth="1" />
                        {years.map((yr, i) => (
                          <text key={yr} x={30 + (i/(Math.max(1, years.length-1)))*(610-30)} y="190" fontSize="10" textAnchor="middle" fill="#64748B">{yr}</text>
                        ))}
                        {paths.map((p, i) => (
                          <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth="2.5" />
                        ))}
                        {/* Legend */}
                        {paths.map((p, i) => (
                          <g key={`leg-${i}`} transform={`translate(${40 + i*120}, 16)`}>
                            <rect width="10" height="10" fill={p.color} rx="2" />
                            <text x="14" y="10" fontSize="10" fill="#334155">{p.uni}</text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
                <div className="mt-3 text-xs text-gray-700">
                  {items.map((it) => (
                    <div key={`seat-${it.uni}`} className="mt-1">{it.uni}: Seats — EU <span className="font-semibold">{latest[it.uni]?.eu ?? '—'}</span>, NonEU <span className="font-semibold">{latest[it.uni]?.nonEu ?? '—'}</span></div>
                  ))}
                </div>
                </>
                );
              })()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
