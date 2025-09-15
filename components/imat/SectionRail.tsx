"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: string; label: string };

export default function SectionRail({ items }: { items: Item[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");
  const activeIndex = useMemo(() => items.findIndex((i) => i.id === active), [items, active]);
  const pct = useMemo(() => (activeIndex < 0 ? 0 : ((activeIndex + 1) / Math.max(1, items.length)) * 100), [activeIndex, items.length]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        // Prefer the entry most in view
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
        if (vis[0]) setActive((vis[0].target as HTMLElement).id);
      },
      { threshold: [0.5], rootMargin: "-10% 0px -40% 0px" }
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-0 z-30 mx-auto w-full max-w-6xl px-4">
      <div className="mt-2 rounded-2xl border border-white/30 bg-white/50 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/40">
        <div className="relative flex items-center gap-2 overflow-x-auto">
          {/* progress */}
          <div className="absolute inset-x-2 top-1/2 -z-10 h-1 -translate-y-1/2 rounded-full bg-white/50" />
          <div className="absolute left-2 top-1/2 -z-10 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `calc(${pct}% - 16px)` }} />

          {items.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              className={`relative flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition ${
                active === it.id ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-700 ring-slate-200"
              }`}
              aria-current={active === it.id ? "page" : undefined}
            >
              <span className={`h-2 w-2 rounded-full ${active === it.id ? "bg-white" : "bg-slate-400"}`} />
              {it.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

