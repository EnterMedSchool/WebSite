"use client";

import { useMemo, useState, useRef, useEffect } from "react";

export type MapFilters = {
  q: string;
  country: string;
  language: string;
  exam: string;
};

type Props = {
  filters: MapFilters;
  onChange: (p: Partial<MapFilters>) => void;
  countries: string[];
  languages: string[];
  exams: string[];
  resultCount?: number;
  suggestions?: Array<{ label: string; kind: "uni" | "city" | "country"; value: string }>;
  onPick?: (s: { label: string; kind: "uni" | "city" | "country"; value: string }) => void;
};

export default function MapFiltersBar({ filters, onChange, countries, languages, exams, resultCount, suggestions = [], onPick }: Props) {
  const hasFilters = useMemo(() => {
    const { q, country, language, exam } = filters;
    return !!q || !!country || !!language || !!exam;
  }, [filters]);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="pointer-events-auto mx-auto w-[min(520px,42vw)] rounded-3xl bg-white/80 p-5 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
      <div className="mb-2">
        <h2 className="text-xl font-extrabold tracking-tight text-indigo-800">Where would you like to EnterMedSchool?</h2>
        <div className="mt-0.5 text-xs font-medium text-indigo-700/80">Showing Medical Courses in English</div>
      </div>
      <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-5 relative" ref={boxRef}>
        {/* Query */}
        <input
          value={filters.q}
          onChange={(e) => {
            onChange({ q: e.target.value });
            setOpen(e.target.value.trim().length >= 2);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, Math.max(0, suggestions.length - 1))); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
            if (e.key === "Enter" && suggestions[active]) { e.preventDefault(); onPick?.(suggestions[active]); setOpen(false); }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search university or city…"
          className="col-span-2 rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        />
        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <div className="absolute z-50 mt-[42px] w-[min(520px,42vw)] overflow-hidden rounded-xl border bg-white shadow-lg">
            {suggestions.slice(0, 8).map((s, i) => (
              <button
                key={`${s.kind}-${s.value}-${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onPick?.(s); setOpen(false); }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${i === active ? "bg-indigo-50" : "hover:bg-gray-50"}`}
              >
                <span>
                  <span className="mr-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-700">{s.kind}</span>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        )}
        {/* Country */}
        <select
          value={filters.country}
          onChange={(e) => onChange({ country: e.target.value })}
          className="rounded-xl border px-3 py-2 text-sm shadow-sm"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {/* Language */}
        <select
          value={filters.language}
          onChange={(e) => onChange({ language: e.target.value })}
          className="rounded-xl border px-3 py-2 text-sm shadow-sm"
        >
          <option value="">All languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        {/* Exam */}
        <select
          value={filters.exam}
          onChange={(e) => onChange({ exam: e.target.value })}
          className="rounded-xl border px-3 py-2 text-sm shadow-sm"
        >
          <option value="">All exams</option>
          {exams.map((x) => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex items-center gap-3">
        {typeof resultCount === 'number' && (
          <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{resultCount} results</div>
        )}
        {hasFilters && (
          <button
            type="button"
            className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
            onClick={() => onChange({ q: "", country: "", language: "", exam: "" })}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}




