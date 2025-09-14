"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_24px_70px_rgba(49,46,129,0.12)] backdrop-blur-md ring-1 ring-indigo-900/5 dark:border-white/10 dark:bg-slate-900/60">
      {children}
    </div>
  );
}

export default function ScrollShow() {
  const container = useRef<HTMLDivElement>(null);
  const steps = useRef<HTMLDivElement[]>([]);
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);

  useEffect(() => {
    const els = steps.current.filter(Boolean);
    if (!els.length) return;
    let prev = 0;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .map((e) => ({ i: Number((e.target as HTMLElement).dataset.index!), r: e.intersectionRatio }))
          .sort((a, b) => b.r - a.r)[0];
        if (!vis) return;
        const next = vis.i;
        if (next !== prev) {
          setDir(next > prev ? 1 : -1);
          setActive(next);
          prev = next;
        }
      },
      { threshold: [0.55, 0.7, 0.85] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const titles = [
    { t: "Entirely New Course System", v: "indigo" as const },
    { t: "Join Your Course Hub", v: "teal" as const },
    { t: "Weekly Leaderboards", v: "amber" as const },
  ];

  const pathOffset = [580, 300, 0][active];

  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      {/* tall scroll area with three sentinels */}
      <div ref={container} className="relative h-[330vh]">
        {/* sticky stage */}
        <div className="sticky top-24 mx-auto w-full max-w-6xl px-6">
          <ShimmerHeading pretitle="Scroll to explore" title={titles[active].t} variant={titles[active].v} size="lg" />

          <div className="relative mt-6 min-h-[64vh]">
            <AnimatePresence mode="popLayout" initial={false}>
              {active === 0 && (
                <motion.div key="s1" initial={{ x: dir === 1 ? 80 : -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir === 1 ? -80 : 80, opacity: 0 }} transition={{ type: "spring", stiffness: 140, damping: 18 }} className="absolute inset-0">
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
              )}

              {active === 1 && (
                <motion.div key="s2" initial={{ x: dir === 1 ? 80 : -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir === 1 ? -80 : 80, opacity: 0 }} transition={{ type: "spring", stiffness: 140, damping: 18 }} className="absolute inset-0">
                  <Panel>
                    <div className="flex items-center justify-between border-b border-white/60 bg-white/60 px-3 py-2 text-xs font-semibold backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                      <div>Course Hub · Rotations · Polls · Materials</div>
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20">Live</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 p-4">
                      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Rotations</div>
                        <div className="mt-2 grid grid-cols-4 gap-1">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="h-6 rounded-md bg-gradient-to-r from-indigo-600 to-violet-600/70" />
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Poll</div>
                        {(["Morning", "Afternoon", "Evening"] as const).map((o, i) => (
                          <div key={o} className="mt-2 h-6 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-white/10">
                            <div className="h-6 bg-gradient-to-r from-cyan-600 to-emerald-600 text-[10px] font-semibold text-white" style={{ width: `${35 + i * 18}%` }} />
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Materials</div>
                        {["Prof. Rossi – Cardio Slides", "Ward Protocol – Anticoagulation", "OSCE Checklist – Neuro"].map((m) => (
                          <div key={m} className="mt-2 flex items-center justify-between rounded-md bg-slate-50 p-2 text-[11px] ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                            <span className="truncate">{m}</span>
                            <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-white">Open</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-end px-4 pb-4">
                      <Link href="/course-mates" className="rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 px-4 py-2 text-sm font-bold text-white shadow hover:brightness-110">Join your Course Hub</Link>
                    </div>
                  </Panel>
                </motion.div>
              )}

              {active === 2 && (
                <motion.div key="s3" initial={{ x: dir === 1 ? 80 : -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir === 1 ? -80 : 80, opacity: 0 }} transition={{ type: "spring", stiffness: 140, damping: 18 }} className="absolute inset-0">
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
              )}
            </AnimatePresence>
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
                initial={{ strokeDasharray: 600, strokeDashoffset: 600 }}
                animate={{ strokeDashoffset: pathOffset }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
              />
            </svg>
          </div>
        </div>

        {/* invisible sentinels for step activation */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) steps.current[i] = el;
            }}
            data-index={i}
            className="h-[100vh]"
          />
        ))}
      </div>
    </section>
  );
}
