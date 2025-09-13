"use client";

type Props = {
  count?: number;
  tags?: string[];
  onStart?: () => void;
};

export default function FlashcardsCTA({ count = 10, tags = ["hematology", "coagulation"], onStart }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-50" />
      <div className="pointer-events-none absolute -right-2 -top-1 opacity-20" aria-hidden>
        {/* Simple card icon */}
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="12" rx="2" fill="#10b981"/><rect x="7" y="8" width="10" height="1.8" rx="0.9" fill="white"/><rect x="7" y="11" width="8" height="1.8" rx="0.9" fill="white"/></svg>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-indigo-900">Review Flashcards</div>
          <div className="mt-1 text-[12px] text-gray-600">{count} cards • quick practice</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">{t}</span>
            ))}
          </div>
        </div>
        <button onClick={onStart} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Start</button>
      </div>
    </div>
  );
}

