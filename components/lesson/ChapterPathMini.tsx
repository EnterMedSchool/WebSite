"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  count: number;
  currentIndex: number; // 0-based
  className?: string;
  animate?: boolean;
};

export default function ChapterPathMini({ count, currentIndex, className = "", animate = true }: Props) {
  const N = Math.max(1, count);
  const idx = Math.min(Math.max(0, currentIndex), N - 1);

  const viewW = 1000;
  const viewH = 36; // compact height
  const padX = 24;
  const baseY = viewH / 2;
  const amp = 6; // very flat

  const points = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / Math.max(1, N - 1);
      const x = padX + (viewW - padX * 2) * t;
      const y = baseY + Math.sin(t * Math.PI) * amp * 0.6;
      out.push({ x, y });
    }
    return out;
  }, [N]);

  function buildPath(ps: { x: number; y: number }[]) {
    if (ps.length === 0) return "";
    let d = `M ${ps[0].x},${ps[0].y}`;
    for (let i = 0; i < ps.length - 1; i++) {
      const p0 = ps[i];
      const p1 = ps[i + 1];
      const dx = (p1.x - p0.x) / 2;
      const c1 = { x: p0.x + dx, y: p0.y };
      const c2 = { x: p1.x - dx, y: p1.y };
      d += ` C ${c1.x},${c1.y} ${c2.x},${c2.y} ${p1.x},${p1.y}`;
    }
    return d;
  }

  const d = useMemo(() => buildPath(points), [points]);
  const pathRef = useRef<SVGPathElement | null>(null);
  const progRef = useRef<SVGPathElement | null>(null);
  const [len, setLen] = useState(0);

  useEffect(() => {
    if (!pathRef.current) return;
    const L = pathRef.current.getTotalLength();
    setLen(L);
  }, [d]);

  const ratio = N <= 1 ? 1 : idx / (N - 1);
  const offset = len * (1 - ratio);

  useEffect(() => {
    if (!progRef.current || !len) return;
    const el = progRef.current;
    if (animate) {
      requestAnimationFrame(() => {
        el.style.transition = "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.strokeDasharray = String(len);
        el.style.strokeDashoffset = String(offset);
      });
    } else {
      el.style.transition = "none";
      el.style.strokeDasharray = String(len);
      el.style.strokeDashoffset = String(offset);
    }
  }, [len, offset, animate]);

  return (
    <div className={`relative w-full rounded-full bg-gradient-to-b from-white/70 to-indigo-50/60 p-2 ring-1 ring-gray-200 ${className}`}>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="block h-8 w-full">
        <path ref={pathRef} d={d} fill="none" stroke="#E5E7EB" strokeWidth={6} strokeLinecap="round" />
        <path ref={progRef} d={d} fill="none" stroke="#10B981" strokeWidth={7} strokeLinecap="round" style={{ strokeDasharray: len, strokeDashoffset: len }} />
        {points.map((p, i) => {
          const done = i < idx;
          const current = i === idx;
          const fill = done ? "#10B981" : current ? "#4F46E5" : "#FFFFFF";
          const stroke = done ? "#047857" : current ? "#4338CA" : "#D1D5DB";
          const r = current ? 6 : 5;
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={r + 1.8} fill="#FFFFFF" stroke={stroke} strokeWidth={1.5} />
              <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={stroke} strokeWidth={1} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

