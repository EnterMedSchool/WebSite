"use client";

import { useEffect, useMemo, useState } from "react";
import { ChestIcon, BadgeIcon } from "@/components/xp/Icons";

type Reward = { id: string; type: "chest" | "badge"; label: string };

export default function RewardsOverlay() {
  const [queue, setQueue] = useState<Reward[]>([]);
  const [active, setActive] = useState<Reward | null>(null);
  const [throwData, setThrowData] = useState<{ tx: number; ty: number; rot: number } | null>(null);
  const [ctaHover, setCtaHover] = useState(false);

  useEffect(() => {
    function onReward(e: any) {
      const d = e?.detail || {};
      if (!d?.type || !d?.label) return;
      const id = `${d.type}:${d.key || d.label}:${Date.now()}`;
      setQueue((q) => [...q, { id, type: d.type, label: String(d.label) }]);
    }
    window.addEventListener('reward:earned' as any, onReward as any);
    return () => window.removeEventListener('reward:earned' as any, onReward as any);
  }, []);

  // Promote next reward when no active card
  useEffect(() => {
    if (active || queue.length === 0) return;
    const next = queue[0];
    setThrowData(null);
    setActive(next);
    setQueue((q) => q.slice(1));
  }, [queue, active]);

  // Safety auto-dismiss (20s) so the overlay never gets stuck
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(null), 20000);
    return () => clearTimeout(t);
  }, [active]);

  const ctaLabel = useMemo(
    () => (ctaHover ? "I get it let me go back to studying" : "Cool!"),
    [ctaHover]
  );

  function dismissWithThrow(dir?: "left" | "right") {
    const sign = dir ? (dir === "left" ? -1 : 1) : Math.random() < 0.5 ? -1 : 1;
    const tx = sign * (window.innerWidth * 0.9);
    const ty = -Math.max(160, window.innerHeight * 0.25);
    const rot = sign * (20 + Math.round(Math.random() * 40));
    setThrowData({ tx, ty, rot });
    setTimeout(() => setActive(null), 620);
  }

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] grid place-items-center">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-2 rounded-sm opacity-0"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 11) % 100}%`,
              background: ["#34d399", "#60a5fa", "#fbbf24", "#f472b6"][i % 4],
              animation: `confetti-fall ${900 + (i % 6) * 120}ms ${i * 18}ms ease-out forwards`,
            }}
          />
        ))}
      </div>

      {/* Reward card */}
      <div
        className="pointer-events-auto select-none rounded-3xl border border-indigo-200/50 bg-white/95 p-6 text-center shadow-2xl backdrop-blur will-change-transform"
        style={{
          transform: throwData
            ? `translate(${throwData.tx}px, ${throwData.ty}px) rotate(${throwData.rot}deg)`
            : undefined,
          transition: throwData
            ? "transform 600ms cubic-bezier(.16,1,.3,1), opacity 600ms ease"
            : "transform 240ms ease, opacity 240ms ease",
          opacity: throwData ? 0 : 1,
        }}
      >
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Reward unlocked</div>
        <div className="mx-auto mb-2 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 ring-1 ring-inset ring-indigo-100">
          {active.type === "chest" ? (
            <ChestIcon className="h-10 w-10" />
          ) : (
            <BadgeIcon className="h-10 w-10" />
          )}
        </div>
        <div className="max-w-[360px] text-sm font-extrabold text-slate-900">{active.label}</div>
        <div className="mt-1 text-[11px] font-medium text-slate-500">Nice work — keep going!</div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            onFocus={() => setCtaHover(true)}
            onBlur={() => setCtaHover(false)}
            onMouseDown={() => setCtaHover(true)}
            onClick={() => dismissWithThrow()}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            {ctaLabel}
          </button>
          <button
            type="button"
            onClick={() => dismissWithThrow("left")}
            className="rounded-full border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Dismiss
          </button>
        </div>
      </div>

      <style>{`@keyframes confetti-fall{0%{transform:translateY(-22px) rotate(0);opacity:0}40%{opacity:1}100%{transform:translateY(22px) rotate(80deg);opacity:0}}`}</style>
    </div>
  );
}

