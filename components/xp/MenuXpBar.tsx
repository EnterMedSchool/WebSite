"use client";

import { useState, useRef } from "react";

export type MenuXpBarProps = {
  isAuthed: boolean;
  level?: number | null;
  xpPct?: number | null;
  xpInLevel?: number | null;
  xpSpan?: number | null;
  isMax?: boolean | null;
};

// Skeleton-only XP menu bar. Shows static UI with no data or logic.
export default function MenuXpBar({ isAuthed }: MenuXpBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (!isAuthed) {
    return (
      <div className="hidden items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white/70 shadow-sm backdrop-blur sm:flex">
        <span className="inline-flex h-7 min-w-[42px] items-center justify-center rounded-full bg-white/20 px-2 text-[11px] font-semibold">Lv --</span>
        <div className="relative h-2 w-36 overflow-hidden rounded-full bg-white/20">
          <div className="absolute inset-y-0 left-0 w-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300" />
        </div>
        <span className="text-[10px] text-white/70">0/0 XP</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative hidden items-center sm:flex">
      <button
        className={`flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-white shadow-sm backdrop-blur transition ${open ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="XP menu (skeleton)"
      >
        <span className="inline-flex h-7 min-w-[42px] items-center justify-center rounded-full bg-white/20 px-2 text-[11px] font-semibold">Lv --</span>
        <div className="relative h-2 w-28 overflow-hidden rounded-full bg-white/20 md:w-32 lg:w-36 xl:w-40">
          <div className="absolute inset-y-0 left-0 w-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300" />
        </div>
        <span className="ml-1 hidden whitespace-nowrap text-[10px] font-semibold text-white/85 xl:inline">0/0 XP</span>
        <svg className={`ml-1 h-3 w-3 text-white/80 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[360px] rounded-2xl border border-white/20 bg-white/95 p-4 text-gray-700 shadow-xl backdrop-blur">
          <div className="mb-2 text-sm font-bold text-indigo-700">XP Coming Soon</div>
          <div className="text-[13px] text-gray-700">The XP system and this menu are temporarily disabled while we rebuild them. UI remains as a preview.</div>
        </div>
      )}
    </div>
  );
}

