"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStudyStore } from "@/lib/study/store";

function formatMS(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function Timer({ isOwner, slug }: { isOwner: boolean; slug: string }) {
  const sharedEndAt = useStudyStore((s) => s.sharedEndAt);
  const setSharedEndAt = useStudyStore((s) => s.setSharedEndAt);

  const [mode, setMode] = useState<"share" | "private">("share");
  const [privateEndAt, setPrivateEndAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [sharedDurationMs, setSharedDurationMs] = useState<number>(0);
  const [privateDurationMs, setPrivateDurationMs] = useState<number>(0);
  const [sharedBaseMs, setSharedBaseMs] = useState<number | null>(null);

  // tick interval
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const sharedRemaining = useMemo(() => {
    if (!sharedEndAt) return 0;
    const target = new Date(sharedEndAt).getTime();
    return Math.max(0, target - now);
  }, [sharedEndAt, now, tick]);

  const privateRemaining = useMemo(() => {
    if (!privateEndAt) return 0;
    const target = new Date(privateEndAt).getTime();
    return Math.max(0, target - now);
  }, [privateEndAt, now, tick]);

  const applyMinutes = (minutes: number, seconds: number, hours: number) => {
    const end = new Date();
    end.setHours(end.getHours() + (hours || 0));
    end.setMinutes(end.getMinutes() + (minutes || 0));
    end.setSeconds(end.getSeconds() + (seconds || 0));
    return end.toISOString();
  };

  const [h, setH] = useState(0);
  const [m, setM] = useState(25);
  const [s, setS] = useState(0);

  const setShared = useCallback(async () => {
    const iso = applyMinutes(m, s, h);
    // optimistic update
    setSharedEndAt(iso);
    setSharedDurationMs((h * 3600 + m * 60 + s) * 1000);
    const res = await fetch(`/api/study/sessions/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sharedEndAt: iso }),
    });
    if (!res.ok) {
      // revert on failure
      setSharedEndAt(sharedEndAt);
      alert("Failed to update shared timer. Make sure you are the owner.");
    }
  }, [h, m, s, slug, setSharedEndAt, sharedEndAt]);

  const setPrivate = useCallback(() => {
    const iso = applyMinutes(m, s, h);
    setPrivateEndAt(iso);
    setPrivateDurationMs((h * 3600 + m * 60 + s) * 1000);
  }, [h, m, s]);

  // Capture a reasonable base duration when a new sharedEndAt arrives from the room
  useEffect(() => {
    if (!sharedEndAt) { setSharedBaseMs(null); return; }
    const now = Date.now();
    const remain = Math.max(0, new Date(sharedEndAt).getTime() - now);
    // Initialize base if empty or if room extended
    setSharedBaseMs((prev) => {
      if (!prev) return remain;
      if (remain > prev) return remain; // shared timer extended
      return prev;
    });
  }, [sharedEndAt]);

  const rem = mode === "share" ? sharedRemaining : privateRemaining;
  const durCandidate = mode === "share" ? (sharedDurationMs || sharedBaseMs || 0) : privateDurationMs;
  const pct = Math.max(0, Math.min(1, durCandidate > 0 ? (durCandidate - rem) / Math.max(durCandidate, 1) : 0));
  const deg = Math.round(pct * 360);

  return (
    <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Timer</h2>
        <div className="flex gap-2">
          <button onClick={() => setMode("share")} className={`rounded-full px-3 py-1 text-sm ${mode === "share" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Share</button>
          <button onClick={() => setMode("private")} className={`rounded-full px-3 py-1 text-sm ${mode === "private" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>Private</button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <div className="relative h-44 w-44 rounded-full p-1" style={{ backgroundImage: `conic-gradient(#6366f1 ${deg}deg, #e5e7eb 0deg)` }}>
          <div className="grid h-full w-full place-items-center rounded-full bg-white">
            <div className="font-mono text-4xl sm:text-5xl tracking-wider">{formatMS(rem)}</div>
          </div>
        </div>
      </div>

      {/* Quick presets */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <button onClick={()=>{ setH(0); setM(25); setS(0); }} className="rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-700 hover:bg-indigo-100">Focus 25</button>
        <button onClick={()=>{ setH(0); setM(5); setS(0); }} className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 hover:bg-emerald-100">Short 5</button>
        <button onClick={()=>{ setH(0); setM(15); setS(0); }} className="rounded-full bg-sky-50 px-2 py-1 font-semibold text-sky-700 hover:bg-sky-100">Long 15</button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <input type="number" min={0} className="rounded-xl border border-gray-300 p-3 text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={h} onChange={(e) => setH(Math.max(0, Number(e.target.value) || 0))} placeholder="H" />
        <input type="number" min={0} className="rounded-xl border border-gray-300 p-3 text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={m} onChange={(e) => setM(Math.max(0, Number(e.target.value) || 0))} placeholder="M" />
        <input type="number" min={0} className="rounded-xl border border-gray-300 p-3 text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={s} onChange={(e) => setS(Math.max(0, Number(e.target.value) || 0))} placeholder="S" />
      </div>

      <div className="mt-4 flex gap-2">
        {mode === "share" ? (
          <button onClick={setShared} className="rounded-full bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700" disabled={!isOwner}>Share Timer</button>
        ) : (
          <button onClick={setPrivate} className="rounded-full bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700">Start Private</button>
        )}
      </div>
      {mode === "share" && !isOwner && (
        <p className="mt-2 text-xs text-gray-500">Only the room owner can update the shared timer.</p>
      )}
    </div>
  );
}
