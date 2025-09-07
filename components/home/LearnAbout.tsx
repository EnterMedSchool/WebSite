"use client";

import { useRef, useState } from "react";

export default function LearnAbout() {
  const src = "https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Vidinsta_Instagram-Post_6634e8cf0c8eb.mp4";
  const poster = "https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Untitled-design.png";
  const vRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function togglePlay() {
    const v = vRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  }

  return (
    <section className="my-12">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 sm:p-7 text-white shadow-[0_18px_44px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
        {/* Layout: video on the right, copy + steps on the left (stacks on mobile) */}
        <div className="grid items-center gap-6 lg:grid-cols-12">
          {/* Left: copy + steps */}
          <div className="lg:col-span-6">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">What is EnterMedSchool?</h2>
            <p className="mt-2 text-sm text-indigo-100/90">
              A live, map‑first way to discover medical schools in Europe — with real seat numbers, historical admission
              scores, and trends you can compare at a glance.
            </p>

            {/* How it works: compact three‑step in the same card */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { title: "Explore", items: ["Check seats & scores", "Compare on the live map" ] },
                { title: "Study", items: ["Free mini‑lessons", "Practice questions" ] },
                { title: "Socialize", items: ["Communities & forums", "Virtual libraries" ] },
              ].map((s, i) => (
                <div key={s.title} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  <div className="text-sm font-semibold">{i+1}. {s.title}</div>
                  <ul className="mt-1 list-disc pl-4 text-xs text-indigo-100/90">
                    {s.items.map((li) => (<li key={li}>{li}</li>))}
                  </ul>
                </div>
              ))}
            </div>

            <a href="#universities" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">
              Start Exploring
            </a>
          </div>

          {/* Right: portrait video */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl ring-1 ring-white/30 shadow-2xl">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={vRef} src={`${src}#t=0.1`} poster={poster} className="h-full w-full object-cover" playsInline preload="metadata" />

              {!playing && (
                <button onClick={togglePlay} className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-indigo-700 shadow-xl" aria-label="Play intro">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M8 5v14l11-7z"/></svg>
                </button>
              )}
              {playing && (
                <button onClick={togglePlay} className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/60" aria-label="Pause">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
