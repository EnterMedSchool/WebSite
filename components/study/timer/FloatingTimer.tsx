"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStudyStore } from "@/lib/study/store";

type Mode = "focus" | "short" | "long";

const MODE_META: Record<Mode, { label: string; minutes: number; bg: string; accent: string; chip: string }> = {
  focus: { label: "Focus", minutes: 25, bg: "from-rose-50 to-rose-100", accent: "rose-500", chip: "bg-rose-100 text-rose-800" },
  short: { label: "Short Break", minutes: 5, bg: "from-emerald-50 to-emerald-100", accent: "emerald-500", chip: "bg-emerald-100 text-emerald-800" },
  long: { label: "Long Break", minutes: 15, bg: "from-sky-50 to-sky-100", accent: "sky-600", chip: "bg-sky-100 text-sky-800" },
};

export default function FloatingTimer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const slug = useStudyStore((s) => s.slug);
  const sharedEndAt = useStudyStore((s) => s.sharedEndAt);
  const setSharedEndAt = useStudyStore((s) => s.setSharedEndAt);

  const [mode, setMode] = useState<Mode>("focus");
  const [running, setRunning] = useState<boolean>(false);
  const [target, setTarget] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [, setTick] = useState(0);

  // rAF ticker for smooth countdown
  useEffect(() => {
    if (!open) return;
    const loop = () => {
      setTick((t) => (t + 1) % 1000000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  }, [open]);

  const remainingMs = useMemo(() => {
    const now = Date.now();
    if (running && target) return Math.max(0, target - now);
    if (sharedEndAt && !running) return Math.max(0, new Date(sharedEndAt).getTime() - now);
    return 0;
  }, [running, target, sharedEndAt]);

  const [mm, ss] = useMemo(() => {
    const ms = remainingMs || MODE_META[mode].minutes * 60 * 1000;
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return [String(m).padStart(2, '0'), String(s).padStart(2, '0')];
  }, [remainingMs, mode]);

  const startLocal = useCallback(() => {
    const minutes = MODE_META[mode].minutes;
    const tgt = Date.now() + minutes * 60 * 1000;
    setTarget(tgt);
    setRunning(true);
  }, [mode]);

  const pauseLocal = useCallback(() => {
    setRunning(false);
  }, []);

  const shareTimer = useCallback(async () => {
    if (!slug) return;
    // Push a shared end time derived from current mode
    const tgtIso = new Date(Date.now() + MODE_META[mode].minutes * 60 * 1000).toISOString();
    setSharedEndAt(tgtIso);
    await fetch(`/api/study/sessions/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sharedEndAt: tgtIso }),
    }).catch(() => {});
  }, [slug, mode, setSharedEndAt]);

  if (!open) return null;
  const meta = MODE_META[mode];
  const accent = mode === "focus" ? "#f43f5e" : mode === "short" ? "#10b981" : "#0284c7"; // rose-500, emerald-500, sky-600

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`relative w-[360px] sm:w-[420px] overflow-hidden rounded-[28px] bg-gradient-to-b ${meta.bg} p-4 shadow-2xl ring-1 ring-black/5`}>
        {/* Top bar */}
        <div className="mb-2 flex items-center justify-between">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.chip}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1Zm.75 5h-1.5v6l5.25 3.15.75-1.23-4.5-2.67Z"/></svg>
            {meta.label}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMode("focus")} className={`h-7 w-7 rounded-full ring-2 ${mode==='focus' ? 'ring-rose-400 bg-rose-200' : 'ring-rose-200 bg-white'}`} title="Focus" />
            <button onClick={() => setMode("short")} className={`h-7 w-7 rounded-full ring-2 ${mode==='short' ? 'ring-emerald-400 bg-emerald-200' : 'ring-emerald-200 bg-white'}`} title="Short" />
            <button onClick={() => setMode("long")} className={`h-7 w-7 rounded-full ring-2 ${mode==='long' ? 'ring-sky-400 bg-sky-200' : 'ring-sky-200 bg-white'}`} title="Long" />
            <button onClick={onClose} className="ml-1 rounded-full px-2 py-1 text-sm text-gray-600 hover:bg-white/70">×</button>
          </div>
        </div>

        {/* Big digits */}
        <div className="mt-3 grid place-items-center">
          <div className="text-center">
            <div className={`font-black tabular-nums leading-none tracking-tight drop-shadow-sm`} style={{ fontSize: '92px', color: accent }}>{mm}</div>
            <div className={`-mt-2 font-black tabular-nums leading-none tracking-tight drop-shadow-sm`} style={{ fontSize: '92px', color: accent }}>{ss}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button className="rounded-2xl bg-white/70 px-3 py-2 text-sm text-gray-700 backdrop-blur hover:bg-white">···</button>
          {running ? (
            <button onClick={pauseLocal} className={`rounded-2xl px-4 py-2 text-white shadow hover:opacity-90`} style={{ backgroundColor: accent }}>Pause</button>
          ) : (
            <button onClick={startLocal} className={`rounded-2xl px-4 py-2 text-white shadow hover:opacity-90`} style={{ backgroundColor: accent }}>Start</button>
          )}
          <button onClick={() => setTarget(null)} className="rounded-2xl bg-white/70 px-3 py-2 text-sm text-gray-700 backdrop-blur hover:bg-white">Skip</button>
        </div>

        {/* Share if in room */}
        {slug && (
          <div className="mt-3 text-center">
            <button onClick={shareTimer} className="rounded-full bg-black/10 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-black/15">Share to Room</button>
          </div>
        )}
      </div>
    </div>
  );
}

// (no longer used)
