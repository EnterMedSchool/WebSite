"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Image from "next/image";
import LeoConfused from "@/assets/leo-confused.png";

export default function NotFound() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement[]>([] as any);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const b = wrapRef.current?.getBoundingClientRect();
      if (!b) return;
      const x = (e.clientX - b.left) / b.width - 0.5;
      const y = (e.clientY - b.top) / b.height - 0.5;
      layersRef.current.forEach((el, i) => {
        const k = (i + 1) * 4; // subtle parallax
        el.style.transform = `translate(${x * k}px, ${y * k}px)`;
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={wrapRef} className="relative isolate min-h-screen w-full overflow-hidden bg-gradient-to-b from-indigo-50 via-violet-50 to-fuchsia-50">
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(1200px_600px_at_70%_0%,rgba(129,140,248,0.18),transparent),radial-gradient(1000px_500px_at_0%_100%,rgba(192,132,252,0.20),transparent)]" />
      {/* Grid overlay across the whole area (no edge mask) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
        style={{ background: "linear-gradient(to right, rgba(99,102,241,.22) 1px, transparent 1px) 0 0/22px 22px, linear-gradient(to bottom, rgba(99,102,241,.22) 1px, transparent 1px) 0 0/22px 22px" }}
      />

      {/* Content */}
      <section className="relative mx-auto my-8 w-[min(1200px,94%)] rounded-[28px] border border-white/30 bg-white/80 p-6 shadow-[0_30px_100px_rgba(79,70,229,0.25)] backdrop-blur-xl sm:my-10 sm:p-8">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
          {/* Left copy */}
          <div className="relative md:col-span-7 lg:col-span-7">
            <div className="font-brand text-sm tracking-wider text-indigo-700 sm:text-base">EnterMedSchool.com</div>
            <div className="mt-3 flex items-end gap-3">
              <h1 className="select-none text-[84px] font-extrabold leading-none text-transparent sm:text-[120px]" style={{ WebkitTextStroke: "10px #7c3aed", backgroundImage: "linear-gradient(180deg,#f5f3ff,#f3e8ff)", WebkitBackgroundClip: "text" }}>404</h1>
              <span className="mb-3 hidden rounded-full bg-fuchsia-100 px-2 py-1 text-xs font-semibold text-fuchsia-700 sm:inline">Lost</span>
            </div>
            <div className="mt-1 text-xl font-extrabold text-gray-900 sm:text-2xl">Page not found</div>
            <p className="mt-2 max-w-xl text-sm text-gray-600">We couldn’t find that page. Try one of these popular destinations, or go back to the homepage.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/" className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95">Back to Homepage</Link>
              <a href="mailto:hello@entermedschool.com?subject=404%20feedback" className="rounded-full border border-gray-300 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Report issue</a>
            </div>

            {/* Suggestions */}
            <div className="mt-6 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
              <Suggest href="/#universities" title="Universities Map" subtitle="Explore programs and cities" icon="map" />
              <Suggest href="/imat-course" title="IMAT Course" subtitle="Ace the entrance exam" icon="star" />
            </div>

            {/* Swirls */}
            <Swirl className="absolute -left-7 top-5 text-fuchsia-400/70" delay={0} refCb={(n)=>n && (layersRef.current[0]=n)} />
            <Swirl className="absolute left-40 top-28 text-indigo-400/70" delay={400} refCb={(n)=>n && (layersRef.current[1]=n)} />
          </div>

          {/* Right illustration */}
          <div className="relative md:col-span-5 lg:col-span-5">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-3xl bg-fuchsia-200/40 blur-2xl" />
            <div className="pointer-events-none absolute -left-8 bottom-6 h-24 w-24 rounded-full bg-indigo-200/40 blur-2xl" />
            <div className="relative mx-auto flex h-64 w-[260px] items-center justify-center sm:h-72 sm:w-[300px]">
              <Image priority src={LeoConfused} alt="Confused Leo" className="h-56 w-auto sm:h-64 drop-shadow-[0_12px_24px_rgba(99,102,241,0.25)]" />
            </div>
            <Question style={{ left: "10%", top: "8%" }} refCb={(n)=>n && (layersRef.current[2]=n)} />
            <Question style={{ right: "12%", top: "12%" }} refCb={(n)=>n && (layersRef.current[3]=n)} />
            <Question style={{ right: "20%", bottom: "8%" }} refCb={(n)=>n && (layersRef.current[4]=n)} />
          </div>
        </div>
      </section>

      <style>{`
        @keyframes bob { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } }
        @keyframes scribble { 0%{ transform: rotate(0deg) } 100%{ transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

function Swirl({ className, delay=0, refCb }: { className?: string; delay?: number; refCb?: (n: HTMLDivElement|null)=>void }) {
  return (
    <div ref={refCb as any} className={`${className||''} h-10 w-10 animate-[scribble_8s_linear_infinite]`} style={{ animationDelay: `${delay}ms` }}>
      <svg viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3c-5 0-8 4-8 7.5S6.5 18 11 18s6.5-2 6.5-4.5S15 9 12 9s-3.5 1-3.5 2.5S9.5 15 12 15s3.5-1 3.5-2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function Question({ style, refCb }: { style?: React.CSSProperties; refCb?: (n: HTMLDivElement|null)=>void }) {
  return (
    <div ref={refCb as any} style={style} className="pointer-events-none absolute select-none text-3xl font-extrabold text-indigo-400/80">
      ?
    </div>
  );
}

// kept for reference: no external asset needed now

function Suggest({ href, title, subtitle, icon }: { href: string; title: string; subtitle: string; icon: 'map'|'star'|'book' }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-2xl border border-indigo-100 bg-white/80 p-3 shadow-sm ring-1 ring-white/40 backdrop-blur transition hover:shadow-md">
      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
        {icon==='map' && (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M9 3l6 2 6-2v16l-6 2-6-2-6 2V5l6-2zm0 2L5 6v12l4-1.333V5zm2 0v12l4 1.333V6L11 5zm6 0v12l2-.667V4.333L17 5z"/></svg>
        )}
        {icon==='star' && (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
        )}
        {icon==='book' && (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M18 2H9a3 3 0 00-3 3v14a3 3 0 013-3h9v-2H9a5 5 0 00-3 1V5a1 1 0 011-1h11v16a1 1 0 001 1h1V3a1 1 0 00-1-1z"/></svg>
        )}
      </span>
      <span>
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-xs text-gray-600">{subtitle}</div>
      </span>
    </Link>
  );
}
