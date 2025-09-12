"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type HaloNavProps = {
  className?: string;
  children: ReactNode;
};

// A horizontal nav container that renders a soft, animated “halo”
// pill under the currently hovered/focused item. Items simply need
// to include the attribute `data-nav-link` to participate.
export default function HaloNav({ className = "", children }: HaloNavProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ left: number; width: number; visible: boolean }>({ left: 0, width: 0, visible: false });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    function highlightFor(target: HTMLElement | null) {
      if (!el) return;
      if (!target) { setRect((r) => ({ ...r, visible: false })); return; }
      const item = target.closest('[data-nav-link]') as HTMLElement | null;
      if (!item) { setRect((r) => ({ ...r, visible: false })); return; }
      const w = el.getBoundingClientRect();
      const b = item.getBoundingClientRect();
      setRect({ left: b.left - w.left - 6, width: b.width + 12, visible: true });
    }

    function onOver(e: MouseEvent) { highlightFor(e.target as HTMLElement); }
    function onOut(e: MouseEvent) {
      const to = (e as any).relatedTarget as HTMLElement | null;
      const root = wrapRef.current; // re-read to satisfy TS nullability
      if (!to || !root || !root.contains(to)) setRect((r) => ({ ...r, visible: false }));
    }
    function onFocusIn(e: FocusEvent) { highlightFor(e.target as HTMLElement); }
    function onFocusOut() { setRect((r) => ({ ...r, visible: false })); }

    el.addEventListener('mouseover', onOver);
    el.addEventListener('mouseout', onOut);
    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('focusout', onFocusOut);
    return () => {
      el.removeEventListener('mouseover', onOver);
      el.removeEventListener('mouseout', onOut);
      el.removeEventListener('focusin', onFocusIn);
      el.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={
        "relative isolate flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 ring-1 ring-white/15 backdrop-blur overflow-x-auto hide-scrollbar flex-nowrap " +
        className
      }
    >
      {/* moving halo */}
      <span
        aria-hidden
        style={{
          transform: `translateX(${rect.left}px)`,
          width: rect.width,
          opacity: rect.visible ? 1 : 0,
        }}
        className="pointer-events-none absolute inset-y-0 top-1/2 -z-10 h-8 -translate-y-1/2 rounded-full bg-white/15 shadow-[0_6px_18px_rgba(99,102,241,0.25)] transition-[transform,width,opacity] duration-300 ease-out"
      />

      {/* decorative aurora underlay */}
      <span className="pointer-events-none absolute inset-0 -z-20 rounded-full opacity-60 [mask-image:radial-gradient(40%_80%_at_50%_50%,black,transparent)]">
        <span className="absolute -inset-8 rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,#22d3ee,transparent_35%,#a78bfa_60%,transparent_85%)] blur-xl animate-[spin_16s_linear_infinite]" />
      </span>

      {children}
    </div>
  );
}
