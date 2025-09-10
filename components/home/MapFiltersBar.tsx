"use client";

import { useMemo, useState, useRef, useEffect } from "react";

export type MapFilters = {
  q: string;
  country: string;
  language: string;
  exam: string;
  sort?: string; // ui-only for now
  colorMode?: 'exam' | 'language' | 'type';
  kind?: 'public' | 'private' | '';
  budget?: number; // ui-only EUR/month
  dorms?: boolean;
  scholarship?: boolean;
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
  onViewMobile?: () => void; // mobile-only action
  compact?: boolean;
  onOpenSaved?: () => void;
  onOpenCompare?: () => void;
  savedCount?: number;
  compareCount?: number;
};

export default function MapFiltersBar({ filters, onChange, countries, languages, exams, resultCount, suggestions = [], onPick, onViewMobile, compact = false, onOpenSaved, onOpenCompare, savedCount, compareCount }: Props) {
  const hasFilters = useMemo(() => {
    const { q, country, language, exam, kind, dorms, scholarship } = filters;
    return !!q || !!country || !!language || !!exam || !!kind || !!dorms || !!scholarship;
  }, [filters]);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && !compact) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [compact]);

  return (
    <div className={`pointer-events-auto mx-auto rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 ${compact ? 'p-3' : 'p-5'} shadow-[0_14px_40px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20 text-white`}>
      {!compact && (
        <div className="mb-2">
          <h2 className="text-xl font-extrabold tracking-tight">Where would you like to EnterMedSchool?</h2>
          <div className="mt-0.5 text-xs font-medium text-indigo-100/90">Showing Medical Courses in English</div>
        </div>
      )}

      {/* Two-line layout: first search, then dropdowns */}
      <div className="mt-2 space-y-2" ref={boxRef}>
        {/* Search row */}
        <div className="relative">
          <input
            ref={searchRef}
            value={filters.q}
            onChange={(e) => {
              onChange({ q: e.target.value });
              setOpen(e.target.value.trim().length >= 2);
              setActive(0);
            }}
            onFocus={() => setOpen((filters.q ?? '').trim().length >= 2)}
            onKeyDown={(e) => {
              if (!open) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, Math.max(0, suggestions.length - 1))); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter" && suggestions[active]) { e.preventDefault(); onPick?.(suggestions[active]); setOpen(false); }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Search university or city."
            className="w-full rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-violet-300 focus:outline-none"
          />
          {open && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-xl border border-white/30 bg-white/95 text-gray-900 shadow-2xl backdrop-blur-sm">
              {suggestions.slice(0, 8).map((s, i) => (
                <button
                  key={`${s.kind}-${s.value}-${i}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onPick?.(s); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${i === active ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                >
                  <span>
                    <span className="mr-2 inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-800">{s.kind}</span>
                    <span className="text-gray-900">{s.label}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown row */}
        <div className={compact ? "grid grid-cols-3 gap-2" : "grid grid-cols-1 gap-2 sm:grid-cols-3"}>
          <select
            value={filters.country}
            onChange={(e) => onChange({ country: e.target.value })}
            className="w-full min-w-0 rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filters.language}
            onChange={(e) => onChange({ language: e.target.value })}
            className="w-full min-w-0 rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm"
          >
            <option value="">All languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            value={filters.exam}
            onChange={(e) => onChange({ exam: e.target.value })}
            className="w-full min-w-0 rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm"
          >
            <option value="">All exams</option>
            {exams.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
          <button onClick={() => onChange({ exam: 'IMAT', language: 'English', country: 'Italy' })} className="rounded-full bg-white/20 px-2 py-0.5 font-semibold hover:bg-white/30">IMAT • English • Italy</button>
          <button onClick={() => onChange({ exam: 'UCAT', language: 'English' })} className="rounded-full bg-white/20 px-2 py-0.5 font-semibold hover:bg-white/30">UCAT • English</button>
          <button onClick={() => onChange({ country: 'Spain', language: '' })} className="rounded-full bg-white/20 px-2 py-0.5 font-semibold hover:bg-white/30">Focus Spain</button>
          <button onClick={() => onChange({ country: 'Poland', language: '' })} className="rounded-full bg-white/20 px-2 py-0.5 font-semibold hover:bg-white/30">Focus Poland</button>
        </div>

        {/* Advanced filters (UI only for now) */}
        {!compact && (
          <details className="mt-1 rounded-2xl bg-white/10 p-2 text-white/90">
            <summary className="cursor-pointer list-none text-xs font-semibold">More filters</summary>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="block text-xs">
                <span className="mb-1 block text-[11px] text-indigo-100/90">Type</span>
                <select value={filters.kind || ''} onChange={(e)=>onChange({ kind: (e.target.value as any) })} className="w-full rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm">
                  <option value="">Any</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <label className="block text-xs">
                <span className="mb-1 block text-[11px] text-indigo-100/90">Budget (€/mo)</span>
                <input type="range" min={300} max={1500} step={50} value={typeof filters.budget==='number' ? filters.budget : 900} onChange={(e)=>onChange({ budget: Number(e.target.value) })} className="w-full" />
                <span className="mt-0.5 block text-[11px]">{filters.budget ?? 900}</span>
              </label>
              <div className="flex flex-col justify-end gap-1 text-xs">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!filters.dorms} onChange={(e)=>onChange({ dorms: e.target.checked })} /><span>Dorms</span></label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!filters.scholarship} onChange={(e)=>onChange({ scholarship: e.target.checked })} /><span>Scholarships</span></label>
              </div>
            </div>
          </details>
        )}
        {/* Mobile action button */}
        {onViewMobile && (
          <div className="block lg:hidden pt-1">
            <button
              type="button"
              onClick={onViewMobile}
              className="w-full rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-white/40 hover:bg-white"
            >
              View universities
            </button>
          </div>
        )}
      </div>

      <div className={`mt-3 flex flex-wrap items-center gap-3 ${compact ? 'justify-between' : ''}`}>
        {typeof resultCount === 'number' && (
          <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">{resultCount} results</div>
        )}
        {/* Sort by (ui only for now) */}
        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline-block text-indigo-100/90">Sort by</span>
          <select
            value={filters.sort || ''}
            onChange={(e) => onChange({ sort: e.target.value })}
            className="rounded-lg border border-white/20 bg-white/95 px-2 py-1 text-[11px] text-gray-900 shadow-sm"
          >
            <option value="">Popularity</option>
            <option value="tuition-asc">Tuition (low to high)</option>
            <option value="seats-desc">Seats (high to low)</option>
            <option value="deadline-asc">Deadline (soonest)</option>
          </select>
        </div>
        {/* Color mode + Legend */}
        <div className="ml-auto flex items-center gap-2 text-[10px]">
          <select
            value={filters.colorMode || 'exam'}
            onChange={(e) => onChange({ colorMode: e.target.value as any })}
            className="rounded-lg border border-white/20 bg-white/95 px-2 py-1 text-[11px] text-gray-900 shadow-sm"
            title="Color markers by"
          >
            <option value="exam">Color by Exam</option>
            <option value="language">Color by Language</option>
            <option value="type">Color by Type</option>
          </select>
          {((filters.colorMode||'exam') === 'exam') && (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold"><span className="h-2 w-2 rounded-full bg-indigo-400" /> IMAT</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold"><span className="h-2 w-2 rounded-full bg-emerald-400" /> UCAT</span>
            </>
          )}
          {((filters.colorMode||'exam') === 'language') && (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold"><span className="h-2 w-2 rounded-full bg-teal-400" /> English</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold"><span className="h-2 w-2 rounded-full bg-sky-400" /> Italian</span>
            </>
          )}
          {((filters.colorMode||'exam') === 'type') && (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold"><span className="h-2 w-2 rounded-full bg-amber-400" /> Private</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold"><span className="h-2 w-2 rounded-full bg-indigo-400" /> Public</span>
            </>
          )}
        </div>
        <button
          type="button"
          className="rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25"
          onClick={() => {
            try {
              const url = window.location.href;
              if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(url);
            } catch {}
          }}
        >
          Share search
        </button>
        {onOpenSaved && (
          <button onClick={onOpenSaved} className="rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25">Saved{typeof savedCount==='number' ? ` (${savedCount})` : ''}</button>
        )}
        {onOpenCompare && (
          <button onClick={onOpenCompare} className="rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25">Compare{typeof compareCount==='number' ? ` (${compareCount})` : ''}</button>
        )}
        {hasFilters && (
          <button
            type="button"
            className="rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25"
            onClick={() => onChange({ q: "", country: "", language: "", exam: "" })}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
