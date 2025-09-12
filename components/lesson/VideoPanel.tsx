"use client";

import { useEffect, useState } from "react";
import SubtitlesPanel, { SubtitleTrack } from "./SubtitlesPanel";

type Anchor = { pos: number; id: string; label: string };

type Props = {
  src?: string; // can be file or YouTube URL
  iframeSrc?: string; // explicit iframe URL (e.g., Bunny embed)
  poster?: string;
  locked?: boolean;
  lockReason?: string;
  onUnlock?: () => void;
  subtitles?: SubtitleTrack[];
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

export default function VideoPanel({ src, iframeSrc, poster, locked, lockReason, onUnlock, subtitles, prev, next, anchors }: Props) {
  const yt = toYouTubeEmbed(src);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 0.6)), 80);
    return () => window.clearInterval(id);
  }, []);
  function highlight(id?: string) {
    if (!id) return;
    try {
      const el = document.querySelector(`[data-lesson-anchor="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.classList.add('ring-2','ring-indigo-300','bg-indigo-50');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => el.classList.remove('ring-2','ring-indigo-300','bg-indigo-50'), 1800);
    } catch {}
  }
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-black/5">
        {iframeSrc ? (
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              className="absolute inset-0 h-full w-full"
              src={iframeSrc}
              title="Lesson video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={src} poster={poster} className="block w-full" controls={!locked} playsInline />
        )}
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
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-3 ring-1 ring-inset ring-indigo-100">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/70 shadow-inner ring-1 ring-indigo-100">
          <div className="fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" style={{ width: `${progress}%` }} />
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
              className="dot pulse group absolute top-1/2 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full bg-white text-indigo-700 ring-2 ring-indigo-600 transition-transform hover:scale-110"
              style={{ left: `${Math.max(0, Math.min(100, a.pos))}%` }}
            >
              <span className="pointer-events-none tooltip absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">{a.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-indigo-800/70">
          <span>Intro</span>
          <span>Summary</span>
        </div>
        <style jsx>{`
          .fill::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent); transform: translateX(-100%); animation: sheen 2.5s linear infinite; }
          @keyframes sheen { from { transform: translateX(-100%);} to { transform: translateX(100%);} }
          .pulse { animation: pulse 2s ease-out infinite; }
          @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(99,102,241,.35);} 70% { box-shadow: 0 0 0 10px rgba(99,102,241,0);} 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0);} }
          .dot:hover .tooltip { opacity: 1; }
          .tooltip { opacity: 0; transition: opacity .15s ease; }
        `}</style>
      </div>

      <SubtitlesPanel tracks={subtitles} />

      {/* Prev/Next navigation integrated for the whole panel */}
      {(prev || next) && (
        <div className="flex items-center justify-between">
          <div>
            {prev ? (
              <a href={prev.href} className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="truncate max-w-[200px]">{prev.title}</span>
              </a>
            ) : <span />}
          </div>
          <div>
            {next ? (
              <a href={next.href} className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50">
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
