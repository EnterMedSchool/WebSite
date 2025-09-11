"use client";

import { useState } from "react";

type Props = {
  mode: "learn" | "practice";
  onMode: (m: "learn" | "practice") => void;
  onShare?: () => void;
  onPrint?: () => void;
  onAskAI?: () => void;
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

export default function StudyToolbar({ mode, onMode, onShare, onPrint, onAskAI }: Props) {
  const [copied, setCopied] = useState(false);
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

  return (
    <div className="sticky top-24 z-[5] rounded-2xl border bg-white/95 p-2 shadow-sm ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Mode switch with icons and labels */}
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 p-1 ring-1 ring-inset ring-gray-300">
          <button onClick={() => onMode('learn')} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold transition ${mode==='learn' ? 'bg-white text-indigo-700 shadow' : 'text-gray-700 hover:text-indigo-700'}`}>
            <IconBook /> <span>Learn</span>
          </button>
          <button onClick={() => onMode('practice')} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold transition ${mode==='practice' ? 'bg-white text-indigo-700 shadow' : 'text-gray-700 hover:text-indigo-700'}`}>
            <IconQuiz /> <span>Practice</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={share} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100"><IconShare /><span>Share</span></button>
          <button onClick={printPage} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100"><IconPrint /><span>Print</span></button>
          <button onClick={askAI} className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"><IconGPT /><span>ChatGPT</span></button>
        </div>
      </div>
      {copied && <div className="mt-1 text-center text-[11px] text-indigo-700">Link copied to clipboard</div>}
    </div>
  );
}
