"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type DndItem = { id: number; label: string; subtitle?: string };

export default function DndList({
  items,
  inputName,
  className,
  onChange,
}: {
  items: DndItem[];
  inputName: string; // name of hidden input to post JSON ids array
  className?: string;
  onChange?: (ids: number[]) => void;
}) {
  const [list, setList] = useState<DndItem[]>(() => items.slice());
  const dragIndexRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);

  useEffect(() => {
    setList(items.slice());
  }, [JSON.stringify(items.map((i) => i.id))]);

  const orderedIds = useMemo(() => list.map((i) => i.id), [list]);

  useEffect(() => {
    if (onChange) onChange(orderedIds);
  }, [JSON.stringify(orderedIds)]);

  function onDragStart(i: number, e: React.DragEvent) {
    dragIndexRef.current = i;
    overIndexRef.current = i;
    try { e.dataTransfer.setData("text/plain", String(list[i].id)); } catch {}
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(i: number, e: React.DragEvent) {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === i) return;
    // Swap positions when hovering over a new index
    const to = i;
    if (overIndexRef.current === to) return;
    overIndexRef.current = to;
    setList((prev) => {
      const arr = prev.slice();
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      dragIndexRef.current = to;
      return arr;
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragIndexRef.current = null;
    overIndexRef.current = null;
  }

  return (
    <div className={className}>
      <input type="hidden" name={inputName} value={JSON.stringify(orderedIds)} readOnly />
      <ul className="divide-y rounded-xl border border-gray-200 bg-white">
        {list.map((it, i) => (
          <li
            key={it.id}
            className="flex items-center justify-between gap-3 p-2"
            draggable
            onDragStart={(e) => onDragStart(i, e)}
            onDragOver={(e) => onDragOver(i, e)}
            onDrop={onDrop}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="cursor-grab select-none rounded-md border bg-gray-50 px-2 py-1 text-xs text-gray-600">⇅</span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">{it.label}</div>
                {it.subtitle ? <div className="truncate text-xs text-gray-600">{it.subtitle}</div> : null}
              </div>
            </div>
            <div className="text-xs text-gray-500">#{i + 1}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

