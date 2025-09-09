"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Image from "next/image";
import LeoConfused from "@/assets/leo-confused.png";
import Scribble from "@/assets/scribble.svg";

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
    <div ref={wrapRef} className="relative min-h-[70vh] w-full bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50">
      {/* Big rounded card */}
      <div className="mx-auto my-10 w-[min(1100px,95%)] rounded-[28px] border border-violet-200/50 bg-white/90 p-6 shadow-[0_30px_90px_rgba(99,102,241,0.25)] backdrop-blur-xl">
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
          {/* Left column */}
          <div className="relative p-4 sm:p-6">
            <div className="font-brand text-xl tracking-wider text-indigo-700">EnterMedSchool.com</div>
            <div className="mt-4 select-none text-[88px] font-extrabold leading-none text-transparent sm:text-[120px]"
                 style={{ WebkitTextStroke: "10px #7c3aed", backgroundImage: "linear-gradient(180deg,#f5f3ff,#f3e8ff)", WebkitBackgroundClip: "text" }}>404
            </div>
            <div className="mt-2 text-lg font-extrabold text-gray-800">Oops… page not found</div>
            <p className="mt-1 max-w-md text-sm text-gray-600">We suggest going back to the homepage while we tidy things up. If you think this is a bug, please let us know.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/" className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-95">Back to Homepage</Link>
              <a href="mailto:hello@entermedschool.com?subject=404%20feedback" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Report issue</a>
            </div>
            {/* Cute swirls */}
            <Swirl className="absolute -left-6 top-8 text-fuchsia-400/70" delay={0} refCb={(n)=>n && (layersRef.current[0]=n)} />
            <Swirl className="absolute left-40 top-24 text-indigo-400/70" delay={400} refCb={(n)=>n && (layersRef.current[1]=n)} />
          </div>

          {/* Right column: character */}
          <div className="relative">
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-3xl bg-fuchsia-100/60 blur-xl" />
            <div className="pointer-events-none absolute -left-8 bottom-6 h-20 w-20 rounded-full bg-indigo-100/60 blur-xl" />
            {/* Leo image (bundled asset) */}
            <div className="mx-auto h-64 w-auto animate-[bob_4s_ease-in-out_infinite] drop-shadow-[0_12px_24px_rgba(99,102,241,0.25)]">
              <Image src={LeoConfused} alt="Confused Leo" className="h-64 w-auto" />
            </div>
            {/* Floating question marks */}
            <Question style={{ left: "12%", top: "16%" }} refCb={(n)=>n && (layersRef.current[2]=n)} />
            <Question style={{ right: "10%", top: "8%" }} refCb={(n)=>n && (layersRef.current[3]=n)} />
            <Question style={{ right: "20%", bottom: "12%" }} refCb={(n)=>n && (layersRef.current[4]=n)} />
          </div>
        </div>
      </div>

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
      {/* Bundled swirl svg */}
      <Image src={Scribble} alt="swirl" width={40} height={40} />
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

// kept for reference if we ever need an inline fallback
const inlineSwirlSVG = `<svg viewBox='0 0 24 24' width='40' height='40' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='currentColor' stroke-width='1.8'><path d='M12 3c-5 0-8 4-8 7.5S6.5 18 11 18s6.5-2 6.5-4.5S15 9 12 9s-3.5 1-3.5 2.5S9.5 15 12 15s3.5-1 3.5-2.5' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
