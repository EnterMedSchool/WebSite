"use client";

import { useMemo } from "react";

export type MapFilters = {
  q: string;
  country: string;
  language: string;
  exam: string;
  minScore: number;
};

type Props = {
  filters: MapFilters;
  onChange: (p: Partial<MapFilters>) => void;
  countries: string[];
  languages: string[];
  exams: string[];
};

export default function MapFiltersBar({ filters, onChange, countries, languages, exams }: Props) {
  const hasFilters = useMemo(() => {
    const { q, country, language, exam, minScore } = filters;
    return !!q || !!country || !!language || !!exam || minScore > 0;
  }, [filters]);

  return (
    <div className="pointer-events-auto mx-auto w-[min(1100px,96vw)] rounded-3xl bg-white/80 p-5 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
      <div className="mb-2">
        <h2 className="text-xl font-extrabold tracking-tight text-indigo-800">Where would you like to EnterMedSchool?</h2>
        <div className="mt-0.5 text-xs font-medium text-indigo-700/80">Showing Medical Courses in English</div>
      </div>
      <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-5">
        {/* Query */}
        <input
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Search university or city…"
          className="col-span-2 rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        />
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
        <label className="text-sm text-gray-600">Min admission score</label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={filters.minScore}
          onChange={(e) => onChange({ minScore: Number(e.target.value) })}
          className="flex-1"
        />
        <div className="w-10 text-right text-sm text-gray-700">{filters.minScore}</div>
        {hasFilters && (
          <button
            type="button"
            className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
            onClick={() => onChange({ q: "", country: "", language: "", exam: "", minScore: 0 })}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}




