"use client";

import SubtitlesPanel, { SubtitleTrack } from "./SubtitlesPanel";

type Anchor = { pos: number; id: string; label: string };

type Props = {
  src?: string; // can be file or YouTube URL
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

export default function VideoPanel({ src, poster, locked, lockReason, onUnlock, subtitles, prev, next, anchors }: Props) {
  const yt = toYouTubeEmbed(src);
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
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
        {yt ? (
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
      <div className="rounded-full bg-gray-200 p-1">
        <div className="relative h-2 w-full rounded-full bg-gray-200">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" style={{ width: `${progress}%` }} />
          {(anchors || [{ pos: 15, id: 'a1', label: 'Pathogenesis' }, { pos: 45, id: 'a2', label: 'Labs' }, { pos: 80, id: 'a3', label: 'Treatment' }]).map((a) => (
            <button key={a.id} title={a.label} onMouseEnter={() => highlight(a.id)} onClick={() => highlight(a.id)}
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white ring-2 ring-indigo-600 transition hover:scale-110"
              style={{ left: `${Math.max(0, Math.min(100, a.pos))}%` }} />
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
          <span>Intro</span>
          <span>Summary</span>
        </div>
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
