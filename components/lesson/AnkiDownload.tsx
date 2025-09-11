"use client";

type Props = {
  count?: number;
  tags?: string[];
  updatedAt?: string;
  comingSoon?: boolean;
};

export default function AnkiDownload({ count = 42, tags = ["hematology", "coagulation"], updatedAt = "2 days ago", comingSoon }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-indigo-50" />
      <div className="pointer-events-none absolute -right-2 -top-1 opacity-20" aria-hidden>
        {/* Simplified Anki-like star */}
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.8 5.7 6.2.9-4.5 4.4 1.1 6.1-5.6-2.9-5.6 2.9 1.1-6.1L3 8.6l6.2-.9L12 2z" fill="#6366f1"/></svg>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-indigo-900">Download Anki Cards</div>
          {comingSoon && <div className="mt-0.5 text-[11px] text-gray-500">Decks & tags • coming soon</div>}
          <div className="mt-1 text-[12px] text-gray-600">{count} cards • updated {updatedAt}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">{t}</span>
            ))}
          </div>
        </div>
        <button disabled className="cursor-not-allowed rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white opacity-70">Download</button>
      </div>
    </div>
  );
}
