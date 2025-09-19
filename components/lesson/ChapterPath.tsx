"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";

type Step = {
  key: string | number;
  title: string;
  status?: "done" | "current" | "todo";
};

export type ChapterPathProps = {
  steps: Step[];
  /** Index of the current step. If omitted, tries to infer from status */
  activeIndex?: number;
  /** Optional: animate on mount */
  animate?: boolean;
};

// Builds a smooth cubic-bezier path through evenly spaced points.
function buildPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 2;
    // Control points for a smooth, gentle S-curve between points
    const c1 = { x: p0.x + dx, y: p0.y };
    const c2 = { x: p1.x - dx, y: p1.y };
    d += ` C ${c1.x},${c1.y} ${c2.x},${c2.y} ${p1.x},${p1.y}`;
  }
  return d;
}

export default function ChapterPath({ steps, activeIndex, animate = true }: ChapterPathProps) {
  const N = Math.max(1, steps.length);
  // Infer current index if not provided
  const inferredCurrent = useMemo(() => {
    const idx = steps.findIndex((s) => s.status === "current");
    if (idx >= 0) return idx;
    // next after done
    const lastDone = [...steps].reverse().findIndex((s) => s.status === "done");
    if (lastDone >= 0) return Math.min(N - 1, N - 1 - lastDone + 0);
    return 0;
  }, [steps, N]);

  const currentIndex = Math.min(
    Math.max(0, activeIndex ?? inferredCurrent ?? 0),
    N - 1
  );

  // SVG geometry: responsive via viewBox; compact layout
  const viewW = 1000;
  const viewH = 80;
  const padX = 60;
  const baseY = viewH / 2; // baseline
  const amp = 16; // slightly higher amplitude for a lively curve

  const points = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / Math.max(1, N - 1);
      const x = padX + (viewW - padX * 2) * t;
      // Gentle single-wave curve across the path for compact height
      const y = baseY + Math.sin(t * Math.PI) * amp * 0.9;
      out.push({ x, y });
    }
    return out;
  }, [N]);

  const pathD = useMemo(() => buildPath(points), [points]);

  // Progress drawing using strokeDasharray / strokeDashoffset
  const pathRef = useRef<SVGPathElement | null>(null);
  const progressRef = useRef<SVGPathElement | null>(null);
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (!pathRef.current) return;
    const L = pathRef.current.getTotalLength();
    setLength(L);
  }, [pathD]);

  // Target progress ratio (0..1) mapped to currentIndex
  const ratio = N <= 1 ? 1 : currentIndex / (N - 1);
  const targetOffset = useMemo(() => {
    if (!length) return 0;
    return length * (1 - ratio);
  }, [length, ratio]);

  useEffect(() => {
    if (!progressRef.current || !length) return;
    const el = progressRef.current;
    // initialize fully hidden then transition to target
    if (animate) {
      // Trigger transition
      requestAnimationFrame(() => {
        el.style.transition = "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.strokeDasharray = String(length);
        el.style.strokeDashoffset = String(targetOffset);
      });
    } else {
      el.style.transition = "none";
      el.style.strokeDasharray = String(length);
      el.style.strokeDashoffset = String(targetOffset);
    }
  }, [length, targetOffset, animate]);

  const gradientId = useId();
  const trackGradientId = `${gradientId}-track`;
  const progressGradientId = `${gradientId}-progress`;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/90 p-4 shadow-lg ring-1 ring-sky-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-50 via-amber-50 to-fuchsia-50 opacity-80" aria-hidden="true" />
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">Chapter path</div>
        <div className="rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold text-sky-600 ring-1 ring-inset ring-sky-200">
          Step {currentIndex + 1} of {N}
        </div>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${viewW} ${viewH}`} className="block h-20 w-full">
          {/* Track */}
          <path
            ref={pathRef}
            d={pathD}
            fill="none"
            stroke={`url(#${trackGradientId})`}
            strokeWidth={8}
            strokeLinecap="round"
          />
          {/* Animated progress overlay */}
          <path
            ref={progressRef}
            d={pathD}
            fill="none"
            stroke={`url(#${progressGradientId})`}
            strokeWidth={10}
            strokeLinecap="round"
            style={{ strokeDasharray: length, strokeDashoffset: length }}
          />

          <defs>
            <linearGradient id={trackGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#fbcfe8" />
            </linearGradient>
            <linearGradient id={progressGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Dots */}
          {points.map((p, i) => {
            const done = i < currentIndex;
            const current = i === currentIndex;
            const fill = done ? "#14b8a6" : current ? "#f97316" : "#FFFFFF";
            const stroke = done ? "#0f766e" : current ? "#c2410c" : "#cbd5f5";
            const r = current ? 9 : 8;
            return (
              <g key={`dot-${i}`}>
                <circle cx={p.x} cy={p.y} r={r + 2} fill="#FFFFFF" stroke={stroke} strokeWidth={2} />
                <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={stroke} strokeWidth={1} />
                <text
                  x={p.x}
                  y={p.y + 3}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={700}
                  fill={done || current ? "#FFFFFF" : "#475569"}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
