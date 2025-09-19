"use client";

import { useEffect, useState } from "react";

type Anchor = { pos: number; id: string; label: string };

type Props = {
  src?: string; // can be file or YouTube URL
  iframeSrc?: string; // explicit iframe URL (e.g., Bunny embed)
  poster?: string;
  locked?: boolean;
  lockReason?: string;
  onUnlock?: () => void;
  overlayTitle?: string;
  overlaySubtitle?: string;
  subtitles?: any; // integrated controls only (skeleton)
  prev?: { href: string; title: string } | null;
  next?: { href: string; title: string } | null;
  anchors?: Anchor[];
};

function toYouTubeEmbed(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (/youtu\.be$/.test(u.hostname)) {
      const id = u.pathname.replace(/^\//, "");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (/youtube\.com$/.test(u.hostname)) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      const m = u.pathname.match(/\/embed\/([^/]+)/);
      if (m?.[1]) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
    }
  } catch {}
  return null;
}

export default function VideoPanel({ src, iframeSrc, poster, locked, lockReason, onUnlock, overlayTitle, overlaySubtitle, subtitles, prev, next, anchors }: Props) {
  const yt = toYouTubeEmbed(src);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 0.6)), 80);
    return () => window.clearInterval(id);
  }, []);
  function highlight(id?: string) {
    if (!id) return;
    try {
      const el = document.querySelector(`[data-lesson-anchor="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.classList.add('ring-2','ring-sky-300','bg-sky-50');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => el.classList.remove('ring-2','ring-sky-300','bg-sky-50'), 1800);
    } catch {}
  }
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl bg-white/90 shadow-xl ring-1 ring-sky-100">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-50 via-amber-50 to-rose-50 opacity-90" aria-hidden="true" />
        {/* Preview image with start CTA; loads embed only after click */}
        {!playing ? (
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <div className="absolute inset-0">
              <img src={poster || "/graph/v1/course-2.jpg"} alt="Lesson preview" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/10" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="text-white">
                  <div className="text-xs opacity-90">{overlaySubtitle || ''}</div>
                  <div className="text-lg font-semibold">{overlayTitle || 'Lesson'}</div>
                </div>
                <button onClick={() => setPlaying(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  <span>Start / Resume</span>
                </button>
              </div>
            </div>
          </div>
        ) : iframeSrc ? (
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={iframeSrc}
              title="Lesson video"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              style={{ border: 0 }}
            />
          </div>
        ) : yt ? (
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={yt}
              title="Lesson video"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={src} poster={poster} className="block w-full" controls={!locked} playsInline />
        )}
        {/* In-player controls overlay (skeleton) */}
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex gap-2">
          <div className="relative pointer-events-auto">
            <button aria-haspopup="menu" onClick={() => setCcOpen((v)=>!v)} className="rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur hover:bg-slate-900/80">CC | English</button>
            {ccOpen && (
              <div className="absolute right-0 z-10 mt-2 w-40 rounded-xl border border-sky-100 bg-white/95 p-2 text-sm shadow-lg ring-1 ring-sky-100">
                <button className="block w-full rounded-lg px-2 py-1 text-left hover:bg-sky-50">English</button>
                <button className="block w-full rounded-lg px-2 py-1 text-left hover:bg-sky-50">Italiano</button>
                <button className="block w-full rounded-lg px-2 py-1 text-left hover:bg-sky-50">Subtitles off</button>
              </div>
            )}
          </div>
        </div>
        {locked && (
          <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-sm">
            <div className="max-w-sm rounded-2xl bg-white p-4 text-center shadow ring-1 ring-black/5">
              <div className="text-sm font-semibold text-indigo-900">{lockReason || "This video is locked"}</div>
              <div className="mt-1 text-xs text-gray-600">Login, enroll, or upgrade to watch.</div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button onClick={() => window.dispatchEvent(new CustomEvent('auth:open'))} className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Log in</button>
                <button onClick={onUnlock} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100">Upgrade</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animated timeline with anchor dots */}
      <div className="rounded-3xl bg-gradient-to-br from-sky-50 via-rose-50 to-amber-50 p-3 ring-1 ring-inset ring-sky-100">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/80 shadow-inner ring-1 ring-sky-100">
          <div className="fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-rose-500" style={{ width: `${progress}%` }} />
          {(anchors || [
            { pos: 12, id: 'a1', label: 'Overview' },
            { pos: 42, id: 'a2', label: 'Key labs' },
            { pos: 68, id: 'a3', label: 'Differentials' },
            { pos: 86, id: 'a4', label: 'Management' },
          ]).map((a) => (
            <button
              key={a.id}
              aria-label={a.label}
              onMouseEnter={() => highlight(a.id)}
              onClick={() => highlight(a.id)}
              className="dot pulse group absolute top-1/2 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full bg-white text-sky-700 ring-2 ring-sky-500 transition-transform hover:scale-110"
              style={{ left: `${Math.max(0, Math.min(100, a.pos))}%` }}
            >
              <span className="pointer-events-none tooltip absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">{a.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-sky-900/70">
          <span>Intro</span>
          <span>Summary</span>
        </div>
        <style jsx>{`
          .fill::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent); transform: translateX(-100%); animation: sheen 2.5s linear infinite; }
          @keyframes sheen { from { transform: translateX(-100%);} to { transform: translateX(100%);} }
          .pulse { animation: pulse 2s ease-out infinite; }
          @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(14,165,233,.35);} 70% { box-shadow: 0 0 0 10px rgba(14,165,233,0);} 100% { box-shadow: 0 0 0 0 rgba(14,165,233,0);} }
          .dot:hover .tooltip { opacity: 1; }
          .tooltip { opacity: 0; transition: opacity .15s ease; }
        `}</style>
      </div>

      {/* Transcript & chapters placeholder would sit here */}

      {/* Prev/Next navigation integrated for the whole panel */}
      {(prev || next) && (
        <div className="flex items-center justify-between">
          <div>
            {prev ? (
              <a href={prev.href} className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm hover:bg-sky-50">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="truncate max-w-[200px]">{prev.title}</span>
              </a>
            ) : <span />}
          </div>
          <div>
            {next ? (
              <a href={next.href} className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm hover:bg-sky-50">
                <span className="truncate max-w-[200px]">{next.title}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            ) : <span />}
          </div>
        </div>
      )}
    </div>
  );
}

