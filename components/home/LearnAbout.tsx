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
        <div className="grid items-center gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Learn About EnterMedSchool</h2>
            <p className="mt-2 text-sm text-indigo-100/90">
              Find the perfect medical school in Europe with real seat numbers, scores and trends. Watch this quick intro
              and start exploring.
            </p>
            <a
              href="#universities"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
            >
              Start Exploring
            </a>
          </div>
          <div className="relative">
            <div className="aspect-[9/16] w-full max-w-[360px] mx-auto overflow-hidden rounded-2xl ring-1 ring-white/30 shadow-2xl">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={vRef} src={`${src}#t=0.1`} poster={poster} className="h-full w-full object-cover" playsInline preload="metadata" />
            </div>
            {/* Play overlay */}
            {!playing && (
              <button
                onClick={togglePlay}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-14 w-14 place-items-center rounded-full bg-white/90 text-indigo-700 shadow-xl"
                aria-label="Play intro"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M8 5v14l11-7z"/></svg>
              </button>
            )}
            {playing && (
              <button
                onClick={togglePlay}
                className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/60"
                aria-label="Pause"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
