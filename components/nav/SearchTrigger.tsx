"use client";

type Props = { className?: string };

export default function SearchTrigger({ className = "" }: Props) {
  return (
    <button
      type="button"
      data-nav-link
      title="Search (Ctrl/Cmd K)"
      onClick={() => window.dispatchEvent(new Event('cmdk:open'))}
      className={
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 hover:text-white " +
        className
      }
    >
      <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-90"><path fill="currentColor" d="M10 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8m11 2l-6-6"/></svg>
      Search
      <span className="ml-1 hidden items-center gap-1 rounded-md border border-white/30 bg-white/15 px-1.5 py-0.5 text-[10px] text-white/80 sm:inline-flex">Ctrl K</span>
    </button>
  );
}

