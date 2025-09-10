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
    const n = s ? Number(s) : 420; return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 420;
  });
  const dragging = useRef(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current) return;
      const next = Math.min(max, Math.max(min, e.clientX));
      setW(next);
    }
    function onUp() { dragging.current = false; if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, String(w)); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [w, min, max, storageKey]);

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-30 h-full" style={{ width: w }}>
      <div className="pointer-events-auto relative flex h-full flex-col">
        <div ref={ref} className="rounded-br-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-4 text-white shadow-[0_14px_40px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
          {children}
        </div>
        <div className="mt-2 flex-1 overflow-auto pr-2" />
        {/* Drag handle */}
        <div
          onMouseDown={() => (dragging.current = true)}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none rounded-r bg-gradient-to-b from-transparent via-indigo-200/40 to-transparent"
          title="Drag to resize"
          aria-label="Resize"
          role="separator"
        />
      </div>
    </div>
  );
});

export default ExplorerRail;

