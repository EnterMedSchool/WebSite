"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Exam = {
  id: string;
  label: string;
  flag: string; // emoji for demo
  country: string;
  image: string; // demo map image
  columns: Array<{ title: string; items: string[] }>;
  cta?: { label: string; href: string };
};

const EXAMS: Exam[] = [
  {
    id: "imat",
    label: "IMAT",
    flag: "🇮🇹",
    country: "Italy",
    image: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/04/italy_map.svg",
    columns: [
      { title: "North", items: ["Turin", "Pavia", "Parma", "Padova", "Milano Statale", "Milano Bicocca", "Bologna"] },
      { title: "Center", items: ["Tor Vergata", "Ancona (M.D. & Tech)", "La Sapienza"] },
      { title: "South", items: ["Luigi Vanvitelli", "Federico II", "Messina", "Bari Aldo Moro"] },
    ],
    cta: { label: "Universities in Italy", href: "#" },
  },
  {
    id: "ucat",
    label: "UCAT",
    flag: "🇬🇧",
    country: "United Kingdom",
    image: "https://upload.wikimedia.org/wikipedia/commons/1/10/Blank_map_of_the_United_Kingdom.svg",
    columns: [
      { title: "England", items: ["King's College London", "Manchester", "Bristol", "Sheffield"] },
      { title: "Scotland", items: ["Glasgow", "Edinburgh", "Aberdeen"] },
      { title: "Wales / N.I.", items: ["Cardiff", "Swansea", "Queen's Belfast"] },
    ],
    cta: { label: "Universities in the UK", href: "#" },
  },
  {
    id: "medat",
    label: "MedAT",
    flag: "🇦🇹",
    country: "Austria",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/41/Blank_map_of_Austria.svg",
    columns: [
      { title: "Vienna", items: ["MedUni Vienna", "Dentistry Vienna"] },
      { title: "Graz", items: ["MedUni Graz", "Dentistry Graz"] },
      { title: "Others", items: ["Innsbruck", "Linz"] },
    ],
    cta: { label: "Universities in Austria", href: "#" },
  },
  {
    id: "ham-nat",
    label: "HAM-Nat",
    flag: "🇩🇪",
    country: "Germany",
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Blank_map_of_Germany.svg",
    columns: [
      { title: "North", items: ["Hamburg", "Berlin"] },
      { title: "West", items: ["Bochum", "Dortmund"] },
      { title: "South", items: ["Heidelberg", "Munich"] },
    ],
    cta: { label: "Universities in Germany", href: "#" },
  },
  {
    id: "tms",
    label: "TMS",
    flag: "🇩🇪",
    country: "Germany",
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Blank_map_of_Germany.svg",
    columns: [
      { title: "Focus", items: ["Cognitive test", "Pattern recognition", "Spatial awareness"] },
      { title: "Prep", items: ["Practice packs", "Timed mocks"] },
      { title: "Dates", items: ["Spring", "Autumn"] },
    ],
    cta: { label: "About the TMS", href: "#" },
  },
  {
    id: "sat-med",
    label: "SAT Med",
    flag: "🌍",
    country: "International",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg",
    columns: [
      { title: "Topics", items: ["Biology", "Chemistry", "Math"] },
      { title: "Regions", items: ["EU", "MENA", "APAC"] },
      { title: "Format", items: ["MCQ", "Essay"] },
    ],
    cta: { label: "Global programs", href: "#" },
  },
];

export default function UniversitiesMenu() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(EXAMS[0].id);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  const selected = useMemo(() => EXAMS.find((e) => e.id === selectedId) ?? EXAMS[0], [selectedId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (!open) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        const idx = EXAMS.findIndex((x) => x.id === selectedId);
        setSelectedId(EXAMS[(idx + 1) % EXAMS.length].id);
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        const idx = EXAMS.findIndex((x) => x.id === selectedId);
        setSelectedId(EXAMS[(idx - 1 + EXAMS.length) % EXAMS.length].id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selectedId]);

  // Close when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function clearCloseTimer() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 200);
  }

  return (
    <div ref={ref} className="inline-block">
      <button
        type="button"
        className={`text-sm font-semibold uppercase tracking-wide text-white/90 hover:text-white px-1 py-1 ${open ? "opacity-100" : ""}`}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => {
          clearCloseTimer();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
        onFocus={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Universities
      </button>

      {open && (
        <div
          className="fixed inset-x-0 z-50 pt-3"
          style={{ top: "96px" }}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          <div className="mx-auto w-[min(96vw,72rem)] rounded-2xl border bg-white p-6 shadow-2xl">
            <div className="grid grid-cols-12 gap-6">
              {/* Left: country image (for selected exam) */}
              <div className="col-span-12 rounded-lg bg-indigo-50 p-3 sm:col-span-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.image} alt={selected.country} className="h-72 w-full rounded-md object-contain" />
              </div>

              {/* Middle: exam selector list */}
              <div className="col-span-12 sm:col-span-3">
                <div className="space-y-2" role="menu" aria-label="Exam selector">
                  {EXAMS.map((exam) => {
                    const active = exam.id === selected.id;
                    return (
                      <button
                        key={exam.id}
                        onClick={() => setSelectedId(exam.id)}
                        className={`w-full rounded-xl px-4 py-3 text-left font-semibold ${
                          active ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-700"
                        }`}
                        role="menuitemradio"
                        aria-checked={active}
                      >
                        <span className="mr-2">{exam.flag}</span>
                        {exam.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: dynamic columns for selected exam */}
              <div className="col-span-12 sm:col-span-5">
                <h3 className="mb-2 text-lg font-bold tracking-wide text-gray-800">{selected.country}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {selected.columns.map((col) => (
                    <div key={col.title}>
                      <div className="font-semibold text-gray-700">{col.title}</div>
                      <ul className="mt-2 space-y-1 text-gray-600">
                        {col.items.map((it) => (
                          <li key={it}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {selected.cta && (
                  <div className="mt-6">
                    <Link href={selected.cta.href} className="inline-flex items-center rounded-xl bg-indigo-50 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-100">
                      {selected.cta.label}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
