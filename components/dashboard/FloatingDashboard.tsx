"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type DashData = {
  user: { id: number; name?: string | null; image?: string | null; xp: number; level: number };
  learning: { minutesToday: number; minutesTotal: number; correctToday: number };
  chapters: { id: number; slug: string; title: string; course_slug: string; course_title: string }[];
  courses: { id: number; slug: string; title: string; description?: string | null }[];
};

export default function FloatingDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch("/api/me/dashboard", { credentials: "include" });
        if (!r.ok) { setData(null); return; }
        const j = await r.json();
        setData(j as DashData);
      } finally { setLoading(false); }
    })();
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const firstName = useMemo(() => {
    const n = data?.user?.name || "there";
    const f = n.split(" ")[0]?.trim();
    return f || "there";
  }, [data]);

  const examName = "your exam"; // placeholder until profile step

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] grid place-items-center bg-gradient-to-br from-black/40 via-indigo-900/10 to-fuchsia-900/10 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-6xl rounded-[28px] border border-violet-200/60 bg-white/90 shadow-[0_30px_90px_rgba(99,102,241,0.35)] ring-1 ring-white/40 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left rail */}
        <div className="absolute left-0 top-0 h-full w-16 rounded-l-[28px] bg-gradient-to-b from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.3)]">
          <div className="flex h-full flex-col items-center justify-between py-5">
            <div className="space-y-4">
              {[
                { k: "home", c: "#ffffff" },
                { k: "book", c: "#dbeafe" },
                { k: "chart", c: "#fde68a" },
                { k: "user", c: "#bbf7d0" },
              ].map((x, i) => (
                <span key={i} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <span className="h-5 w-5 rounded-full" style={{ background: x.c }} />
                </span>
              ))}
            </div>
            <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30">A-</button>
          </div>
        </div>

        {/* Main content */}
        <div className="pl-16">
          <div className="grid grid-cols-12 gap-6 p-6">
            {/* Greeting and Today\'s course */}
            <div className="col-span-7">
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.12)]">
                <div className="text-[26px] font-extrabold tracking-tight text-gray-900">Hello, {firstName} 👋</div>
                <div className="mt-1 text-[13px] text-gray-600">Nice to have you back, let&apos;s continue preparing for your exam.</div>

                <div className="mt-5 text-base font-bold text-gray-800">Today&apos;s course</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(data?.chapters?.length ? data.chapters : []).slice(0, 2).map((ch) => (
                    <div key={ch.id} className="flex flex-col justify-between rounded-2xl border border-gray-100 p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)]">
                      <div>
                        <div className="text-sm font-semibold text-indigo-700">{ch.course_title}</div>
                        <div className="mt-1 line-clamp-2 text-base font-bold text-gray-900">{ch.title}</div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 shadow-sm">{typeof (ch as any).progress_pct === 'number' ? `${Math.round((ch as any).progress_pct)}% done` : 'In progress'}</span>
                          <span className="opacity-60">-</span>
                          <span>{(ch as any).total_min != null && (ch as any).total_min > 0 ? `${(ch as any).total_min} min` : '—'}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a href={(ch as any).continue_slug ? `/lesson/${encodeURIComponent((ch as any).continue_slug)}` : `/course/${encodeURIComponent(ch.course_slug)}`} className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:opacity-95">Continue</a>
                        <a href={`/courses`} className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Skip</a>
                      </div>
                    </div>
                  ))}
                  {!loading && (data?.chapters?.length ?? 0) === 0 && (
                    <div className="col-span-2 rounded-2xl border border-dashed border-indigo-200/70 bg-indigo-50/30 p-6 text-sm text-gray-600">
                      No recent chapters yet. Start a lesson to see suggestions here.
                    </div>
                  )}
                </div>
              </div>

              {/* Learning activity */}
              <div className="mt-6 rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="text-base font-bold text-gray-800">Learning activity</div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border p-4 shadow-sm">
                    <div className="text-2xl font-extrabold text-indigo-700">{data?.learning?.minutesToday ?? (loading ? "…" : 0)}m</div>
                    <div className="text-xs text-gray-600">Studied today</div>
                  </div>
                  <div className="rounded-2xl border p-4 shadow-sm">
                    <div className="text-2xl font-extrabold text-indigo-700">{data?.learning?.minutesTotal ?? (loading ? "…" : 0)}m</div>
                    <div className="text-xs text-gray-600">Total minutes</div>
                  </div>
                  <div className="rounded-2xl border p-4 shadow-sm">
                    <div className="text-2xl font-extrabold text-indigo-700">{data?.learning?.correctToday ?? (loading ? "…" : 0)}</div>
                    <div className="text-xs text-gray-600">Correct today</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Profile + XP cards */}
            <div className="col-span-5 space-y-4">
              {/* Profile */}
              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/90 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="relative h-28 w-full bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200">
                  <Image src="/logo.svg" alt="Cover" width={100} height={100} className="absolute right-3 top-3 opacity-40" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                      {data?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={data.user.image} alt="User" className="h-12 w-12 object-cover" />
                      ) : (
                        <span className="text-base font-semibold text-indigo-700">{firstName.slice(0,1).toUpperCase()}</span>
                      )}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{data?.user?.name ?? "Your Name"}</div>
                      <button className="text-xs font-semibold text-indigo-700 underline" onClick={() => alert("Profile editing coming soon")}>Edit profile</button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl border p-2">
                      <div className="text-lg font-extrabold text-gray-900">{data?.user?.level ?? 1}</div>
                      <div className="text-gray-600">Level</div>
                    </div>
                    <div className="rounded-xl border p-2">
                      <div className="text-lg font-extrabold text-gray-900">{data?.user?.xp ?? 0}</div>
                      <div className="text-gray-600">XP</div>
                    </div>
                    <div className="rounded-xl border p-2">
                      <div className="text-lg font-extrabold text-gray-900">{(data?.user as any)?.streakDays ?? '—'}</div>
                      <div className="text-gray-600">Streak</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* XP actions */}
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-5 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-700">Total XP</div>
                    <div className="text-2xl font-extrabold text-indigo-700">{data?.user?.xp ?? 0} <span className="text-indigo-800">XP</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Redeem</button>
                    <button className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-sm font-semibold text-white shadow hover:opacity-95">Collect points</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Your class */}
            <div className="col-span-12">
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="text-base font-bold text-gray-800">Your class</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {(data?.courses || []).map((c) => (
                    <a key={c.id} href={`/course/${encodeURIComponent(c.slug)}`} className="flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-50/40">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-200 to-fuchsia-200 shadow-inner" />
                      <div>
                        <div className="font-semibold text-gray-900">{c.title}</div>
                        <div className="text-xs text-gray-600 line-clamp-1">{c.description || "—"}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
