"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SubtitleTrack = {
  lang: string; // e.g., 'en'
  label: string; // e.g., 'English'
  srt?: string; // raw SRT content (optional for demo)
};

type Props = {
  tracks?: SubtitleTrack[];
  className?: string;
};

type Line = { i: number; start: number; end: number; text: string };

function parseSrt(srt?: string): Line[] {
  if (!srt) return [];
  const blocks = srt.replace(/\r/g, "").trim().split(/\n\n+/);
  const lines: Line[] = [];
  for (const b of blocks) {
    const rows = b.split(/\n/);
    if (rows.length < 2) continue;
    const idx = Number(rows[0]);
    const times = rows[1]?.match(/(\d\d:\d\d:\d\d[,\.]\d\d\d)\s+-->\s+(\d\d:\d\d:\d\d[,\.]\d\d\d)/);
    const rest = rows.slice(2).join(" ").trim();
    if (!times || !rest) continue;
    const toMs = (t: string) => {
      const [h, m, s] = t.replace(",", ".").split(":");
      const [sec, ms] = (s || "0").split(".");
      return Number(h) * 3600000 + Number(m) * 60000 + Number(sec) * 1000 + Number(ms);
    };
    lines.push({ i: idx, start: toMs(times[1]), end: toMs(times[2]), text: rest });
  }
  return lines;
}

const demoSrt = `1\n00:00:00,000 --> 00:00:02,000\nDisseminated intravascular coagulation, or DIC.\n\n2\n00:00:02,200 --> 00:00:04,200\nA widespread activation of coagulation.\n\n3\n00:00:04,300 --> 00:00:06,000\nIt consumes platelets and clotting factors.\n\n4\n00:00:06,200 --> 00:00:08,000\nAnd can lead to bleeding and thrombosis.\n`;

export default function SubtitlesPanel({ tracks, className }: Props) {
  const [activeLang, setActiveLang] = useState(tracks?.[0]?.lang || "en");
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  const hasProvidedTracks = !!(tracks && tracks.length);
  const lines = useMemo(() => {
    const pick = tracks?.find((t) => t.lang === activeLang);
    const s = pick?.srt;
    if (!hasProvidedTracks) return [];
    return parseSrt(s || "");
  }, [tracks, activeLang, hasProvidedTracks]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return () => {};
    if (!lines.length) return () => {};
    timerRef.current && window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % Math.max(1, lines.length));
    }, 1800);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [playing, lines.length]);

  useEffect(() => { setIdx(0); }, [activeLang]);

  const prev = lines[idx - 1];
  const curr = lines[idx];
  const next = lines[idx + 1];

  return (
    <div className={`rounded-2xl border bg-white/90 p-3 shadow-sm ring-1 ring-black/5 ${className || ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {(tracks && tracks.length ? tracks : [{ lang: "en", label: "English" }]).map((t) => (
            <button
              key={t.lang}
              onClick={() => setActiveLang(t.lang)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${activeLang === t.lang ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVisible((v) => !v)} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100">
            {visible ? "Hide subtitles" : "Show subtitles"}
          </button>
          <button onClick={() => setPlaying((p) => !p)} className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700" disabled={!hasProvidedTracks}>
            {playing ? "Pause preview" : "Preview subtitles"}
          </button>
        </div>
      </div>

      {visible && (
        hasProvidedTracks && lines.length > 0 ? (
          <div className="relative mt-2 h-24 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)" }} />
            <div className="flex h-full flex-col items-center justify-center gap-1 transition-transform duration-500" style={{ transform: `translateY(-${8}px)` }}>
              <div className="text-center text-[12px] text-gray-400 line-clamp-2">{prev?.text || ""}</div>
              <div className="rounded-md bg-indigo-50/60 px-3 py-1 text-center text-[14px] font-semibold text-indigo-900 shadow-sm">{curr?.text}</div>
              <div className="text-center text-[12px] text-gray-400 line-clamp-2">{next?.text || ""}</div>
            </div>
          </div>
        ) : (
          <div className="mt-2 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 p-3 text-center text-[12px] text-indigo-900">
            No subtitles available yet.
            <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">.srt upload • coming soon</span>
          </div>
        )
      )}
    </div>
  );
}
