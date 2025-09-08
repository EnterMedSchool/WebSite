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
    flag: "IT",
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
    flag: "GB",
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
    flag: "AT",
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
    flag: "DE",
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
    flag: "DE",
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
    flag: "🌐",
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

// Mini Italy map with pins (simple SVG + pulse)
function MiniItalyMap({ items, highlight }:
  { items: Array<{ name: string; city: string; x: number; y: number }>; highlight?: string | null }) {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl bg-white/60 p-2 ring-1 ring-indigo-100">
      <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full">
        <g fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.35)" strokeWidth="0.4">
          <path d="M58 18 L61 20 L63 22 L62 24 L64 26 L66 28 L65 30 L63 31 L62 33 L63 35 L66 37 L68 39 L67 41 L64 42 L62 44 L60 43 L59 40 L58 38 L57 36 L58 34 L57 32 L58 30 L59 28 L59 25 Z"/>
          <path d="M68 46 L72 47 L73 49 L70 50 L67 49 Z"/>
          <path d="M54 40 L56 41 L56 44 L54 45 L52 44 L52 41 Z"/>
        </g>
      </svg>
      {/* grid */}
      <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full opacity-30">
        <defs>
          <pattern id="gm" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="60" fill="url(#gm)" />
      </svg>
      {items.map((u) => {
        const active = highlight && u.name === highlight;
        return (
          <div key={u.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${u.x}%`, top: `${u.y}%` }}>
            <span className={`absolute -left-3 -top-3 rounded-full ${active? 'h-8 w-8 animate-ping bg-fuchsia-300/60' : 'h-6 w-6 animate-ping bg-emerald-300/50'}`} />
            <span className={`block rounded-full ring-2 ring-white ${active? 'h-4.5 w-4.5 bg-fuchsia-500' : 'h-3.5 w-3.5 bg-emerald-500'}`} />
          </div>
        );
      })}
    </div>
  );
}

export default function UniversitiesMenu() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(EXAMS[0].id);
  const [hoveredUni, setHoveredUni] = useState<string | null>(null);
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
          <div className="mx-auto w-[min(96vw,78rem)] rounded-2xl border bg-white p-6 shadow-2xl">
            <div className="grid grid-cols-12 gap-6">
              {/* Left: mini dynamic map (IMAT only) */}
              <div className="col-span-12 rounded-lg bg-indigo-50 p-3 sm:col-span-4">
                {selected.id === 'imat' ? (
                  <MiniItalyMap highlight={hoveredUni} items={[
                    { name: 'Turin', city: 'Turin', x: 53, y: 32 },
                    { name: 'Pavia', city: 'Pavia', x: 56, y: 38 },
                    { name: 'Parma', city: 'Parma', x: 58, y: 42 },
                    { name: 'Padova', city: 'Padova', x: 61, y: 35 },
                    { name: 'Milano Statale', city: 'Milan', x: 57, y: 37 },
                    { name: 'Milano Bicocca', city: 'Milan', x: 58, y: 36 },
                    { name: 'Bologna', city: 'Bologna', x: 61, y: 45 },
                    { name: 'Tor Vergata', city: 'Rome', x: 66, y: 59 },
                    { name: 'Ancona (M.D. & Tech)', city: 'Ancona', x: 68, y: 50 },
                    { name: 'La Sapienza', city: 'Rome', x: 65, y: 58 },
                    { name: 'Luigi Vanvitelli', city: 'Caserta', x: 69, y: 61 },
                    { name: 'Federico II', city: 'Naples', x: 70, y: 62 },
                    { name: 'Messina', city: 'Messina', x: 74, y: 70 },
                    { name: 'Bari Aldo Moro', city: 'Bari', x: 74, y: 58 },
                  ]} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.image} alt={selected.country} className="h-72 w-full rounded-md object-contain" />
                )}
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
                {selected.id === 'imat' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {['North','Center','South'].map((region) => (
                      <div key={region} className="col-span-1">
                        <div className="mb-1 text-sm font-semibold text-gray-700">{region}</div>
                        <ul className="space-y-1">
                          {selected.columns.find(c=>c.title===region)?.items.map((name)=> (
                            <li key={name} className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white px-2 py-1 text-sm text-gray-800 hover:bg-indigo-50"
                                onMouseEnter={()=>setHoveredUni(name)} onMouseLeave={()=>setHoveredUni(null)}>
                              <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">{name.split(' ').map(s=>s[0]).join('').slice(0,2)}</span>
                              <span className="truncate">{name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}

                {selected.cta && (
                  <div className="mt-6">
                    <Link href={selected.id==='imat' ? '/#universities' : (selected.cta.href)} className="inline-flex items-center rounded-xl bg-indigo-50 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-100">
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
