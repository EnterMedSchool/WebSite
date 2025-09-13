"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import HaloNav from "@/components/nav/HaloNav";
import SearchTrigger from "@/components/nav/SearchTrigger";
import UniversitiesMenu from "@/components/nav/UniversitiesMenu";

export type AdaptiveItem = {
  key: string;
  label: string;
  href?: string;
  // Built-in interactive items rendered on the client to avoid passing
  // elements with event handlers from server → client via props.
  kind?: "link" | "universities" | "search";
};

type Props = {
  items: AdaptiveItem[];
};

export default function AdaptiveNav({ items }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]); // measurement clones
  const moreRef = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [openMore, setOpenMore] = useState(false);

  // Measure and decide how many fit.
  useLayoutEffect(() => {
    function recompute() {
      const wrap = containerRef.current;
      if (!wrap) return;
      const available = wrap.clientWidth - 8; // small padding
      const gap = 8; // px gap ~ tailwind gap-2 between items inside HaloNav
      const widths = itemRefs.current.map((n) => (n ? n.offsetWidth : 0));
      const moreW = moreRef.current ? moreRef.current.offsetWidth : 80; // fallback
      let used = 0;
      let fit = 0;
      for (let i = 0; i < widths.length; i++) {
        // account for More button when there's overflow
        const needMore = i < items.length - 1; // assume at least 1 may overflow
        const w = widths[i] + (i === 0 ? 0 : gap);
        const project = used + w + (needMore ? moreW + gap : 0);
        if (project <= available) { used += w; fit = i + 1; } else { break; }
      }
      if (fit === 0) fit = Math.min(1, items.length - 1); // always show at least one
      setVisibleCount(Math.min(fit, items.length));
    }
    recompute();
    const obs = new ResizeObserver(recompute);
    if (containerRef.current) obs.observe(containerRef.current);
    window.addEventListener("resize", recompute);
    const id = window.setTimeout(recompute, 0); // fonts
    return () => { window.removeEventListener("resize", recompute); window.clearTimeout(id); obs.disconnect(); };
  }, [items.length]);

  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hidden = useMemo(() => items.slice(visibleCount), [items, visibleCount]);

  // Close More on outside click / ESC
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (!containerRef.current) return;
      if (!containerRef.current.contains(t)) setOpenMore(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpenMore(false); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <HaloNav className="hidden w-full min-w-0 overflow-hidden md:flex items-center justify-center gap-1">
        {visible.map((it) => (
          <div key={it.key} className="shrink-0">
            {it.kind === 'universities' ? (
              <UniversitiesMenu />
            ) : it.kind === 'search' ? (
              <SearchTrigger />
            ) : (
              <Link data-nav-link href={it.href || '#'} className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white/90 hover:text-white">
                {it.label}
              </Link>
            )}
          </div>
        ))}

        {hidden.length > 0 && (
          <div className="relative shrink-0">
            <button
              ref={moreRef}
              type="button"
              data-nav-link
              onClick={() => setOpenMore((v) => !v)}
              className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white/90 ring-1 ring-white/20 hover:text-white"
              aria-expanded={openMore}
            >
              More
            </button>
            {openMore && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[220px] rounded-2xl border border-white/20 bg-white/95 p-1 shadow-xl backdrop-blur">
                {hidden.map((it) => (
                  <div key={it.key} className="p-1">
                    {it.kind === 'universities' ? (
                      <UniversitiesMenu />
                    ) : it.kind === 'search' ? (
                      <SearchTrigger />
                    ) : (
                      <Link href={it.href || '#'} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-800 hover:bg-indigo-50">
                        {it.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </HaloNav>
      {/* Hidden measurement rack (renders all items once to get stable widths) */}
      <div className="absolute left-0 top-0 -z-50 flex -translate-y-full gap-2 opacity-0">
        {items.map((it, i) => (
          <div
            key={`m-${it.key}`}
            ref={(el: HTMLDivElement | null): void => {
              itemRefs.current[i] = el;
            }}
            className="shrink-0"
          >
            <span className="inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide">{it.label}</span>
          </div>
        ))}
        <button ref={moreRef} className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide">More</button>
      </div>
    </div>
  );
}
