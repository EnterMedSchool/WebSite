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

  // Reset when deck changes or closed/open toggles
  useEffect(() => {
    if (!open) return;
    setQueue(initialQueue);
    setIdx(0);
    setShowBack(false);
    setKnown(0);
    setUnknown(0);
  }, [open, initialQueue]);

  const current = queue[idx] as QueueItem | undefined;
  const done = queue.length === 0 || idx >= queue.length;

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
      // Remove current from the front
      list.splice(idx, 1);
      // If user didn't know it, re-queue once to the end
      if (repeat && (current.repeats ?? 0) < 1) {
        list.push({ ...current, repeats: (current.repeats ?? 0) + 1 });
      }
      // Move idx safely
      const nextIdx = Math.min(idx, Math.max(0, list.length - 1));
      setIdx(nextIdx);
      return list;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[50] flex max-w-full flex-col items-end gap-3">
      {/* Panel */}
      <div className="w-[92vw] max-w-md overflow-hidden rounded-2xl border border-gray-300 bg-white/95 shadow-xl backdrop-blur">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-indigo-900">{title}</div>
            <div className="text-[11px] text-gray-600">{done ? "Session complete" : `Card ${Math.min(idx + 1, queue.length)} / ${queue.length}`}</div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-600">
            <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Known {known}</span>
            <span className="rounded bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">Missed {unknown}</span>
            <button onClick={onClose} className="rounded-full bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200">Close</button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {done ? (
            <div className="space-y-3 text-center">
              <div className="text-sm font-semibold text-indigo-900">Nice work!</div>
              <div className="text-[12px] text-gray-600">You reviewed all cards in this deck.</div>
              <div className="text-[12px] text-gray-600">Known {known} • Need review {unknown}</div>
              <div className="pt-1">
                <button
                  className="rounded bg-indigo-600 px-3 py-1 text-sm font-semibold text-white hover:bg-indigo-700"
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
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="text-[12px] uppercase tracking-wide text-gray-500">Prompt</div>
                <div className="mt-1 text-sm text-gray-900">{current.front}</div>
                {showBack ? (
                  <div className="mt-3 rounded-lg bg-indigo-50 p-3 ring-1 ring-inset ring-indigo-200">
                    <div className="text-[12px] uppercase tracking-wide text-indigo-800">Answer</div>
                    <div className="mt-1 text-sm text-indigo-900">{current.back}</div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200" onClick={() => setShowBack(true)}>Show answer</button>
                  </div>
                )}
              </div>

              {/* Actions */}
              {showBack && (
                <div className="flex items-center justify-between">
                  <button className="rounded bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100" onClick={markUnknown}>I didn’t know it</button>
                  <button className="rounded bg-emerald-600 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-700" onClick={markKnown}>I knew it</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

