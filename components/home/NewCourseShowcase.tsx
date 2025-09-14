"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";

type Tab = "overview" | "lesson" | "flashcards";

export default function NewCourseShowcase() {
  const [tab, setTab] = useState<Tab>("overview");
  const [done, setDone] = useState(false);
  const progress = useMemo(() => (done ? 68 : 42), [done]);

  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-12 sm:py-16 md:py-24">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-14">
        {/* Left copy */}
        <div className="relative">
          {/* Small pretitle to mirror What's New structure */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            className="select-none text-[clamp(16px,3.5vw,22px)] font-extrabold tracking-tight text-teal-900/70"
          >
            Feature spotlight
          </motion.div>

          <motion.h3
            initial={{ x: -40, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.05 }}
            className="mt-1 select-none text-[clamp(28px,8vw,68px)] font-extrabold leading-[0.95] tracking-tight text-transparent bg-clip-text nc-heading"
          >
            Entirely New Course System
          </motion.h3>

          {/* soft glow under heading */}
          <span
            aria-hidden
            className="pointer-events-none absolute -z-10 hidden sm:block"
            style={{
              top: "14px",
              left: "-12px",
              right: 0,
              height: "90px",
              background:
                "radial-gradient(55% 55% at 35% 50%, rgba(13,148,136,0.25), transparent 60%)",
              filter: "blur(18px)",
            }}
          />

          <div className="mt-6 space-y-6 text-slate-700 dark:text-slate-100">
            <Callout idx={1} text="Track your progress" />
            <Callout idx={2} text="Make it fun and earn XP" />
            <Callout idx={3} text="Practice and review flashcards" />
          </div>
        </div>

        {/* Right fake interactive widget */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(480px_140px_at_70%_0%,rgba(99,102,241,0.12),transparent)]" />
          <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-[0_24px_70px_rgba(49,46,129,0.12)] backdrop-blur-md ring-1 ring-indigo-900/5 dark:border-white/10 dark:bg-slate-900/50">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/60 bg-white/60 px-3 py-2 text-xs font-semibold backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              {[
                { id: "overview", label: "Overview" },
                { id: "lesson", label: "Lesson" },
                { id: "flashcards", label: "Flashcards" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className={`rounded-lg px-3 py-1 transition-colors ${
                    tab === t.id
                      ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow"
                      : "text-slate-700 hover:bg-white/80 dark:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-300">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50/80 px-2 py-0.5 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-80"><path d="M12 2a10 10 0 100 20 10 10 0 000-20Zm1 5v6h5v2h-7V7h2Z"/></svg>
                  2026
                </span>
              </div>
            </div>

            {/* Content area with slide-in animation on change */}
            <div className="relative h-[360px] bg-white/80 p-4 backdrop-blur-sm dark:bg-slate-900/50">
              <AnimatePresence initial={false} mode="wait">
                {tab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ x: 140, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -60, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 16 }}
                    className="h-full rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/70"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Cardio Course · Module 2</div>
                        <div className="text-xs text-slate-500 dark:text-slate-300">8 lessons · 2h 40m</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Progress</div>
                        <div className="mt-1 h-2 w-36 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                          <div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                      {["ECG Basics", "Heart Sounds", "Acute MI", "Arrhythmias", "DIC", "Pharm"].map((l, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-white/5">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{l}</div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">Quiz</span>
                            <button
                              onClick={() => setTab("lesson")}
                              className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-1 text-[10px] font-semibold text-white hover:brightness-110"
                            >
                              Open
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {tab === "lesson" && (
                  <motion.div
                    key="lesson"
                    initial={{ x: 140, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -60, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 16 }}
                    className="h-full rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/70"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Disseminated Intravascular Coagulation (DIC)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-300">Lesson 3 • 12 min</div>
                      </div>
                      <button
                        onClick={() => setDone((d) => !d)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold shadow ${
                          done ? "bg-emerald-600 text-white" : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                        }`}
                        aria-pressed={done}
                      >
                        {done ? "Completed ✓" : "Mark Done"}
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="col-span-2 rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-200 backdrop-blur-sm dark:bg-white/5 dark:ring-white/10">
                        <div className="h-36 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 p-3 text-white shadow-inner">
                          <div className="text-[10px] opacity-80">Video Player</div>
                          <div className="mt-2 h-[92px] rounded-md bg-white/20" />
                        </div>
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">A rare clotting disorder. Explore pathophysiology, labs, and treatment.</div>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-xl bg-white/90 p-3 text-xs ring-1 ring-slate-200 backdrop-blur-sm dark:bg-white/5 dark:ring-white/10">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">XP Rewards</div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-300">Complete Lesson</span>
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20">+25 XP</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-300">Perfect Quiz</span>
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">+40 XP</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setTab("flashcards")}
                          className="w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow hover:brightness-110"
                        >
                          Practice Flashcards
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {tab === "flashcards" && (
                  <motion.div
                    key="flashcards"
                    initial={{ x: 140, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -60, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 16 }}
                    className="h-full rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/70"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">Flashcards · Hematology</div>
                      <div className="text-xs text-slate-500 dark:text-slate-300">Spaced Repetition</div>
                    </div>
                    <div className="mt-4 grid h-[220px] grid-cols-2 gap-3">
                      <div className="relative rounded-xl bg-gradient-to-br from-fuchsia-600 to-violet-600 p-4 text-white">
                        <div className="text-[10px] opacity-80">Question</div>
                        <div className="mt-2 text-sm font-semibold">What lab finding suggests DIC?</div>
                        <div className="absolute inset-x-3 bottom-3 flex gap-2">
                          <button className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">Show</button>
                          <button className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-50">Easy</button>
                          <button className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-50">Hard</button>
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/90 p-4 ring-1 ring-slate-200 backdrop-blur-sm dark:bg-white/5 dark:ring-white/10">
                        <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Today</div>
                        <div className="mt-1 grid grid-cols-3 gap-2 text-center">
                          {[
                            { k: "New", v: 18 },
                            { k: "Learning", v: 12 },
                            { k: "Review", v: 36 },
                          ].map((s) => (
                            <div key={s.k} className="rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">
                              <div className="text-[10px] opacity-70">{s.k}</div>
                              <div className="text-lg">{s.v}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                          <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Component-scoped shimmer like What's New, but cyan/teal */}
      <style jsx>{`
        .nc-heading {
          background-image: linear-gradient(
            90deg,
            #0e7490 0%,
            #06b6d4 25%,
            #34d399 50%,
            #06b6d4 75%,
            #0e7490 100%
          );
          background-size: 180% auto;
          -webkit-background-clip: text;
          background-clip: text;
          animation: nc-shimmer 9s linear infinite;
          text-shadow: 0 6px 26px rgba(6, 182, 212, 0.25);
        }
        @keyframes nc-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 180% 50%; }
        }
      `}</style>
    </section>
  );
}

function Callout({ idx, text, className = "" }: { idx: number; text: string; className?: string }) {
  return (
    <motion.div
      initial={{ x: -40, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: "spring", stiffness: 90, damping: 16, delay: idx * 0.05 }}
      className={`relative flex items-start gap-3 ${className}`}
    >
      <div className="relative mt-1 h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white shadow ring-1 ring-indigo-900/20">
        <div className="absolute inset-0 grid place-items-center text-xs font-black">{idx}</div>
      </div>
      <div className="pt-0.5">
        <div className="text-lg font-semibold">{text}</div>
        <div className="text-sm text-slate-600 dark:text-slate-300">Smooth animations, delightful feedback, and crisp visuals.</div>
      </div>
    </motion.div>
  );
}
