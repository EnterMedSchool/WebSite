"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";

type Props = {
  isAuthed: boolean;
  name?: string | null;
  imageUrl?: string | null;
  level?: number | null;
  xpPct?: number | null; // 0..100 within current level
  xpInLevel?: number | null;
  xpSpan?: number | null;
};

export default function UserMenu({ isAuthed, name, imageUrl, level, xpPct, xpInLevel, xpSpan }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!isAuthed) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white/70 sm:flex">
          <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">Lv –</span>
          <div className="relative h-2 w-28 overflow-hidden rounded-full bg-white/10">
            <div className="absolute inset-y-0 left-0 w-0 bg-white/40" />
          </div>
        </div>
        <button
          onClick={() => signIn()}
          className="rounded border border-white/60 bg-white px-3 py-1.5 text-sm text-indigo-600 hover:bg-white/90"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      {/* Compact profile/XP strip */}
      <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 sm:flex" title={`Lv ${level ?? 1} • ${Math.max(0, Math.min(100, xpPct ?? 0))}% to next`}>
        <div className="text-sm font-semibold text-white/95 max-w-[160px] truncate">{name ?? 'You'}</div>
        <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">Lv {level ?? 1}</span>
        <div className="relative h-2 w-28 overflow-hidden rounded-full bg-white/20">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-200" style={{ width: `${Math.max(0, Math.min(100, xpPct ?? 0))}%` }} />
        </div>
        <span className="ml-1 text-[10px] text-white/80">{(xpInLevel ?? 0)}/{(xpSpan ?? 0)} XP</span>
      </div>

      {/* Avatar trigger */}
      <button
        className="flex items-center gap-2 rounded-full bg-white/10 p-1 pr-2 text-white/90 hover:bg-white/20"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white">
          {imageUrl ? (
            <Image src={imageUrl} alt="User" width={32} height={32} className="h-8 w-8 object-cover" />
          ) : (
            <span className="text-indigo-600">{(name ?? "U").slice(0, 1).toUpperCase()}</span>
          )}
        </span>
        <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-indigo-100 bg-white/95 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3 p-4">
            <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
              {imageUrl ? (
                <Image src={imageUrl} alt="User" width={40} height={40} className="h-10 w-10 object-cover" />
              ) : (
                <span className="text-base font-semibold text-indigo-700">{(name ?? "U").slice(0, 1).toUpperCase()}</span>
              )}
            </span>
            <div>
              <div className="font-semibold text-gray-900">{name ?? "Your Name"}</div>
              <div className="text-sm text-indigo-600 underline">View profile</div>
            </div>
          </div>
          <div className="border-t" />
          <ul className="p-1">
            {[
              { label: "Dashboard" },
              { label: "Calendar" },
              { label: "Settings" },
            ].map((item) => (
              <li key={item.label}>
                <button className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t" />
          <div className="p-1">
            <button
              onClick={() => signOut()}
              className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
