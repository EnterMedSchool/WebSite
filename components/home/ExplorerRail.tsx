"use client";

import { useEffect, useRef, useState, forwardRef } from "react";

type Props = {
  children: React.ReactNode;
  storageKey?: string;
  min?: number;
  max?: number;
};

// Glassy, resizable left rail. Width persists in localStorage.
const ExplorerRail = forwardRef<HTMLDivElement, Props>(function ExplorerRail(
  { children, storageKey = "ems_rail_w", min = 320, max = 560 },
  ref
) {
  const [w, setW] = useState<number>(() => {
    if (typeof window === "undefined") return 420;
    const s = window.localStorage.getItem(storageKey);
    const n = s ? Number(s) : 420;
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 420;
  });
  const dragging = useRef(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current) return;
      const next = Math.min(max, Math.max(min, e.clientX));
      setW(next);
    }
    function onUp() {
      if (!dragging.current) return;
      dragging.current = false;
      if (typeof window !== "undefined") window.localStorage.setItem(storageKey, String(w));
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [w, min, max, storageKey]);

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-30 h-full" style={{ width: w }}>
      <div className="pointer-events-auto relative flex h-full flex-col group">
        <div
          ref={ref}
          className="rounded-br-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-4 text-white shadow-[0_14px_40px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20"
        >
          {children}
        </div>
        <div className="mt-2 flex-1 overflow-auto pr-2" />
        {/* Drag handle */}
        <div
          onMouseDown={() => (dragging.current = true)}
          onKeyDown={(e) => {
            const step = 24;
            if (e.key === "ArrowRight") setW((v) => Math.min(max, v + step));
            if (e.key === "ArrowLeft") setW((v) => Math.max(min, v - step));
          }}
          tabIndex={0}
          className="absolute right-0 top-0 h-full w-3 cursor-col-resize select-none"
          title="Drag to resize"
          aria-label="Resize"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="pointer-events-none absolute right-1/2 top-1/2 h-12 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/25 backdrop-blur-md shadow-[0_6px_24px_rgba(59,130,246,0.25)] ring-1 ring-white/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />
        </div>
      </div>
    </div>
  );
});

export default ExplorerRail;
