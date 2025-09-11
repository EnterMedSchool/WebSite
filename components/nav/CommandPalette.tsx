"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { label: string; href: string; group?: string };

const DEFAULT_ITEMS: Item[] = [
  { label: "Universities", href: "/#universities", group: "Explore" },
  { label: "Entrance Exams", href: "/#exams", group: "Explore" },
  { label: "Communities", href: "/#communities", group: "Explore" },
  { label: "IMAT Course", href: "/#imat", group: "Explore" },
  { label: "Course Mates", href: "/course-mates", group: "Social" },
  { label: "Study Materials", href: "/blog", group: "Resources" },
  { label: "Virtual Library", href: "/study-rooms", group: "Resources" },
  { label: "Scholarships", href: "/#scholarships", group: "Resources" },
  { label: "Leaderboard", href: "/leaderboard", group: "Profile" },
  { label: "Dashboard", href: "/dashboard", group: "Profile" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const r = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() { setOpen(true); }
    function onClose() { setOpen(false); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("cmdk:open" as any, onOpen as any);
    window.addEventListener("cmdk:close" as any, onClose as any);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open" as any, onOpen as any);
      window.removeEventListener("cmdk:close" as any, onClose as any);
    };
  }, []);

  const results = useMemo(() => {
    const x = q.trim().toLowerCase();
    if (!x) return DEFAULT_ITEMS;
    return DEFAULT_ITEMS.filter((i) => `${i.label} ${i.group ?? ""}`.toLowerCase().includes(x));
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] grid place-items-start bg-black/40 p-4 pt-24 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b bg-white/60 px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-slate-500"><path fill="currentColor" d="M10 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8m11 2l-6-6"/></svg>
          <input autoFocus value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search pages, tools…" className="w-full bg-transparent py-1 text-[15px] outline-none placeholder:text-slate-400" />
          <span className="hidden items-center gap-1 rounded-md border bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600 sm:flex">Ctrl K</span>
        </div>
        <div className="max-h-[50vh] overflow-auto p-2">
          {groupBy(results, (i)=>i.group ?? "Other").map(([group, items]) => (
            <div key={group} className="mb-2">
              <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{group}</div>
              {items.map((i) => (
                <button
                  key={i.href}
                  onClick={() => { setOpen(false); r.push(i.href); }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[15px] hover:bg-indigo-50"
                >
                  <span className="text-slate-800">{i.label}</span>
                  <span className="text-[11px] text-slate-500">{i.href}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function groupBy<T, K extends string>(arr: T[], key: (t: T) => K): [K, T[]][] {
  const m = new Map<K, T[]>();
  for (const item of arr) {
    const k = key(item);
    const bucket = m.get(k) ?? [];
    bucket.push(item);
    m.set(k, bucket);
  }
  return Array.from(m.entries());
}

