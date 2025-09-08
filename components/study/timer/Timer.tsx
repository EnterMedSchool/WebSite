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
  }, [h, m, s]);

  return (
    <div className="border rounded p-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Timer</h2>
        <div className="flex gap-2">
          <button onClick={() => setMode("share")} className={`px-2 py-1 rounded border ${mode === "share" ? "bg-blue-600 text-white" : "bg-white"}`}>Share</button>
          <button onClick={() => setMode("private")} className={`px-2 py-1 rounded border ${mode === "private" ? "bg-blue-600 text-white" : "bg-white"}`}>Private</button>
        </div>
      </div>

      <div className="mt-3 text-3xl font-mono">
        {mode === "share" ? formatMS(sharedRemaining) : formatMS(privateRemaining)}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <input type="number" min={0} className="border rounded p-2" value={h} onChange={(e) => setH(Math.max(0, Number(e.target.value) || 0))} placeholder="Hours" />
        <input type="number" min={0} className="border rounded p-2" value={m} onChange={(e) => setM(Math.max(0, Number(e.target.value) || 0))} placeholder="Minutes" />
        <input type="number" min={0} className="border rounded p-2" value={s} onChange={(e) => setS(Math.max(0, Number(e.target.value) || 0))} placeholder="Seconds" />
      </div>

      <div className="mt-3 flex gap-2">
        {mode === "share" ? (
          <button onClick={setShared} className="border rounded px-3 py-1" disabled={!isOwner}>Set Shared</button>
        ) : (
          <button onClick={setPrivate} className="border rounded px-3 py-1">Set Private</button>
        )}
      </div>
      {mode === "share" && !isOwner && (
        <p className="text-xs text-gray-500 mt-2">Only the room owner can update the shared timer.</p>
      )}
    </div>
  );
}
