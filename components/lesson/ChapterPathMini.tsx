"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";

type Props = {
  count: number;
  currentIndex: number; // 0-based
  className?: string;
  animate?: boolean;
  labels?: string[]; // optional hover labels for dots; length=count
  completed?: boolean[]; // optional per-step completion flags; length=count
};

export default function ChapterPathMini({ count, currentIndex, className = "", animate = true, labels, completed }: Props) {
  const N = Math.max(1, count);
  const idx = Math.min(Math.max(0, currentIndex), N - 1);

  const viewW = 1000;
  const viewH = 36; // compact height
  const padX = 24;
  const baseY = viewH / 2;
  const amp = 8; // modest bounce to feel dynamic

  const points = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / Math.max(1, N - 1);
      const x = padX + (viewW - padX * 2) * t;
      const y = baseY + Math.sin(t * Math.PI) * amp * 0.7;
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

  const gradientId = useId();
  const miniTrackId = `${gradientId}-mini-track`;
  const miniProgressId = `${gradientId}-mini-progress`;

  return (
    <div className={`relative w-full rounded-full bg-gradient-to-r from-white via-sky-50 to-rose-50 p-2 ring-1 ring-sky-200/70 ${className}`}>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="block h-9 w-full">
        <defs>
          <linearGradient id={miniTrackId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#fbcfe8" />
          </linearGradient>
          <linearGradient id={miniProgressId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <path ref={pathRef} d={d} fill="none" stroke={`url(#${miniTrackId})`} strokeWidth={6} strokeLinecap="round" />
        <path ref={progRef} d={d} fill="none" stroke={`url(#${miniProgressId})`} strokeWidth={7.5} strokeLinecap="round" style={{ strokeDasharray: len, strokeDashoffset: len }} />
        {points.map((p, i) => {
          const comp = Array.isArray(completed) ? !!completed[i] : i < idx;
          const current = i === idx;
          const fill = comp ? "#14b8a6" : current ? "#f97316" : "#FFFFFF";
          const stroke = comp ? "#0f766e" : current ? "#c2410c" : "#cbd5f5";
          const r = current ? 6.5 : 5.5;
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={r + 1.6} fill="#FFFFFF" stroke={stroke} strokeWidth={1.4} />
              <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={stroke} strokeWidth={1} />
              {labels && labels[i] && (
                <title>{labels[i]}</title>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
