"use client";

import { useEffect, useMemo, useState } from "react";
import { Rnd } from "react-rnd";

type Size = { width: number; height: number };
type Pos = { x: number; y: number };

type Props = {
  id: string; // storage key suffix
  initialSize?: Size;
  initialPos?: Pos;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number | string;
  maxHeight?: number | string;
  children: React.ReactNode;
  className?: string;
  bare?: boolean; // when true, render no frame — only children
};

function useStoredWindowState(id: string, initPos: Pos, initSize: Size) {
  const key = `ems:win:${id}`;
  const [pos, setPos] = useState<Pos>(() => {
    if (typeof window === "undefined") return initPos;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initPos;
      const j = JSON.parse(raw);
      return { x: Number(j.x ?? initPos.x), y: Number(j.y ?? initPos.y) };
    } catch { return initPos; }
  });
  const [size, setSize] = useState<Size>(() => {
    if (typeof window === "undefined") return initSize;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initSize;
      const j = JSON.parse(raw);
      return { width: Number(j.w ?? initSize.width), height: Number(j.h ?? initSize.height) };
    } catch { return initSize; }
  });

  useEffect(() => {
    // Clamp inside viewport on resize
    function clampIntoViewport() {
      if (typeof window === "undefined") return;
      const vw = window.innerWidth, vh = window.innerHeight;
      setPos((p) => ({ x: Math.max(8, Math.min(p.x, Math.max(8, vw - 24))), y: Math.max(8, Math.min(p.y, Math.max(8, vh - 24))) }));
    }
    clampIntoViewport();
    window.addEventListener("resize", clampIntoViewport);
    return () => window.removeEventListener("resize", clampIntoViewport);
  }, []);

  const save = (np: Pos, ns: Size) => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(key, JSON.stringify({ x: np.x, y: np.y, w: ns.width, h: ns.height })); } catch {}
  };

  return { pos, size, setPos, setSize, save };
}

export default function FloatingPanel({ id, initialSize = { width: 520, height: 420 }, initialPos = { x: 24, y: 120 }, minWidth = 360, minHeight = 240, maxWidth = undefined, maxHeight = undefined, children, className = "", bare = true }: Props) {
  const { pos, size, setPos, setSize, save } = useStoredWindowState(id, initialPos, initialSize);

  // Lazy bounds to window to avoid server warnings
  const bounds = useMemo(() => (typeof window !== "undefined" ? { left: 8, top: 64, right: window.innerWidth - 8, bottom: window.innerHeight - 8 } : undefined), []);

  return (
    <Rnd
      size={{ width: size.width, height: size.height }}
      position={{ x: pos.x, y: pos.y }}
      onDragStop={(_e, d) => { const np = { x: d.x, y: d.y }; setPos(np); save(np, size); }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        const ns = { width: ref.offsetWidth, height: ref.offsetHeight };
        const np = { x: position.x, y: position.y };
        setSize(ns); setPos(np); save(np, ns);
      }}
      dragHandleClassName="ems-win-drag"
      minWidth={minWidth}
      minHeight={minHeight}
      bounds="window"
      enableUserSelectHack={false}
      className={`pointer-events-auto ${className}`}
    >
      {bare ? (
        <div className="relative h-full w-full">
          {/* Transparent handle strip for dragging */}
          <div className="ems-win-drag absolute left-0 right-0 top-0 h-10 cursor-move" />
          <div className="h-full w-full">{children}</div>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur">
          <div className="ems-win-drag select-none bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white">Panel</div>
          <div className="flex-1 overflow-auto p-3">{children}</div>
        </div>
      )}
    </Rnd>
  );
}
