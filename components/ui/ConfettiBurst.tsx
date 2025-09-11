"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const PALETTE = [
  "#60A5FA", // blue-400
  "#3B82F6", // blue-500
  "#6366F1", // indigo-500
  "#4F46E5", // indigo-600
  "#22D3EE", // cyan-400
  "#06B6D4", // cyan-500
];

export default function ConfettiBurst({ count = 36, duration = 1.9 }: { count?: number; duration?: number }) {
  const [pieces, setPieces] = useState<{
    id: number;
    x: number;
    y: number;
    r: number;
    s: number;
    color: string;
    delay: number;
  }[]>([]);

  useEffect(() => {
    const arr = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 400, // horizontal spread
      y: 160 + Math.random() * 120, // fall distance
      r: (Math.random() - 0.5) * 240, // rotation
      s: 0.7 + Math.random() * 0.8, // size scale
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      delay: Math.random() * 0.12,
    }));
    setPieces(arr);
  }, [count]);

  const containerStyle = useMemo(() => ({ pointerEvents: 'none' as const }), []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" style={containerStyle} aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: -20, rotate: 0, opacity: 0 }}
          animate={{ x: p.x, y: p.y, rotate: p.r, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration + Math.random() * 0.5, ease: 'easeOut', delay: p.delay }}
          className="absolute left-1/2 top-[10%] block origin-center"
          style={{
            width: 8 * p.s,
            height: 12 * p.s,
            background: p.color,
            borderRadius: 2,
            boxShadow: `0 0 0 1px rgba(255,255,255,.25)`,
          }}
        />
      ))}
    </div>
  );
}

