"use client";

import { useState } from "react";
import ChapterPathMini from "./ChapterPathMini";

type Props = {
  mode: "learn" | "practice" | "background";
  onMode: (m: "learn" | "practice" | "background") => void;
  onShare?: () => void;
  onPrint?: () => void;
  onAskAI?: () => void;
  focus?: boolean;
  onFocusToggle?: () => void;
  softLockPractice?: boolean;
  practiceHint?: string;
  chapterCount?: number;
  activeStep?: number;
  chapterLabels?: string[];
  chapterCompleted?: boolean[];
};

function IconBook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v14.5A2.5 2.5 0 0 1 17.5 20H7.5A2.5 2.5 0 0 0 5 22.5V5.5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H20" stroke="currentColor" strokeWidth="1.5"/></svg>
  );
}
function IconQuiz() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.5"/><path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.5"/></svg>
  );
}
function IconLamp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3a6 6 0 0 1 6 6c0 2.2-1.2 3.9-2.6 5.1-.6.5-1.1 1.4-1.2 2.3H9.8c-.1-.9-.6-1.8-1.2-2.3C7.2 12.9 6 11.2 6 9a6 6 0 0 1 6-6Z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 20h6M10 18h4" stroke="currentColor" strokeWidth="1.5"/></svg>
  );
}
function IconUniversity() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-5 9 5-9 5-9-5Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 11v6m12-6v6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 17h18" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.5"/><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
  );
}
function IconShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 7a3 3 0 1 0-2.83-2H13a3 3 0 0 0 0 6h.17A3.001 3.001 0 0 0 16 7Zm-8 5a3 3 0 1 0-2.83-2H5a3 3 0 0 0 0 6h.17A3.001 3.001 0 0 0 8 12Zm8 5a3 3 0 1 0-2.83-2H13a3 3 0 0 0 0 6h.17A3.001 3.001 0 0 0 16 17Z" stroke="currentColor" strokeWidth="1.2"/></svg>
  );
}
function IconPrint() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 9V3h12v6" stroke="currentColor" strokeWidth="1.5"/><path d="M6 17v4h12v-4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 17v-6h16v6H4Z" stroke="currentColor" strokeWidth="1.5"/></svg>
  );
}
function IconGPT() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.7 1.6 3.1-.5 1.3 2.9 2.6 1.9-1.6 2.7.5 3.1-2.9 1.3-1.9 2.6-2.7-1.6-3.1.5-1.3-2.9L5.1 14l1.6-2.7-.5-3.1 2.9-1.3L11 3.4 12 3Z" stroke="currentColor" strokeWidth="1.1"/></svg>
  );
}

export default function StudyToolbar({ mode, onMode, onShare, onPrint, onAskAI, focus, onFocusToggle, softLockPractice, practiceHint, chapterCount, activeStep, chapterLabels, chapterCompleted }: Props) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: location.href });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    } catch {}
    onShare?.();
  }
  function printPage() { try { window.print(); } catch {} onPrint?.(); }
  function askAI() { try { window.dispatchEvent(new CustomEvent('ai:open')); } catch {} onAskAI?.(); }

  // 44px hit-targets
  const segBtn = (active: boolean) => `inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold transition ${active ? 'bg-white text-indigo-700 shadow' : 'text-gray-800 hover:text-indigo-700'}`;
  const ghostBtn = `inline-flex h-11 items-center gap-1 rounded-full px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50`;
  const primaryBtn = `inline-flex h-11 items-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700`;
  // Focus should be primary (blue) in both states
  const toggleBtn = primaryBtn;
  function goUniResources() {
    try {
      const el = document.getElementById('uni-resources');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.location.hash = '#uni-resources';
    } catch {}
  }

  return (
    <div className="sticky top-24 z-[5] rounded-2xl border bg-white/95 p-3 shadow-sm ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!focus ? (
          <>
            {/* Mode switch */}
            <div className="inline-flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-inset ring-gray-200 shadow-sm">
              <button onClick={() => onMode('learn')} className={segBtn(mode==='learn')}><IconBook /><span>Learn</span></button>
              {/* Practice tab removed as requested */}
              <button onClick={() => onMode('background')} className={segBtn(mode==='background')}><IconLamp /><span>Background</span></button>
              {/* Quick link to University Resources section */}
              <button onClick={goUniResources} className={segBtn(false)}>
                <IconUniversity />
                <span>University Resources</span>
              </button>
            </div>

            {/* Inline chapter path between tabs and primary CTA */}
            {typeof chapterCount === 'number' && typeof activeStep === 'number' && (
              <div className="hidden min-w-[120px] flex-1 md:ml-1 md:block">
                <ChapterPathMini count={chapterCount} currentIndex={activeStep} labels={chapterLabels} completed={chapterCompleted} />
              </div>
            )}

            {/* Primary CTA + overflow menu */}
            <div className="inline-flex items-center gap-2">
              <button className={primaryBtn} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <span>Start · Resume</span>
              </button>
              <div className="relative">
                <button aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v)=>!v)} className={ghostBtn}>
                  <span className="sr-only">More</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border bg-white p-2 text-sm shadow-lg ring-1 ring-black/5">
                    <button onClick={share} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-indigo-50"><IconShare />Share</button>
                    <button onClick={printPage} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-indigo-50"><IconPrint />Print</button>
                    <button onClick={askAI} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-indigo-50"><IconGPT />Ask AI</button>
                    <a href="/graph" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 hover:bg-indigo-50">Mind map</a>
                    <button onClick={onFocusToggle} className="mt-1 flex w-full items-center gap-2 rounded-lg bg-indigo-600 px-2 py-2 font-semibold text-white hover:bg-indigo-700">{focus ? 'Exit focus' : 'Focus mode'}</button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex w-full items-center justify-between">
            <div className="text-[12px] font-semibold text-indigo-900">Focus mode</div>
            <button onClick={onFocusToggle} className={toggleBtn}>{focus ? 'Exit focus' : 'Focus'}</button>
          </div>
        )}
      </div>
      {!focus && copied && <div className="mt-1 text-center text-[11px] text-indigo-700">Link copied to clipboard</div>}
    </div>
  );
}
