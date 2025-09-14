"use client";

import FeatureSection from "@/components/home/FeatureSection";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

function PresenceDot({ color }: { color: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

export default function StudyRoomsShowcase() {
  const [joined, setJoined] = useState(false);
  const [people, setPeople] = useState(12);

  useEffect(() => {
    const id = setInterval(() => setPeople((p) => (p % 2 ? p + 1 : p - 1)), 2600);
    return () => clearInterval(id);
  }, []);

  const right = (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_24px_70px_rgba(20,115,108,0.15)] backdrop-blur-md ring-1 ring-emerald-900/10 dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-white/60 bg-white/60 px-3 py-2 text-xs font-semibold backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="inline-grid h-6 w-6 place-items-center rounded-lg bg-emerald-600 text-white">R</span>
          Study Room · Cardio
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300">
          <PresenceDot color="bg-emerald-500" /> {people} online
        </div>
      </div>
      <div className="p-4">
        {/* Pin callouts */}
        <div className="pointer-events-none relative">
          <div className="absolute -top-3 right-6 z-10 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow">Live</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["Silent", "Discuss", "Quiz"].map((t) => (
            <div key={t} className="rounded-xl border border-slate-200 bg-white p-3 text-center text-xs font-semibold shadow-sm dark:border-white/10 dark:bg-white/5">
              {t}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-white/60 bg-white/80 p-2 text-xs backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-[10px] text-white">{i + 1}</span>
              <div className="truncate">User {i + 1}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-600 dark:text-slate-300">Live presence, audio, and shared notes.</div>
          <button
            onClick={() => setJoined((j) => !j)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold text-white shadow ${
              joined ? "bg-emerald-600" : "bg-gradient-to-r from-cyan-600 to-emerald-600"
            }`}
          >
            {joined ? "Leave Room" : "Join Room"}
          </button>
        </div>

        {/* Tiny in-card confetti when joining */}
        <AnimatePresence>
          {joined && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="mt-3 rounded-lg bg-emerald-50 p-2 text-center text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20"
            >
              Joined! Mic off. Say hi in chat.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <FeatureSection
      id="study-rooms"
      title="Study Rooms"
      variant="teal"
      tint="teal"
      flip
      bullets={[
        { title: "See who's online", desc: "Live presence dots and quick room modes." },
        { title: "Join with one click", desc: "Jump in, mute by default, and start studying." },
        { title: "Share notes & quizzes", desc: "Keep the room engaged with mini sprints." },
      ]}
      right={right}
    />
  );
}
