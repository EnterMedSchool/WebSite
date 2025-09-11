"use client";

type Resource = { type: 'pdf' | 'slides'; title: string; href?: string; by?: string };

export default function UniResources({ enabled, resources, comingSoon }: { enabled?: boolean; resources?: Resource[]; comingSoon?: boolean }) {
  const items: Resource[] = resources && resources.length ? resources : [
    { type: 'pdf', title: 'Official chapter PDF', href: undefined, by: 'Prof. —' },
    { type: 'slides', title: 'Lecture slides', href: undefined, by: 'Prof. —' },
  ];
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-indigo-900">Resources from your university</div>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${enabled ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-700 ring-gray-300'}`}>{enabled ? 'Synced' : 'Sync required'}</span>
      </div>
      {comingSoon && (
        <div className="mb-2 text-[11px] text-gray-500">Upload & moderation • coming soon</div>
      )}
      {!enabled && (
        <div className="mb-3 rounded-lg bg-indigo-50 p-3 text-[12px] text-indigo-900">
          Sync your university in <a href="/me/profile" className="underline">/me/profile</a> to see professor-provided PDFs and slides here.
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((r, i) => (
          <div key={i} className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border bg-white p-3 ring-1 ring-black/5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-lg ring-1 ${r.type==='pdf' ? 'bg-rose-50 text-rose-600 ring-rose-200' : 'bg-amber-50 text-amber-600 ring-amber-200'}`}>
                {r.type==='pdf' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.5"/><path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.5"/></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v12H4z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9h10M7 13h7" stroke="currentColor" strokeWidth="1.5"/></svg>
                )}
              </div>
              <div>
                <div className="truncate text-sm font-semibold text-gray-900">{r.title}</div>
                <div className="text-[11px] text-gray-500">{r.by}</div>
              </div>
            </div>
            {enabled && r.href ? (
              <a href={r.href} className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">Open</a>
            ) : (
              <button disabled className="cursor-not-allowed flex-shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-200">+ Add</button>
            )}

            {/* Hover details */}
            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border bg-white p-3 text-xs text-gray-700 shadow-lg ring-1 ring-black/5 group-hover:block">
              <div className="mb-1 font-semibold text-indigo-900">{r.title}</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div className="text-gray-500">Professor</div><div>—</div>
                <div className="text-gray-500">Year</div><div>—</div>
                <div className="text-gray-500">Uploaded by</div><div>—</div>
                <div className="text-gray-500">Size</div><div>—</div>
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <button className="pointer-events-auto rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">Share</button>
                <button className="pointer-events-auto rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white">Open</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
