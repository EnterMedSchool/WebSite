"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import HomeBackdrop from "@/components/home/HomeBackdrop";
import type { DashboardContext, DashboardExamTrack } from "@/lib/dashboard/context";

import { buildAdmissionsContent } from "./content";

type DesktopAdmissionsDashboardProps = {
  context: DashboardContext;
  showcaseHref: string;
};

const fallbackTracks: DashboardExamTrack[] = [
  { id: "imat", label: "IMAT Italy", country: "Italy", status: "primary", isPrimary: true },
  { id: "ucat", label: "UCAT UK", country: "United Kingdom", status: "exploring" },
  { id: "bmat", label: "BMAT", country: "United Kingdom", status: "archive" },
];

const HomeMapPreview = dynamic(() => import("@/components/home/HomeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-sm text-white/70">
      Loading admissions map...
    </div>
  ),
});

export default function DesktopAdmissionsDashboard({ context, showcaseHref }: DesktopAdmissionsDashboardProps) {
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
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-24 pt-10">
        <header className="rounded-[32px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 shadow-[0_30px_80px_rgba(79,70,229,0.35)] ring-1 ring-white/15">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-white/65">Admissions dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold lg:text-4xl">Hello, {friendlyName}</h1>
              <p className="mt-3 text-sm text-white/80">This is a preview dashboard with placeholder data. Soon we will plug in your live admissions planner, cohort activity, and learning streaks.</p>
              {context.needsOnboarding ? (
                <p className="mt-4 rounded-2xl border border-amber-200/50 bg-amber-100/10 px-4 py-3 text-xs text-amber-100">Finish onboarding to confirm your exact exam targets so we can auto-populate these widgets.</p>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="flex flex-wrap gap-2">
                {tracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setActiveTrackId(track.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${track.id === activeTrackId ? "bg-white text-indigo-700" : "bg-white/20 text-white/85 hover:bg-white/30"}`}
                  >
                    {track.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                <div className="rounded-2xl bg-white/15 px-4 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-white/60">Region</p>
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
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {content.heroStats.map((stat) => (
            <article key={stat.label} className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(14,116,144,0.25)]">
              <p className="text-[11px] uppercase tracking-wide text-white/65">{stat.label}</p>
              <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-white/70">{stat.meta}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Quick actions</p>
                <h2 className="text-xl font-semibold">Pick up right where you left</h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">Preview</span>
            </header>
            <div className="mt-4 space-y-4">
              {content.quickActions.map((action) => (
                <Link key={action.title} href={action.href} className="block rounded-[28px] border border-white/10 bg-white/10 p-5 transition hover:border-white/30 hover:bg-white/20">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{action.title}</h3>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white/90">{action.badge}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/80">{action.copy}</p>
                  <p className="mt-3 text-[12px] text-white/60">{action.meta}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Timeline</p>
            <h2 className="mt-2 text-xl font-semibold">Admission milestones</h2>
            <ol className="mt-4 space-y-4">
              {content.timeline.map((step) => (
                <li key={step.title} className="rounded-3xl border border-white/12 bg-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{step.title}</p>
                    <span className="text-[11px] uppercase tracking-wide text-white/60">{step.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{step.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">{cohortLabel}</p>
                <h2 className="text-xl font-semibold">Meet your exam cohort</h2>
              </div>
              <Link href="/study/rooms" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">Explore rooms</Link>
            </header>
            <div className="mt-4 space-y-4">
              {content.cohortRooms.map((room) => (
                <Link key={room.title} href={room.href} className="block rounded-3xl border border-white/10 bg-white/10 p-5 transition hover:border-white/30 hover:bg-white/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{room.title}</p>
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
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Cohort spotlights</p>
                <h2 className="mt-2 text-xl font-semibold">Who is active right now</h2>
              </div>
              <Link href="/study/rooms" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">See all</Link>
            </div>
            <div className="mt-4 space-y-3">
              {content.cohortSpotlights.map((spotlight) => (
                <Link key={spotlight.name} href={spotlight.href} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm transition hover:border-white/25 hover:bg-white/15">
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

        <section className="grid gap-6 lg:grid-cols-[2fr,3fr] xl:grid-cols-[1.5fr,3fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Lessons & resources</p>
                <h2 className="text-xl font-semibold">Strengthen your prep</h2>
              </div>
              <Link href="/lesson/discover" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">All lessons</Link>
            </header>
            <div className="mt-4 space-y-4">
              {content.lessons.map((lesson) => (
                <Link key={lesson.title} href={lesson.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4 transition hover:border-white/30 hover:bg-white/20">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">{lesson.title}</p>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/85">{lesson.tag}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{lesson.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">Admissions map</p>
                  <h2 className="text-xl font-semibold">Schools aligned with your track</h2>
                </div>
                <Link href="/course-mates" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">Open map</Link>
              </div>
              <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
                <HomeMapPreview />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {content.map.map((spot) => (
                  <article key={spot.name} className="rounded-3xl border border-white/12 bg-white/10 p-4 text-sm">
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

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">Articles</p>
                  <h2 className="text-xl font-semibold">Stay in the loop</h2>
                </div>
                <Link href="/blog" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">Blog</Link>
              </header>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {content.articles.map((article) => (
                  <Link key={article.title} href={article.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4 text-sm transition hover:border-white/30 hover:bg-white/20">
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/80">{article.badge}</span>
                    <p className="mt-2 text-base font-semibold">{article.title}</p>
                    <p className="mt-2 text-sm text-white/70">{article.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <p className="pb-8 text-center text-[12px] text-white/60">Preview interface - live admissions data is on the roadmap.</p>
      </div>
    </div>
  );
}
