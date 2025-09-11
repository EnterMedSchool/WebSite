"use client";

import SubtitlesPanel, { SubtitleTrack } from "./SubtitlesPanel";

type Props = {
  src?: string;
  poster?: string;
  locked?: boolean;
  lockReason?: string;
  onUnlock?: () => void;
  subtitles?: SubtitleTrack[];
};

export default function VideoPanel({ src, poster, locked, lockReason, onUnlock, subtitles }: Props) {
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-black/5">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={src} poster={poster} className="block w-full" controls={!locked} playsInline />
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
      <SubtitlesPanel tracks={subtitles} />
    </div>
  );
}

