"use client";

import FeatureSection from "@/components/home/FeatureSection";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

const SCHOOLS = [
  { name: "Sapienza", pts: 1380 },
  { name: "Pavia", pts: 1240 },
  { name: "Tor Vergata", pts: 1210 },
];

export default function LeaderboardsShowcase() {
  const [week, setWeek] = useState(36);
  const [bump, setBump] = useState(false);
  const rows = useMemo(() => SCHOOLS.map((s, i) => ({ ...s, rank: i + 1 + (bump && i === 1 ? -1 : 0) })), [bump]);

  const right = (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_24px_70px_rgba(120,53,15,0.14)] backdrop-blur-md ring-1 ring-amber-900/10 dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-white/60 bg-white/60 px-3 py-2 text-xs font-semibold backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div>Weekly Leaderboard</div>
        <div className="flex items-center gap-1">
          <button className="rounded-md border border-white/60 bg-white/70 px-2 py-0.5 text-[10px] hover:bg-white dark:border-white/10 dark:bg-white/10" onClick={() => setWeek((w) => Math.max(1, w - 1))}>◀</button>
          <div className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20">
            Week {week}
          </div>
          <button className="rounded-md border border-white/60 bg-white/70 px-2 py-0.5 text-[10px] hover:bg-white dark:border-white/10 dark:bg-white/10" onClick={() => setWeek((w) => w + 1)}>▶</button>
        </div>
      </div>
      <div className="p-4">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} className="border-b border-slate-200/60 last:border-0 dark:border-white/10">
                <td className="py-2 text-slate-600 dark:text-slate-300">#{r.rank}</td>
                <td className="py-2 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                <td className="py-2 text-right text-slate-600 dark:text-slate-300">{r.pts.toLocaleString()} XP</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-600 dark:text-slate-300">Earn XP by studying and solving quizzes.</div>
          <button
            onClick={() => {
              setBump(true);
              setTimeout(() => setBump(false), 1800);
            }}
            className="rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 px-3 py-2 text-xs font-semibold text-white shadow hover:brightness-110"
          >
            Solve Quiz (Fake)
          </button>
        </div>
        {bump && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3 rounded-lg bg-amber-50 p-2 text-center text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20">
            Rank up! Your school gained +120 XP
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <FeatureSection
      id="leaderboards"
      pretitle="Competitive spirit"
      title="Weekly Leaderboards"
      variant="amber"
      bullets={[
        { title: "Represent your school", desc: "Earn XP from lessons, quizzes, and events.", color: "bg-gradient-to-tr from-amber-600 to-rose-600" },
        { title: "See weekly ranks", desc: "Track momentum with week-by-week filters.", color: "bg-gradient-to-tr from-amber-600 to-rose-600" },
        { title: "Climb together", desc: "Every effort contributes to your school rank.", color: "bg-gradient-to-tr from-amber-600 to-rose-600" },
      ]}
      right={right}
    />
  );
}
