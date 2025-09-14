"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [tick, setTick] = useState(0);
  const [preRatio, setPreRatio] = useState(0);
  const [countdownLocked, setCountdownLocked] = useState(false);
  const introRef = useRef<HTMLDivElement>(null);
  const featRef = useRef<HTMLDivElement | null>(null);
  const [featRatio, setFeatRatio] = useState(0);

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
        const first = entries.find((e) => Number((e.target as HTMLElement).dataset.index!) === 0);
        if (first) setPreRatio(first.intersectionRatio);
      },
      { threshold: [0.35, 0.55, 0.7, 0.85, 0.98] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Smooth, continuous progress for the intro using Framer's useScroll
  const { scrollYProgress: introProgress } = useScroll({
    target: introRef,
    offset: ["start 90%", "end 10%"],
  });
  useMotionValueEvent(introProgress, "change", (v) => setPreRatio(Math.max(0, Math.min(1, v ?? 0))));

  // Latch the countdown once we've effectively reached GO
  useEffect(() => {
    if (!countdownLocked && preRatio >= 0.92) setCountdownLocked(true);
  }, [preRatio, countdownLocked]);

  // Feature reveal progress tied to the first step sentinel
  const { scrollYProgress: featuresProgress } = useScroll({
    target: featRef,
    offset: ["start 85%", "end 10%"],
  });
  useMotionValueEvent(featuresProgress, "change", (v) => setFeatRatio(Math.max(0, Math.min(1, v ?? 0))));

  // Small ticker for stat counters & subtle motion
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 100000), 1800);
    return () => clearInterval(id);
  }, []);

  const titles = [
    { t: "Entirely New Course System", v: "indigo" as const },
    { t: "Join Your Course Hub", v: "teal" as const },
    { t: "Weekly Leaderboards", v: "amber" as const },
  ];

  const pathOffset = [580, 300, 0][active];

  // fake data
  const LESSONS = useMemo(() => [
    "ECG Basics",
    "Heart Sounds",
    "Acute MI",
    "Arrhythmias",
    "DIC",
    "Pharm",
    "Hypertension",
    "Heart Failure",
  ], []);

  // Overlay / stage gating
  const baseR = Math.min(1, Math.max(0, (preRatio - 0.06) / 0.9));
  const r = countdownLocked ? 1 : baseR;
  const countdownOpacity = Math.min(1, r * 1.15);
  const fadeOutStart = 0.94;
  const fadeOutProgress = Math.min(1, Math.max(0, (featRatio - fadeOutStart) / (1 - fadeOutStart)));
  const overlayAlpha = countdownLocked ? 1 - fadeOutProgress : countdownOpacity;
  const overlayVisible = countdownLocked ? overlayAlpha > 0.02 : preRatio > 0.06;
  const stageAlpha = overlayVisible ? 0 : 1; // stage appears only after overlay is gone

  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      {/* tall scroll area with intro + three sentinels */}
      <div ref={container} className="relative h-[420vh]">
        {/* intro sentinel (starts cinematic before the first scene) */}
        <div ref={introRef} className="h-[80vh]" />
        {/* sticky stage */}
        {(() => {
          return (
            <div className="sticky top-24 mx-auto w-full max-w-6xl px-6" style={{ opacity: stageAlpha }} aria-hidden={stageAlpha < 0.02}>
              <ShimmerHeading title={titles[active].t} variant={titles[active].v} size="lg" />

              <div className="relative mt-6 min-h-[72vh]">
            <AnimatePresence mode="popLayout" initial={false}>
              {active === 0 && (
                <motion.div key="s1" initial={{ x: dir === 1 ? 80 : -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir === 1 ? -80 : 80, opacity: 0 }} transition={{ type: "spring", stiffness: 140, damping: 18 }} className="absolute inset-0">
                  <Panel>
                    <div className="flex items-center justify-between border-b border-white/60 bg-white/60 px-3 py-2 text-xs font-semibold backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                      <div>Course · Cardio</div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">{(42 + (tick % 5)).toLocaleString()} XP</span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20">2026</span>
                      </div>
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
                      {LESSONS.map((l, i) => (
                        <motion.div
                          key={l}
                          initial={{ y: 18, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: i * 0.03, type: "spring", stiffness: 160, damping: 18 }}
                          className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{l}</div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">Quiz</span>
                            <button className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-1 text-[10px] font-semibold text-white">Open</button>
                          </div>
                        </motion.div>
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
                    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
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
                            <div className="h-6 bg-gradient-to-r from-cyan-600 to-emerald-600 text-[10px] font-semibold text-white" style={{ width: `${35 + ((tick + i) % 3) * 18}%` }} />
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
          );
        })()}

        {/* invisible sentinels for step activation */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) {
                steps.current[i] = el;
                if (i === 0) featRef.current = el;
              }
            }}
            data-index={i}
            className="h-[100vh]"
          />
        ))}
      </div>

      {/* Cinematic overlay: countdown then feature highlights, then fade out */}
      {(() => {
        const step = r < 0.33 ? 3 : r < 0.66 ? 2 : r < 0.9 ? 1 : 0; // 0 means GO!
        const barH = `${Math.round(6 + r * 12)}vh`;
        const show = overlayVisible;
        if (!show) return null;
        const skipToScene = () => {
          const target = steps.current[1] || steps.current[0];
          if (target) {
            const top = target.getBoundingClientRect().top + window.scrollY - 120;
            window.scrollTo({ top, behavior: "smooth" });
          }
          setPreRatio(0);
          setFeatRatio(1);
          setCountdownLocked(true);
        };
        return (
          <motion.div initial={false} animate={{ opacity: overlayAlpha }} className="fixed inset-0 z-[60] pointer-events-none">
            {/* film grain */}
            <div className="absolute inset-0 bg-black" />
            <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen" style={{ backgroundImage: "repeating-radial-gradient(circle at 10% 10%, rgba(255,255,255,0.12) 0, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 3px)" }} />
            {/* letterbox bars */}
            <div className="absolute left-0 right-0 top-0 bg-black" style={{ height: barH }} />
            <div className="absolute left-0 right-0 bottom-0 bg-black" style={{ height: barH }} />

            <div className="absolute inset-0 grid place-items-center px-6">
              <div className="relative w-full max-w-5xl">
                <div className="text-center">
                  {!countdownLocked ? (
                    <>
                      <div className="mb-3 text-sm font-semibold tracking-widest text-white/80">Are you ready to be amazed?</div>
                      <motion.div key={step} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} className="text-[min(20vw,140px)] font-black leading-none text-white">
                        {step}
                      </motion.div>
                    </>
                  ) : (
                    <motion.div key="go" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }} className="mb-6 text-[min(18vw,110px)] font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400">
                      GO!
                    </motion.div>
                  )}
                </div>

                {/* Feature highlights reveal over the dark screen */}
                {countdownLocked && (
                  <div className="mx-auto mt-2 grid w-full gap-3 sm:grid-cols-3">
                    {(() => {
                      const a1 = Math.min(1, Math.max(0, featRatio / 0.34));
                      const a2 = Math.min(1, Math.max(0, (featRatio - 0.33) / 0.34));
                      const a3 = Math.min(1, Math.max(0, (featRatio - 0.66) / 0.34));
                      return (
                        <>
                          <motion.div
                            style={{ opacity: a1, y: (1 - a1) * 24 }}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white shadow-[0_12px_40px_rgba(255,255,255,0.08)] ring-1 ring-white/10 backdrop-blur-sm"
                          >
                            <div className="text-xs uppercase tracking-widest text-indigo-200/80">New</div>
                            <div className="mt-1 font-extrabold leading-tight">Entirely New Course System</div>
                            <div className="mt-2 text-sm text-white/70">Faster lessons, smarter progress, and richer practice.</div>
                          </motion.div>
                          <motion.div
                            style={{ opacity: a2, y: (1 - a2) * 24 }}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white shadow-[0_12px_40px_rgba(255,255,255,0.08)] ring-1 ring-white/10 backdrop-blur-sm"
                          >
                            <div className="text-xs uppercase tracking-widest text-emerald-200/80">Social</div>
                            <div className="mt-1 font-extrabold leading-tight">Join Your Course Hub</div>
                            <div className="mt-2 text-sm text-white/70">Study together, compare stats, and share wins.</div>
                          </motion.div>
                          <motion.div
                            style={{ opacity: a3, y: (1 - a3) * 24 }}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white shadow-[0_12px_40px_rgba(255,255,255,0.08)] ring-1 ring-white/10 backdrop-blur-sm"
                          >
                            <div className="text-xs uppercase tracking-widest text-amber-200/80">Competitive</div>
                            <div className="mt-1 font-extrabold leading-tight">Weekly Leaderboards</div>
                            <div className="mt-2 text-sm text-white/70">Climb ranks, earn XP, and stay motivated.</div>
                          </motion.div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Skip button */}
            <div className="pointer-events-auto absolute right-6 top-6">
              <button onClick={skipToScene} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20">Skip Intro</button>
            </div>
          </motion.div>
        );
      })()}
    </section>
  );
}
