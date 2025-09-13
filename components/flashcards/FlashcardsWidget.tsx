"use client";

import { useEffect, useMemo, useState } from "react";
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

  const total = queue.length;
  const current = queue[idx] as QueueItem | undefined;
  const done = total === 0 || idx >= total;
  const progress = total > 0 ? Math.min(1, (idx + (showBack ? 1 : 0)) / total) : 1;

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
    nextCard(false);
  };
  const markUnknown = () => {
    setUnknown((v) => v + 1);
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
      <div className="w-[92vw] max-w-md overflow-hidden rounded-3xl bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur">
        {/* Header */}
        <div className="relative border-b bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold tracking-wide">{title}</div>
              <div className="text-[11px] opacity-90">{done ? "Session complete" : `Card ${Math.min(idx + 1, total)} / ${total}`}</div>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded-full bg-emerald-50/20 px-2 py-0.5 font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-200/40">Known {known}</span>
              <span className="rounded-full bg-rose-50/20 px-2 py-0.5 font-semibold text-rose-100 ring-1 ring-inset ring-rose-200/40">Missed {unknown}</span>
              <button onClick={onClose} className="rounded-full bg-white/15 px-2 py-1 text-xs font-semibold text-white ring-1 ring-white/30 hover:bg-white/25">Close</button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white/90" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {done ? (
            <div className="space-y-3 text-center">
              <div className="text-sm font-extrabold text-indigo-900">Nice work! 🎉</div>
              <div className="text-[12px] text-gray-600">You reviewed all cards in this deck.</div>
              <div className="text-[12px] text-gray-600">Known {known} · Need review {unknown}</div>
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
              {/* Card */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-[1px] shadow-sm">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Prompt</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{current!.front}</div>
                </div>
                {showBack ? (
                  <div className="mt-3 rounded-2xl bg-indigo-50 p-3 ring-1 ring-inset ring-indigo-200">
                    <div className="text-[11px] uppercase tracking-wide text-indigo-800">Answer</div>
                    <div className="mt-1 text-sm font-medium text-indigo-900">{current!.back}</div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button className="rounded-xl bg-gray-900/90 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-900" onClick={() => setShowBack(true)}>Show answer ␣</button>
                  </div>
                )}
              </div>

              {/* Actions */}
              {showBack && (
                <div className="flex items-center justify-between">
                  <button className="rounded-xl bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-200" onClick={markUnknown}>✗ I didn't know (←)</button>
                  <button className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700" onClick={markKnown}>✓ I knew it (→)</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

