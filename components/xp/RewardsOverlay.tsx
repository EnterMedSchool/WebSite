"use client";

import { useEffect, useState } from "react";
import { ChestIcon, BadgeIcon } from "@/components/xp/Icons";

type Reward = { id: string; type: "chest" | "badge"; label: string };

export default function RewardsOverlay() {
  const [queue, setQueue] = useState<Reward[]>([]);
  const [active, setActive] = useState<Reward | null>(null);

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

  useEffect(() => {
    if (active || queue.length === 0) return;
    const next = queue[0];
    setActive(next);
    setQueue((q) => q.slice(1));
    const t = setTimeout(() => setActive(null), 2200);
    return () => clearTimeout(t);
  }, [queue, active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] grid place-items-center">
      {/* confetti */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 36 }).map((_, i) => (
          <span key={i} className="absolute h-1.5 w-2 rounded-sm opacity-0" style={{
            left: `${(i * 17) % 100}%`,
            top: `${(i * 11) % 100}%`,
            background: ["#34d399","#60a5fa","#fbbf24","#f472b6"][i % 4],
            animation: `confetti-fall ${900 + (i % 6) * 120}ms ${i * 18}ms ease-out forwards`
          }} />
        ))}
      </div>
      <div className="pointer-events-auto rounded-3xl border border-indigo-200/50 bg-white/95 p-6 text-center shadow-2xl backdrop-blur">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Reward unlocked</div>
        <div className="mx-auto mb-2 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 ring-1 ring-inset ring-indigo-100">
          {active.type === 'chest' ? (<ChestIcon className="h-10 w-10" />) : (<BadgeIcon className="h-10 w-10" />)}
        </div>
        <div className="max-w-[320px] text-sm font-extrabold text-slate-900">{active.label}</div>
        <div className="mt-1 text-[11px] font-medium text-slate-500">Nice work — keep going!</div>
      </div>
      <style>{`@keyframes confetti-fall{0%{transform:translateY(-22px) rotate(0);opacity:0}40%{opacity:1}100%{transform:translateY(22px) rotate(80deg);opacity:0}}`}</style>
    </div>
  );
}
