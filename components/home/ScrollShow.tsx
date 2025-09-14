"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_24px_70px_rgba(49,46,129,0.12)] backdrop-blur-md ring-1 ring-indigo-900/5 dark:border-white/10 dark:bg-slate-900/60">
      {children}
    </div>
  );
}

export default function ScrollShow() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Background gradient morph
  const bg = useTransform(scrollYProgress, [0, 0.5, 1], [
    "radial-gradient(60% 60% at 50% 40%, rgba(99,102,241,0.10), transparent 60%)",
    "radial-gradient(60% 60% at 50% 40%, rgba(16,185,129,0.10), transparent 60%)",
    "radial-gradient(60% 60% at 50% 40%, rgba(251,146,60,0.12), transparent 60%)",
  ]);

  // Title morph
  const titleIndex = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [0, 0, 1, 2]);
  const titles = [
    { t: "Entirely New Course System", v: "indigo" as const },
    { t: "Study Rooms", v: "teal" as const },
    { t: "Weekly Leaderboards", v: "amber" as const },
  ];
  const [ti, setTi] = useState(0);
  useMotionValueEvent(titleIndex, "change", (latest) => {
    const idx = Math.round(latest);
    if (idx !== ti) setTi(Math.max(0, Math.min(2, idx)));
  });

  // Path stroke progress
  const dash = useTransform(scrollYProgress, [0, 1], [600, 0]);

  // Visibility and parallax ranges tuned so scene 1 is visible immediately
  const y1 = useTransform(scrollYProgress, [0, 0.2], [0, -20]);
  const o1 = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const y2 = useTransform(scrollYProgress, [0.2, 0.5], [20, 0]);
  const o2 = useTransform(scrollYProgress, [0.28, 0.48, 0.6], [0, 1, 0.6]);

  const y3 = useTransform(scrollYProgress, [0.5, 1], [30, 0]);
  const o3 = useTransform(scrollYProgress, [0.58, 0.78, 1], [0, 1, 1]);

  return (
    <section ref={ref} className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen" style={{ height: "420vh" }}>
      {/* evolving background */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: bg }} />

      {/* sticky viewport */}
      <div className="sticky top-24 mx-auto w-full max-w-6xl px-6">
        {/* Header morph */}
        <div className="text-left">
          <ShimmerHeading
            pretitle="Scroll to explore"
            title={titles[ti].t}
            variant={titles[ti].v}
            size="lg"
          />
        </div>

        {/* Stage */}
        <div className="relative mt-6 min-h-[64vh]">
          {/* Scene 1 */}
          <motion.div style={{ y: y1, opacity: o1 }} className="absolute inset-0">
            <Panel>
              <div className="flex items-center justify-between border-b border-white/60 bg-white/60 px-3 py-2 text-xs font-semibold backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                <div>Course · Cardio</div>
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20">2026</span>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                {["ECG Basics", "Heart Sounds", "Acute MI", "Arrhythmias", "DIC", "Pharm"].map((l) => (
                  <div key={l} className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm dark:border-white/10 dark:bg-white/5">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{l}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">Quiz</span>
                      <button className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-1 text-[10px] font-semibold text-white">Open</button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>

          {/* Scene 2 */}
          <motion.div style={{ y: y2, opacity: o2 }} className="absolute inset-0">
            <Panel>
              <div className="flex items-center justify-between border-b border-white/60 bg-white/60 px-3 py-2 text-xs font-semibold backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                <div>Study Room · Silent Mode</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> 18 online
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 p-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/60 bg-white/80 p-2 text-xs backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                    <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-[10px] text-white">{i + 1}</span>
                    <div className="truncate">User {i + 1}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>

          {/* Scene 3 */}
          <motion.div style={{ y: y3, opacity: o3 }} className="absolute inset-0">
            <Panel>
              <div className="flex items-center justify-between border-b border-white/60 bg-white/60 px-3 py-2 text-xs font-semibold backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                <div>Weekly Leaderboard</div>
                <div className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20">Week 36</div>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <tbody>
                    {[{ n: "Sapienza", x: 1380 }, { n: "Pavia", x: 1240 }, { n: "Tor Vergata", x: 1210 }].map((r, i) => (
                      <tr key={r.n} className="border-b border-slate-200/60 last:border-0 dark:border-white/10">
                        <td className="py-2 text-slate-600 dark:text-slate-300">#{i + 1}</td>
                        <td className="py-2 font-semibold text-slate-900 dark:text-white">{r.n}</td>
                        <td className="py-2 text-right text-slate-600 dark:text-slate-300">{r.x.toLocaleString()} XP</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </motion.div>
        </div>

        {/* progress path */}
        <div className="mt-6 h-10">
          <svg viewBox="0 0 1200 120" className="h-10 w-full" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="scrollshow-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <motion.path
              d="M0,70 C200,20 400,120 600,70 C800,20 1000,120 1200,70"
              fill="none"
              stroke="url(#scrollshow-stroke)"
              strokeWidth="10"
              strokeLinecap="round"
              style={{ strokeDasharray: 600, strokeDashoffset: dash }}
            />
          </svg>
        </div>
      </div>

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          svg path { stroke-dashoffset: 0 !important; }
        }
      `}</style>
    </section>
  );
}
