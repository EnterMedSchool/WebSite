"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Flashcard } from "@/data/flashcards/dic";

type Props = {
  open: boolean;
  onClose: () => void;
  deck: Flashcard[];
  title?: string;
};

type QueueItem = Flashcard & { repeats?: number };

export default function FlashcardsWidget({ open, onClose, deck, title = "Flashcards" }: Props) {
  const initialQueue = useMemo<QueueItem[]>(() => deck.map((c) => ({ ...c, repeats: 0 })), [deck]);
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const lastActionRef = useRef<"known" | "unknown" | null>(null);

  const total = initialQueue.length || 1;
  const current = queue[idx] as QueueItem | undefined;
  const done = queue.length === 0 || idx >= queue.length;
  const progress = Math.min(1, (known + unknown) / total);

  // Reset when deck changes or dialog opens
  useEffect(() => {
    if (!open) return;
    setQueue(initialQueue);
    setIdx(0);
    setShowBack(false);
    setKnown(0);
    setUnknown(0);
  }, [open, initialQueue]);

  const markKnown = () => {
    setKnown((v) => v + 1);
    lastActionRef.current = "known";
    nextCard(false);
  };
  const markUnknown = () => {
    setUnknown((v) => v + 1);
    lastActionRef.current = "unknown";
    nextCard(true);
  };
  const nextCard = (repeat: boolean) => {
    if (!current) return;
    setShowBack(false);
    setQueue((q) => {
      const list = [...q];
      list.splice(idx, 1);
      if (repeat && (current.repeats ?? 0) < 1) {
        list.push({ ...current, repeats: (current.repeats ?? 0) + 1 });
      }
      const nextIdx = Math.min(idx, Math.max(0, list.length - 1));
      setIdx(nextIdx);
      return list;
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (done) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setShowBack((s) => !s); return; }
      if (!showBack) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); markUnknown(); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); markKnown(); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, done, showBack]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[50] flex max-w-full flex-col items-end gap-3" role="dialog" aria-modal="true" aria-label="Flashcards">
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-[92vw] max-w-md overflow-hidden rounded-3xl bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur"
      >
        {/* Header */}
        <div className="relative border-b bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold tracking-wide">{title}</div>
              <div className="text-[11px] opacity-90">{done ? "Session complete" : `Card ${Math.min(known + unknown + 1, total)} / ${total}`}</div>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded-full bg-emerald-50/20 px-2 py-0.5 font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-200/40">Known {known}</span>
              <span className="rounded-full bg-rose-50/20 px-2 py-0.5 font-semibold text-rose-100 ring-1 ring-inset ring-rose-200/40">Missed {unknown}</span>
              <button onClick={onClose} className="rounded-full bg-white/15 px-2 py-1 text-xs font-semibold text-white ring-1 ring-white/30 hover:bg-white/25">Close</button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <motion.div className="h-full bg-white/90"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {done ? (
            <div className="space-y-3 text-center">
              <div className="text-sm font-extrabold text-indigo-900">Nice work!</div>
              <div className="text-[12px] text-gray-600">You reviewed all cards in this deck.</div>
              <div className="text-[12px] text-gray-600">Known {known} - Need review {unknown}</div>
              <div className="pt-1">
                <button
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700"
                  onClick={() => {
                    setQueue(initialQueue);
                    setIdx(0);
                    setShowBack(false);
                    setKnown(0);
                    setUnknown(0);
                  }}
                >
                  Restart deck
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Card with flip + slide */}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={(current?.id || "") + ":" + String(showBack)}
                  initial={{ x: lastActionRef.current === "known" ? 24 : lastActionRef.current === "unknown" ? -24 : 0, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: lastActionRef.current === "known" ? -24 : 24, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotateY: showBack ? 180 : 0 }}
                      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                      className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-[1px] shadow-sm [transform-style:preserve-3d]"
                      style={{ perspective: 1000 }}
                    >
                      {/* Front */}
                      <div className="rounded-2xl bg-white p-4 [backface-visibility:hidden]">
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">Prompt</div>
                        <div className="mt-1 text-sm font-medium text-gray-900">{current!.front}</div>
                        <div className="mt-3">
                          <motion.button whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }} className="rounded-xl bg-gray-900/90 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-900" onClick={() => setShowBack(true)}>Show answer (Space/Enter)</motion.button>
                        </div>
                      </div>
                      {/* Back */}
                      <div className="absolute inset-0 rounded-2xl [backface-visibility:hidden]" style={{ transform: "rotateY(180deg)" }}>
                        <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-inset ring-indigo-200">
                          <div className="text-[11px] uppercase tracking-wide text-indigo-800">Answer</div>
                          <div className="mt-1 text-sm font-medium text-indigo-900">{current!.back}</div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Actions */}
              {showBack && (
                <div className="flex items-center justify-between">
                  <motion.button whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }} className="rounded-xl bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 shadow-sm hover:bg-rose-200" onClick={markUnknown}>I didn&apos;t know (←)</motion.button>
                  <motion.button whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700" onClick={markKnown}>I knew it (→)</motion.button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
