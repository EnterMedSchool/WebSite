"use client";

import { useMemo, useState } from "react";

const TREND_COLORS = [
  "#6C63FF",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#3B82F6",
  "#A855F7",
  "#14B8A6",
  "#6366F1",
  "#F97316",
  "#8B5CF6",
];

export type TrendPoint = { year: number; type: string; score: number };
export type TrendSeries = { uni: string; points: TrendPoint[] };

export function TrendChart({
  series,
  mode,
  compact = false,
  className = "",
}: {
  series: TrendSeries[];
  mode: "EU" | "NonEU" | "All";
  compact?: boolean;
  className?: string;
}) {
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const s of series) {
      for (const p of s.points) {
        if (mode === "EU" && p.type === "EU") set.add(p.year);
        else if (mode === "NonEU" && p.type === "NonEU") set.add(p.year);
        else if (mode === "All" && (p.type === "EU" || p.type === "NonEU")) set.add(p.year);
      }
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [series, mode]);

  const values = useMemo(() => {
    return series.map((s, i) => {
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
      return { uni: s.uni, color: TREND_COLORS[i % TREND_COLORS.length], points: pts };
    });
  }, [series, years, mode]);

  // Hover index state must be declared before any early returns
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const flat = values.flatMap((v) => v.points.map((p) => p.value).filter((n): n is number => n != null));
  const hasData = years.length > 0 && flat.length > 0;
  if (!hasData) {
    return (
      <div className={`grid place-items-center ${className}`.trim()}>
        <div className="text-xs text-gray-500">No score data yet</div>
      </div>
    );
  }

  const minScore = Math.min(0, ...flat, 0);
  const maxScore = Math.max(100, ...flat, 100);

  const W = compact ? 260 : 640;
  const H = compact ? 90 : 220;
  const P = compact ? 16 : 30;
  const innerW = W - 2 * P;
  const innerH = H - 2 * P;
  const x = (i: number) => P + (i / Math.max(1, years.length - 1)) * innerW;
  const y = (v: number) => H - P - ((v - minScore) / (maxScore - minScore || 1)) * innerH;

  function pathFor(points: Array<{ value: number | null }>) {
    let d = "";
    points.forEach((p, i) => {
      if (p.value == null) return;
      const cmd = d ? "L" : "M";
      d += `${cmd}${x(i)},${y(p.value)} `;
    });
    return d.trim();
  }

  // Compute collision-safe Y positions for hover labels when points are close
  let labelYBySeries: Map<number, number> | null = null;
  if (hoverIdx != null) {
    const entries = values
      .map((v, si) => ({ si, v: v.points[hoverIdx]?.value }))
      .filter((e): e is { si: number; v: number } => typeof e.v === 'number');
    const desired = entries.map((e) => ({ si: e.si, y: y(e.v) }));
    desired.sort((a, b) => a.y - b.y);
    const minGap = compact ? 12 : 14;
    for (let i = 1; i < desired.length; i++) {
      if (desired[i].y - desired[i - 1].y < minGap) {
        desired[i].y = desired[i - 1].y + minGap;
      }
    }
    // Clamp to chart bounds
    for (const d of desired) {
      d.y = Math.max(P + 6, Math.min(H - P - 6, d.y));
    }
    labelYBySeries = new Map(desired.map((d) => [d.si, d.y]));
  }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      className={`rounded-lg bg-gray-50 ${className}`.trim()}
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
      {!compact && (
        <>
          <line x1={P} y1={P} x2={P} y2={H - P} stroke="#CBD5E1" strokeWidth="1" />
          <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#CBD5E1" strokeWidth="1" />
        </>
      )}

      {/* Year labels */}
      {years.map((yr, i) => (
        <text
          key={yr}
          x={x(i)}
          y={H - P + (compact ? 14 : 18)}
          fontSize={hoverIdx === i ? (compact ? 11 : 12) : compact ? 9 : 10}
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

      {/* Series */}
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
              {!compact && <circle cx={x(hoverIdx)} cy={y(v.points[hoverIdx]!.value!)} r={6} fill={v.color} fillOpacity={0.12} />}
              <text
                x={x(hoverIdx)}
                y={(labelYBySeries?.get(si) ?? y(v.points[hoverIdx]!.value!)) - (compact ? 6 : 8)}
                fontSize={compact ? 10 : 11}
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

export default TrendChart;
