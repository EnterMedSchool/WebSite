"use client";

import FeatureSection from "@/components/home/FeatureSection";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type Tab = "calendar" | "polls" | "feed" | "qbank" | "materials";

export default function CourseHubShowcase() {
  const [tab, setTab] = useState<Tab>("calendar");

  const right = (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_24px_70px_rgba(49,46,129,0.12)] backdrop-blur-md ring-1 ring-indigo-900/5 dark:border-white/10 dark:bg-slate-900/60">
      {/* Header with pun */}
      <div className="flex items-center justify-between border-b border-white/60 bg-white/60 px-3 py-2 text-xs font-semibold backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Hey! Enter</span>
          <span className="relative inline-block font-extrabold">MedSchool
            <span className="absolute -right-5 -top-2 select-none rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 px-1.5 text-[9px] font-black text-white shadow">ed</span>
          </span>
          <span className="hidden sm:inline">already?</span>
        </div>
        <div className="flex items-center gap-1">
          {[{ id: "calendar", l: "Calendar" }, { id: "polls", l: "Polls" }, { id: "feed", l: "Feed" }, { id: "qbank", l: "Q‑bank" }, { id: "materials", l: "Slides" }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)} className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${tab === t.id ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-white dark:text-slate-200"}`}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="relative h-[360px] bg-white/80 p-3 backdrop-blur-sm dark:bg-slate-900/60">
        <AnimatePresence mode="wait" initial={false}>
          {tab === "calendar" && (
            <motion.div key="calendar" initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 16 }} className="h-full">
              <div className="grid grid-cols-7 gap-2 text-[11px]">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                  <div key={d} className="rounded-md bg-slate-50 p-2 text-center font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">{d}</div>
                ))}
                {Array.from({ length: 21 }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-white p-2 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                    <div className="h-16 rounded-md bg-gradient-to-r from-indigo-600 to-violet-600/80 p-2 text-[10px] font-semibold text-white">Rotation
                      <div className="mt-1 text-[9px] opacity-90">Ward {i % 5}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "polls" && (
            <motion.div key="polls" initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 16 }} className="h-full">
              <div className="grid grid-cols-2 gap-3">
                {["Best time for OSCE?","Need slides for tomorrow?"] .map((q, idx) => (
                  <div key={q} className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{q}</div>
                    <div className="mt-2 space-y-2 text-xs">
                      {["Morning","Afternoon","Evening"].map((o, i) => (
                        <div key={o} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                          <span>{o}</span>
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20">{(30 + i*10 + idx*5)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "feed" && (
            <motion.div key="feed" initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 16 }} className="h-full">
              <ul className="space-y-2 text-sm">
                {[{w:"Ava",a:"shared OSCE tips"},{w:"Marco",a:"uploaded slides: Cardio"},{w:"Sara",a:"posted case: Chest pain"}].map((f,i)=>(
                  <li key={i} className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                    <div className="flex items-center gap-2">
                      <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-[10px] text-white">{f.w[0]}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{f.w}</span>
                      <span className="text-slate-600 dark:text-slate-300">{f.a}</span>
                    </div>
                    <button className="rounded-lg bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white">Open</button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {tab === "qbank" && (
            <motion.div key="qbank" initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 16 }} className="h-full">
              <div className="grid grid-cols-3 gap-3 text-xs">
                {["Cardio","GI","Heme","Endo","Neuro","Pulm"].map((s)=>(
                  <div key={s} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{s}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">{Math.floor(Math.random()*60)+20} Qs</span>
                      <button className="rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-1 text-[10px] font-semibold text-white">Start</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "materials" && (
            <motion.div key="materials" initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ type: "spring", stiffness: 120, damping: 16 }} className="h-full">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {["Professor Rossi – Cardio Slides","Ward Protocol – Anticoagulation","OSCE Checklist – Neuro Exam","Lecture Notes – Pharmacology"].map((m)=>(
                  <div key={m} className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                    <div className="flex items-center gap-2">
                      <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-[10px] font-bold text-white">PDF</span>
                      <span className="text-slate-800 dark:text-slate-100">{m}</span>
                    </div>
                    <button className="rounded-lg bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white">Open</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <FeatureSection
      id="course-hub"
      pretitle="Course Mates"
      title="Join your Course Hub"
      variant="indigo"
      tint="indigo"
      bullets={[
        { title: "Rotations calendar", desc: "See and plan your hospital rotation schedule." },
        { title: "Polls + activity feed", desc: "Decide together and keep everyone in sync." },
        { title: "Relevant question banks", desc: "Drill topics mapped to your course." },
        { title: "Study materials", desc: "Professor slides and links in one place." },
      ]}
      right={right}
    />
  );
}

