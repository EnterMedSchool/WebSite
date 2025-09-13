"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import HaloNav from "@/components/nav/HaloNav";
import UniversitiesMenu from "@/components/nav/UniversitiesMenu";
import SearchTrigger from "@/components/nav/SearchTrigger";

type TopKey = "universities" | "exams" | "imat" | "search";

export default function SuperNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<TopKey>("universities");
  const ref = useRef<HTMLDivElement>(null);

  // Close layers when clicking outside
  useEffect(() => {
    function onDoc(e: MouseEvent) { if (!ref.current) return; if (!ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Row 1 */}
      <HaloNav className="hidden w-full min-w-0 md:flex items-center justify-center gap-1" >
        <div onMouseEnter={()=>{ setOpen(true); setActive("universities"); }} onFocus={()=>{ setOpen(true); setActive("universities"); }}>
          <UniversitiesMenu />
        </div>
        <Link data-nav-link href="/#exams"
          onMouseEnter={()=>{ setOpen(true); setActive("exams"); }} onFocus={()=>{ setOpen(true); setActive("exams"); }}
          className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white/90 hover:text-white">EXAMS</Link>
        <Link data-nav-link href="/#imat"
          onMouseEnter={()=>{ setOpen(true); setActive("imat"); }} onFocus={()=>{ setOpen(true); setActive("imat"); }}
          className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white/90 hover:text-white">IMAT COURSE</Link>
        <div onMouseEnter={()=>{ setOpen(true); setActive("search"); }} onFocus={()=>{ setOpen(true); setActive("search"); }}>
          <SearchTrigger className="ml-1" />
        </div>
      </HaloNav>

      {/* Mobile hamburger */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-full bg-white/10 px-3 py-1 text-white/90 ring-1 ring-white/20"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>
        </button>
      </div>

      {/* Rows 2+3: desktop hover/click reveal */}
      {open && (
        <div
          onMouseEnter={()=>setOpen(true)}
          onMouseLeave={()=>setOpen(false)}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 hidden overflow-hidden rounded-2xl shadow-2xl md:block"
        >
          <RowTwo active={active} />
          <RowThree active={active} />
        </div>
      )}

      {/* Mobile overlay: all 3 layers stacked with distinct colors */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-start bg-black/40 p-3 md:hidden" onClick={()=>setOpen(false)}>
          <div className="w-full overflow-hidden rounded-3xl shadow-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-700 to-violet-700 p-3">
              <div className="flex flex-wrap gap-2">
                <Link onClick={()=>setOpen(false)} href="/#universities" className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">UNIVERSITIES</Link>
                <Link onClick={()=>setOpen(false)} href="/#exams" className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">EXAMS</Link>
                <Link onClick={()=>setOpen(false)} href="/#imat" className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">IMAT COURSE</Link>
                <button onClick={()=>{ window.dispatchEvent(new Event('cmdk:open')); setOpen(false); }} className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">SEARCH</button>
              </div>
            </div>
            <div className="bg-emerald-50 p-3">
              <RowTwo active={active} compact />
            </div>
            <div className="bg-sky-50 p-3">
              <RowThree active={active} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RowTwo({ active, compact }: { active: TopKey; compact?: boolean }) {
  const content: Record<TopKey, { label: string; href: string }[]> = {
    universities: [
      { label: "Italy", href: "/#universities" },
      { label: "UK", href: "/#universities" },
      { label: "Germany", href: "/#universities" },
      { label: "Austria", href: "/#universities" },
    ],
    exams: [
      { label: "IMAT", href: "/#exams" },
      { label: "UCAT", href: "/#exams" },
      { label: "MedAT", href: "/#exams" },
      { label: "TMS", href: "/#exams" },
    ],
    imat: [
      { label: "Syllabus", href: "/#imat" },
      { label: "Lessons", href: "/#imat" },
      { label: "Practice", href: "/#imat" },
      { label: "Live Classes", href: "/#imat" },
    ],
    search: [
      { label: "Courses", href: "/#imat" },
      { label: "Questions", href: "/quiz" },
      { label: "Universities", href: "/#universities" },
    ],
  };
  const items = content[active];
  return (
    <div className="bg-emerald-50/90 px-4 py-3">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-2 gap-2 md:grid-cols-4">
        {items.map((i) => (
          <Link key={i.label} href={i.href} className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">
            {i.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function RowThree({ active, compact }: { active: TopKey; compact?: boolean }) {
  const content: Record<TopKey, { label: string; href: string; sub?: string }[]> = {
    universities: [
      { label: "Application timeline", href: "/#universities", sub: "Deadlines & steps" },
      { label: "Costs & fees", href: "/#universities", sub: "Tuition & living" },
      { label: "Scholarships", href: "/#scholarships", sub: "Financial aid" },
      { label: "Student life", href: "/#communities", sub: "Communities" },
    ],
    exams: [
      { label: "Live classes", href: "/#imat", sub: "Enroll now" },
    ],
    imat: [
      { label: "Planner", href: "/imat-planner", sub: "Daily plan" },
      { label: "Dashboard", href: "/dashboard", sub: "Progress & streak" },
      { label: "Community", href: "/#communities", sub: "Discuss & help" },
    ],
    search: [
      { label: "Try: 'Pavia requirements'", href: "/#universities" },
      { label: "Try: 'IMAT timing'", href: "/#exams" },
      { label: "Open command palette", href: "#", sub: "Ctrl/Cmd K" },
    ],
  };
  const items = content[active];
  return (
    <div className="bg-sky-50/95 px-4 py-3">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((i) => (
          <Link key={i.label} href={i.href} className="rounded-xl border border-sky-200 bg-white p-3 hover:bg-sky-50">
            <div className="text-sm font-semibold text-sky-800">{i.label}</div>
            {i.sub && <div className="text-[11px] text-sky-600">{i.sub}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
