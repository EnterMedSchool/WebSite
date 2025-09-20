"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import HomeBackdrop from "@/components/home/HomeBackdrop";
import type { DashboardContext, DashboardExamTrack } from "@/lib/dashboard/context";

import { buildAdmissionsContent } from "./content";

type MobileAdmissionsDashboardProps = {
  context: DashboardContext;
  showcaseHref: string;
};

const fallbackTracks: DashboardExamTrack[] = [
  { id: "imat", label: "IMAT Italy", country: "Italy", status: "primary", isPrimary: true },
  { id: "ucat", label: "UCAT UK", country: "United Kingdom", status: "exploring" },
];

const HomeMapPreview = dynamic(() => import("@/components/home/HomeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-52 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-sm text-white/70">
      Loading map preview...
    </div>
  ),
});

export default function MobileAdmissionsDashboard({ context, showcaseHref }: MobileAdmissionsDashboardProps) {
  const tracks = context.examTracks.length > 0 ? context.examTracks : fallbackTracks;
  const [activeTrackId, setActiveTrackId] = useState<string>(tracks[0]?.id ?? "imat");
  const activeTrack = tracks.find((track) => track.id === activeTrackId) ?? tracks[0];

  const content = useMemo(() => buildAdmissionsContent(activeTrack, context.primaryCountry), [activeTrack, context.primaryCountry]);
  const friendlyName = useMemo(() => {
    const value = context.displayName ?? "there";
    const first = value.split(/\s+/)[0]?.trim();
    return first && first.length > 0 ? first : "there";
  }, [context.displayName]);

  const cohortLabel = activeTrack ? `${activeTrack.label} cohort` : "Admissions cohort";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <HomeBackdrop />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-6">
        <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 shadow-xl ring-1 ring-white/20">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Admissions dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold">Welcome back, {friendlyName}</h1>
              <p className="mt-2 text-sm text-white/80">Fake data for now. We will stream your live tasks, cohort activity, and planner progress here soon.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setActiveTrackId(track.id)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${track.id === activeTrackId ? "bg-white text-indigo-700" : "bg-white/15 text-white/85"}`}
                >
                  {track.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-2xl bg-white/15 px-3 py-2 text-xs text-white/90">
                <p className="text-[11px] uppercase tracking-wide text-white/60">Primary region</p>
                <p className="mt-1 text-sm font-semibold">{context.primaryCountry ?? activeTrack?.country ?? "Global"}</p>
              </div>
              <Link
                href={showcaseHref}
                className="rounded-full border border-white/40 px-3 py-1 text-[12px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                Switch to showcase
              </Link>
            </div>
          </div>
        </header>

        {context.needsOnboarding ? (
          <section className="rounded-3xl border border-amber-200/40 bg-amber-100/10 p-4 text-amber-100">
            <p className="text-sm font-semibold">Complete your admissions profile</p>
            <p className="mt-1 text-xs text-amber-200/90">Pick your exact exam and target universities in the upcoming onboarding so we can automate this dashboard.</p>
          </section>
        ) : null}

        <section>
          <div className="grid grid-cols-2 gap-2">
            {content.heroStats.map((item) => (
              <article key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
                <p className="text-[11px] uppercase tracking-wide text-white/70">{item.label}</p>
                <p className="mt-2 text-lg font-semibold">{item.value}</p>
                <p className="mt-1 text-xs text-white/70">{item.meta}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">Quick actions</p>
              <h2 className="text-lg font-semibold">Keep your momentum</h2>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">Preview</span>
          </header>
          <div className="space-y-3">
            {content.quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="block rounded-3xl border border-white/10 bg-white/10 p-4 text-sm transition hover:border-white/30 hover:bg-white/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{action.title}</h3>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/90">{action.badge}</span>
                </div>
                <p className="mt-2 text-sm text-white/80">{action.copy}</p>
                <p className="mt-3 text-[12px] text-white/60">{action.meta}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <header>
            <p className="text-[11px] uppercase tracking-wide text-white/60">Timeline</p>
            <h2 className="text-lg font-semibold">What happens next</h2>
          </header>
          <ol className="space-y-3">
            {content.timeline.map((step) => (
              <li
                key={step.title}
                className={`rounded-3xl border p-4 text-sm transition ${step.status === "active" ? "border-emerald-400/60 bg-emerald-400/10" : step.status === "complete" ? "border-white/10 bg-white/5 text-white/80" : "border-white/10 bg-white/10"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{step.title}</p>
                  <span className="text-[11px] uppercase tracking-wide text-white/60">{step.status}</span>
                </div>
                <p className="mt-2 text-sm text-white/75">{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">Admissions map</p>
              <h2 className="text-lg font-semibold">Schools in your orbit</h2>
            </div>
            <Link href="/course-mates" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">Compare</Link>
          </header>
          <div className="space-y-3">
            <HomeMapPreview />
            <div className="space-y-3">
              {content.map.map((spot) => (
                <article key={spot.name} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold">{spot.name}</p>
                      <p className="text-xs text-white/70">{spot.city}</p>
                    </div>
                    <span className="text-xs text-white/60">{spot.trend}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{spot.highlight}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/70">
                    {spot.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/10 px-2 py-1">{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">{cohortLabel}</p>
              <h2 className="text-lg font-semibold">Your exam community</h2>
            </div>
            <Link href="/study/rooms" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">Explore rooms</Link>
          </header>
          <div className="space-y-3">
            {content.cohortRooms.map((room) => (
              <Link key={room.title} href={room.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">{room.title}</p>
                    <p className="mt-1 text-sm text-white/80">{room.detail}</p>
                  </div>
                  <div className="text-right text-xs text-white/65">
                    <p>{room.activity}</p>
                    <p>{room.memberCount}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Spotlights</p>
            <div className="mt-3 space-y-3">
              {content.cohortSpotlights.map((spotlight) => (
                <Link key={spotlight.name} href={spotlight.href} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold">{spotlight.name}</p>
                    <p className="text-xs text-white/70">{spotlight.status}</p>
                  </div>
                  <span className="text-xs text-white/65">{spotlight.focus}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <header>
            <p className="text-[11px] uppercase tracking-wide text-white/60">Lessons and resources</p>
            <h2 className="text-lg font-semibold">Stay sharp</h2>
          </header>
          <div className="space-y-3">
            {content.lessons.map((lesson) => (
              <Link key={lesson.title} href={lesson.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold">{lesson.title}</p>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/90">{lesson.tag}</span>
                </div>
                <p className="mt-2 text-sm text-white/80">{lesson.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">Articles</p>
              <h2 className="text-lg font-semibold">From the admissions desk</h2>
            </div>
            <Link href="/blog" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">Browse</Link>
          </header>
          <div className="space-y-3">
            {content.articles.map((article) => (
              <Link key={article.title} href={article.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4 text-sm">
                <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/80">{article.badge}</span>
                <p className="mt-2 text-base font-semibold">{article.title}</p>
                <p className="mt-2 text-sm text-white/75">{article.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>

        <p className="pb-2 text-center text-[11px] text-white/60">Preview interface - live data wiring coming soon.</p>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/95 backdrop-blur" aria-label="Admissions navigation">
        <div className="mx-auto flex max-w-5xl items-center justify-around px-6 py-3 text-sm text-white/80">
          <Link href="/study" className="flex flex-col items-center gap-1">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Study</span>
            <span className="text-[11px]">Plan</span>
          </Link>
          <Link href="/cases" className="flex flex-col items-center gap-1">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Cases</span>
            <span className="text-[11px]">Practice</span>
          </Link>
          <Link href="/course-mates" className="flex flex-col items-center gap-1">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Community</span>
            <span className="text-[11px]">Rooms</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center gap-1">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">You</span>
            <span className="text-[11px]">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
