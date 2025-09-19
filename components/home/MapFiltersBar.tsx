"use client";

import { useMemo, useState, useRef, useEffect } from "react";

export type MapFilters = {
  q: string;
  country: string;
  language: string;
  exam: string;
  sort?: string; // ui-only for now
  colorMode?: "exam" | "language" | "type";
  kind?: "public" | "private" | "";
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
  defaultAdvancedOpen?: boolean;
};

const COLOR_OPTIONS: Array<{ value: "exam" | "language" | "type"; label: string }> = [
  { value: "exam", label: "Exam" },
  { value: "language", label: "Language" },
  { value: "type", label: "Type" },
];

export default function MapFiltersBar({ filters, onChange, countries, languages, exams, resultCount, suggestions = [], onPick, onViewMobile, compact = false, onOpenSaved, onOpenCompare, savedCount, compareCount, defaultAdvancedOpen = false }: Props) {
  const hasFilters = useMemo(() => {
    const { q, country, language, exam, kind, dorms, scholarship } = filters;
    return !!q || !!country || !!language || !!exam || !!kind || !!dorms || !!scholarship;
  }, [filters]);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [advOpen, setAdvOpen] = useState<boolean>(!compact && defaultAdvancedOpen);
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
      if (e.key === "/" && !compact) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [compact]);

  const colorMode = (filters.colorMode || "exam") as "exam" | "language" | "type";

  const suggestionItems = suggestions.slice(0, 8);

  if (compact) {
    const quickFilters: Array<{ label: string; patch: Partial<MapFilters>; active: boolean }> = [
      {
        label: "All Italy",
        patch: { country: "Italy", exam: "", language: "", kind: "", q: "" },
        active:
          filters.country === "Italy" &&
          !filters.exam &&
          !filters.language &&
          (!filters.kind),
      },
      {
        label: "IMAT only",
        patch: { country: "Italy", exam: "IMAT", language: "English", kind: "" },
        active: filters.exam?.toLowerCase() === "imat",
      },
      {
        label: "UCAT only",
        patch: { exam: "UCAT", language: "English", country: "", kind: "" },
        active: filters.exam?.toLowerCase() === "ucat",
      },
      {
        label: "Public",
        patch: { country: "Italy", kind: "public" },
        active: filters.kind === "public",
      },
      {
        label: "Private",
        patch: { country: "Italy", kind: "private" },
        active: filters.kind === "private",
      },
    ];

    return (
      <div ref={boxRef} className="pointer-events-auto w-full">
        <div className="mx-auto w-full rounded-[26px] border border-white/50 bg-white/95 px-4 pb-4 pt-3 text-indigo-900 shadow-[0_20px_50px_rgba(79,70,229,0.18)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">Italy map</div>
              <div className="text-lg font-semibold text-indigo-900">{typeof resultCount === "number" ? `${resultCount} results` : "Results"}</div>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  onChange({ q: "", country: "", language: "", exam: "", kind: "", dorms: false, scholarship: false });
                }}
                className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative mt-3">
            <input
              ref={searchRef}
              value={filters.q}
              onChange={(e) => {
                onChange({ q: e.target.value });
                setOpen(e.target.value.trim().length >= 2);
                setActive(0);
              }}
              onFocus={() => setOpen((filters.q ?? "").trim().length >= 2 && suggestionItems.length > 0)}
              onKeyDown={(e) => {
                if (!open) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, Math.max(0, suggestionItems.length - 1)));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                }
                if (e.key === "Enter" && suggestionItems[active]) {
                  e.preventDefault();
                  onPick?.(suggestionItems[active]);
                  setOpen(false);
                }
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Search university or city"
              className="w-full rounded-2xl border border-indigo-100 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-indigo-300 focus:border-indigo-400 focus:outline-none"
            />
            {open && suggestionItems.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-2xl border border-indigo-100 bg-white text-gray-900 shadow-2xl">
                {suggestionItems.map((s, i) => (
                  <button
                    key={`${s.kind}-${s.value}-${i}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onPick?.(s);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${i === active ? "bg-indigo-50" : "hover:bg-indigo-50"}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-700">{s.kind}</span>
                      <span className="text-gray-900">{s.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickFilters.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  onChange(chip.patch);
                  setOpen(false);
                }}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${chip.active ? "bg-indigo-600 text-white shadow-sm" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">Sort</span>
            <select
              value={filters.sort || ""}
              onChange={(e) => onChange({ sort: e.target.value })}
              className="flex-1 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-[13px] text-indigo-700 shadow-sm"
            >
              <option value="">Popularity</option>
              <option value="tuition-asc">Tuition (low to high)</option>
              <option value="seats-desc">Seats (high to low)</option>
              <option value="deadline-asc">Deadline (soonest)</option>
            </select>
          </div>

          <div className="mt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">Color markers by</span>
            <div className="mt-2 flex rounded-full bg-indigo-100/70 p-1 text-[11px] font-semibold text-indigo-600">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ colorMode: opt.value })}
                  className={`flex-1 rounded-full px-3 py-1 transition ${colorMode === opt.value ? "bg-white text-indigo-700 shadow" : "opacity-80 hover:opacity-100"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
            {onViewMobile && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onViewMobile();
                }}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-white shadow-sm hover:bg-indigo-700"
              >
                View results
              </button>
            )}
            {onOpenCompare && (
              <button
                type="button"
                onClick={() => onOpenCompare?.()}
                className="rounded-xl bg-white px-3 py-2 text-indigo-600 shadow-sm ring-1 ring-indigo-100 hover:bg-indigo-50"
              >
                Compare{typeof compareCount === "number" ? ` (${compareCount})` : ""}
              </button>
            )}
          </div>

          {onOpenSaved && (
            <button
              type="button"
              onClick={() => onOpenSaved?.()}
              className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-indigo-100 hover:bg-indigo-50"
            >
              Saved{typeof savedCount === "number" ? ` (${savedCount})` : ""}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto mx-auto rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-[0_14px_40px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
      <div className="mb-2">
        <h2 className="text-xl font-extrabold tracking-tight">Where would you like to EnterMedSchool?</h2>
        <div className="mt-0.5 text-xs font-medium text-indigo-100/90">Showing Medical Courses in English</div>
      </div>

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
            onFocus={() => setOpen((filters.q ?? "").trim().length >= 2)}
            onKeyDown={(e) => {
              if (!open) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(0, suggestionItems.length - 1)));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && suggestionItems[active]) {
                e.preventDefault();
                onPick?.(suggestionItems[active]);
                setOpen(false);
              }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Search university or city."
            className="w-full rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-violet-300 focus:outline-none"
          />
          {open && suggestionItems.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-xl border border-white/30 bg-white/95 text-gray-900 shadow-2xl backdrop-blur-sm">
              {suggestionItems.map((s, i) => (
                <button
                  key={`${s.kind}-${s.value}-${i}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick?.(s);
                    setOpen(false);
                  }}
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={filters.country}
            onChange={(e) => onChange({ country: e.target.value })}
            className="w-full min-w-0 rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filters.language}
            onChange={(e) => onChange({ language: e.target.value })}
            className="w-full min-w-0 rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm"
          >
            <option value="">All languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={filters.exam}
            onChange={(e) => onChange({ exam: e.target.value })}
            className="w-full min-w-0 rounded-xl border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm"
          >
            <option value="">All exams</option>
            {exams.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
          <button onClick={() => onChange({ exam: "IMAT", language: "English", country: "Italy" })} className="rounded-full bg-white/20 px-2 py-0.5 font-semibold hover:bg-white/30">
            IMAT ??? English ??? Italy
          </button>
          <button onClick={() => onChange({ exam: "UCAT", language: "English" })} className="rounded-full bg-white/20 px-2 py-0.5 font-semibold hover:bg-white/30">
            UCAT ??? English
          </button>
          <button onClick={() => onChange({ country: "Spain", language: "" })} className="rounded-full bg-white/20 px-2 py-0.5 font-semibold hover:bg-white/30">
            Focus Spain
          </button>
          <button onClick={() => onChange({ country: "Poland", language: "" })} className="rounded-full bg-white/20 px-2 py-0.5 font-semibold hover:bg-white/30">
            Focus Poland
          </button>
        </div>

        {/* Advanced filters (UI only for now) */}
        <details
          className="rounded-2xl bg-indigo-800/30 px-4 py-3 shadow-inner"
          open={advOpen}
          onToggle={(e) => setAdvOpen(e.currentTarget.open)}
        >
          <summary className="cursor-pointer select-none text-sm font-semibold">Advanced filters</summary>
          <div className="mt-3 space-y-3 text-[13px] text-indigo-100">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-indigo-200/80">Kind</span>
                <select
                  value={filters.kind || ""}
                  onChange={(e) => onChange({ kind: e.target.value as MapFilters["kind"] })}
                  className="rounded-xl border border-white/30 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm"
                >
                  <option value="">Any</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-indigo-200/80">Budget (EUR/mo)</span>
                <input
                  type="number"
                  value={filters.budget ?? ""}
                  onChange={(e) => onChange({ budget: e.target.value ? Number(e.target.value) : undefined })}
                  className="rounded-xl border border-white/30 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm"
                  placeholder="Any"
                />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!filters.dorms}
                  onChange={(e) => onChange({ dorms: e.target.checked })}
                />
                <span>Dorms available</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!filters.scholarship}
                  onChange={(e) => onChange({ scholarship: e.target.checked })}
                />
                <span>Scholarships</span>
              </label>
            </div>
          </div>
        </details>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {typeof resultCount === "number" && (
          <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">{resultCount} results</div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline-block text-indigo-100/90">Sort by</span>
          <select
            value={filters.sort || ""}
            onChange={(e) => onChange({ sort: e.target.value })}
            className="rounded-lg border border-white/20 bg-white/95 px-2 py-1 text-[11px] text-gray-900 shadow-sm"
          >
            <option value="">Popularity</option>
            <option value="tuition-asc">Tuition (low to high)</option>
            <option value="seats-desc">Seats (high to low)</option>
            <option value="deadline-asc">Deadline (soonest)</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px]">
          <select
            value={colorMode}
            onChange={(e) => onChange({ colorMode: e.target.value as MapFilters["colorMode"] })}
            className="rounded-lg border border-white/20 bg-white/95 px-2 py-1 text-[11px] text-gray-900 shadow-sm"
            title="Color markers by"
          >
            {COLOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {(colorMode === "exam") && (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold"><span className="h-2 w-2 rounded-full bg-indigo-400" /> IMAT</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold"><span className="h-2 w-2 rounded-full bg-emerald-400" /> UCAT</span>
            </>
          )}
          {(colorMode === "language") && (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold"><span className="h-2 w-2 rounded-full bg-teal-400" /> English</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold"><span className="h-2 w-2 rounded-full bg-sky-400" /> Italian</span>
            </>
          )}
          {(colorMode === "type") && (
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
          <button onClick={onOpenSaved} className="rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25">
            Saved{typeof savedCount === "number" ? ` (${savedCount})` : ""}
          </button>
        )}
        {onOpenCompare && (
          <button onClick={onOpenCompare} className="rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25">
            Compare{typeof compareCount === "number" ? ` (${compareCount})` : ""}
          </button>
        )}
        {hasFilters && (
          <button
            type="button"
            className="rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25"
            onClick={() => onChange({ q: "", country: "", language: "", exam: "", kind: "", dorms: false, scholarship: false })}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

