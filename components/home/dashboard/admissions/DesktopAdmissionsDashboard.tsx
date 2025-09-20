"use client";

import { useEffect, useMemo, useState } from "react";
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
    <div className="flex h-56 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-sm text-white/70">
      Loading admissions map...
    </div>
  ),
});

export default function DesktopAdmissionsDashboard({ context, showcaseHref }: DesktopAdmissionsDashboardProps) {
  const tracks = context.examTracks.length > 0 ? context.examTracks : fallbackTracks;
  const [activeTrackId, setActiveTrackId] = useState<string>(tracks[0]?.id ?? "imat");
  const activeTrack = tracks.find((track) => track.id === activeTrackId) ?? tracks[0];
  const [mapOpen, setMapOpen] = useState(false);

  const content = useMemo(() => buildAdmissionsContent(activeTrack, context.primaryCountry), [activeTrack, context.primaryCountry]);
  const friendlyName = useMemo(() => {
    const value = context.displayName ?? "there";
    const first = value.split(/\s+/)[0]?.trim();
    return first && first.length > 0 ? first : "there";
  }, [context.displayName]);
  const xpFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

  const xpSeries = content.xp.series;
  const xpMax = xpSeries.reduce((max, point) => (point.xp > max ? point.xp : max), 0) || 1;
  const goalPercent = content.xp.weeklyGoal > 0 ? Math.min(100, Math.round((content.xp.totalXP / content.xp.weeklyGoal) * 100)) : 0;
  const goalRemaining = Math.max(0, content.xp.weeklyGoal - content.xp.totalXP);
  const regionLabel = context.primaryCountry ?? activeTrack?.country ?? "Global";
  const shortExam = activeTrack?.label?.split(/[\s-]+/)[0] ?? "Exam";

  useEffect(() => {
    if (!mapOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mapOpen]);

  const timelineBadgeStyles = {
    complete: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
    active: "border border-sky-400/30 bg-sky-500/15 text-sky-200",
    upcoming: "border border-white/15 bg-white/10 text-white/70",
  } as const;

  const timelineDotStyles = {
    complete: "bg-emerald-400/70",
    active: "bg-sky-400/70",
    upcoming: "bg-white/40",
  } as const;

  const openMap = () => setMapOpen(true);
  const closeMap = () => setMapOpen(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <HomeBackdrop />

      {mapOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={closeMap} />
          <div className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/15 bg-slate-950/95 shadow-[0_30px_90px_rgba(99,102,241,0.45)]">
            <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">Admissions map</p>
                <h2 className="mt-2 text-2xl font-semibold">Explore schools by cohort</h2>
                <p className="mt-1 text-sm text-white/70">Drag, zoom, and filter to compare universities aligned with your admissions track.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/course-mates"
                  className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                >
                  Go to planner view
                </Link>
                <button
                  type="button"
                  onClick={closeMap}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="h-[70vh] bg-slate-900">
              <HomeMapPreview />
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-24 pt-10">
        <header className="rounded-[32px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 shadow-[0_30px_80px_rgba(79,70,229,0.35)] ring-1 ring-white/15">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-white/65">Admissions dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold lg:text-4xl">Hello, {friendlyName}</h1>
              <p className="mt-3 text-sm text-white/80">Preview dashboard with placeholder data. Live admissions planner, leaderboard, and activity insights will appear here soon.</p>
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
                  <p className="mt-1 text-sm font-semibold">{regionLabel}</p>
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

        <section className="grid gap-6 xl:grid-cols-[2.4fr,1.8fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <header className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">Quick actions</p>
                  <h2 className="text-xl font-semibold">Pick up where you left off</h2>
                </div>
                <Link href="/planner" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20">Planner</Link>
              </header>
              <div className="mt-4 space-y-3">
                {content.quickActions.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="block rounded-3xl border border-white/10 bg-white/7 p-4 transition hover:border-white/30 hover:bg-white/15"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">{action.title}</p>
                        <p className="text-sm text-white/75">{action.copy}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85">{action.badge}</span>
                    </div>
                    <p className="mt-3 text-xs text-white/60">{action.meta}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">Timeline</p>
                  <h2 className="text-xl font-semibold">Admission milestones</h2>
                </div>
                <Link href="/planner" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20">View all</Link>
              </header>
              <ol className="mt-4 space-y-3">
                {content.timeline.map((item) => (
                  <li key={item.title} className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/7 p-4">
                    <span className={`mt-1 h-3 w-3 rounded-full ${timelineDotStyles[item.status]}`} aria-hidden="true"></span>
                    <div className="flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-sm text-white/75">{item.detail}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${timelineBadgeStyles[item.status]}`}>
                          {item.status === "complete" ? "Complete" : item.status === "active" ? "In progress" : "Upcoming"}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">Study history</p>
                  <h2 className="text-xl font-semibold">Latest chapters studied</h2>
                </div>
                <Link href="/lesson/discover" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20">Browse courses</Link>
              </header>
              <div className="mt-4 space-y-3">
                {content.chapters.map((chapter) => (
                  <Link
                    key={chapter.href}
                    href={chapter.href}
                    className="block rounded-3xl border border-white/10 bg-white/7 p-4 transition hover:border-white/30 hover:bg-white/12"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-white/55">{chapter.course}</p>
                        <p className="mt-1 text-lg font-semibold text-white">{chapter.chapter}</p>
                      </div>
                      <div className="text-right text-xs text-white/65">
                        <p>{chapter.lessonsRemaining} lessons left</p>
                        <p>{chapter.questionsRemaining} questions left</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-3 text-xs text-white/70">
                        <span className="w-16 uppercase tracking-wide">Lessons</span>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400"
                            style={{ width: `${chapter.lessonCompletion}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-semibold text-white">{chapter.lessonCompletion}%</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/70">
                        <span className="w-16 uppercase tracking-wide">Questions</span>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400"
                            style={{ width: `${chapter.questionCompletion}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-semibold text-white">{chapter.questionCompletion}%</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">XP momentum</p>
                  <h2 className="text-xl font-semibold">Last 7 days</h2>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-white/75">
                  <div className="rounded-2xl bg-white/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-white/55">Total XP</p>
                    <p className="mt-1 text-sm font-semibold text-white">{xpFormatter.format(content.xp.totalXP)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-white/55">Questions</p>
                    <p className="mt-1 text-sm font-semibold text-white">{xpFormatter.format(content.xp.questions)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-white/55">Streak</p>
                    <p className="mt-1 text-sm font-semibold text-white">{content.xp.streak} days</p>
                  </div>
                </div>
              </header>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="flex items-center justify-between text-xs text-white/65">
                  <p>Weekly goal: {xpFormatter.format(content.xp.weeklyGoal)} XP</p>
                  <p>{goalPercent}% complete ({xpFormatter.format(goalRemaining)} XP left)</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {xpSeries.map((point) => (
                  <div key={point.day} className="flex items-center gap-3 text-sm text-white/70">
                    <span className="w-10 text-xs font-semibold uppercase tracking-wide text-white/60">{point.day}</span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400"
                        style={{ width: `${Math.max(8, Math.round((point.xp / xpMax) * 100))}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs font-semibold text-white">{xpFormatter.format(point.xp)} xp</span>
                    <span className="w-16 text-right text-[11px] text-white/60">{point.questions} q</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-white/60">Admissions map</p>
                  <h2 className="text-xl font-semibold">Schools aligned with your track</h2>
                  <p className="mt-1 text-sm text-white/70">Preview the top campuses other {shortExam} learners are tracking this week.</p>
                </div>
                <button
                  type="button"
                  onClick={openMap}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
                >
                  Expand map
                </button>
              </header>
              <div
                role="button"
                tabIndex={0}
                onClick={openMap}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openMap();
                  }
                }}
                className="group mt-4 overflow-hidden rounded-3xl border border-white/10 transition hover:border-white/25 hover:bg-white/10 focus:outline-none"
              >
                <div className="pointer-events-none h-56">
                  <HomeMapPreview variant="compact" />
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm text-white/70">
                  <span>Click to open interactive map</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85">View</span>
                </div>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {content.map.slice(0, 3).map((spot) => (
                  <li key={spot.name} className="flex items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/7 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-white">{spot.name}</p>
                      <p className="text-xs text-white/65">{spot.city}</p>
                      <p className="mt-2 text-sm text-white/75">{spot.highlight}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/70">
                        {spot.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-white/10 px-2 py-1">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right text-xs text-white/60">
                      <p>{spot.trend}</p>
                      <p>{spot.seats} seats</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[2fr,3fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Leaderboard</p>
                <h2 className="text-xl font-semibold">Top {shortExam} cohort this week</h2>
              </div>
              <Link href="/course-mates" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20">View cohort</Link>
            </header>
            <div className="mt-4 space-y-3">
              {content.leaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/7 px-4 py-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/20 text-lg font-semibold text-indigo-100">#{entry.rank}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-base font-semibold text-white">{entry.name}</p>
                      <span className="text-sm font-semibold text-white/85">{xpFormatter.format(entry.xp)} xp</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/65">
                      <span>{entry.location}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">+{entry.delta} xp</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">{entry.streak}-day streak</span>
                    </div>
                    <p className="mt-1 text-sm text-white/75">{entry.highlight}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Question bank</p>
                <h2 className="text-xl font-semibold">Latest questions added</h2>
              </div>
              <Link href="/qbank" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20">All questions</Link>
            </header>
            <div className="mt-4 space-y-3">
              {content.questionBank.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group block rounded-3xl border border-white/10 bg-white/7 p-4 transition hover:border-white/30 hover:bg-white/12"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-white group-hover:text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-white/70">{item.topic}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85">{item.difficulty}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
                    <span>{item.timeAgo}</span>
                    <span>{item.peers} peers attempted</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[2fr,3fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Lessons and resources</p>
                <h2 className="text-xl font-semibold">Strengthen your prep</h2>
              </div>
              <Link href="/lesson/discover" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20">All lessons</Link>
            </header>
            <div className="mt-4 space-y-4">
              {content.lessons.map((lesson) => (
                <Link key={lesson.title} href={lesson.href} className="block rounded-3xl border border-white/10 bg-white/7 p-4 transition hover:border-white/30 hover:bg-white/12">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-white">{lesson.title}</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85">{lesson.tag}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{lesson.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Articles</p>
                <h2 className="text-xl font-semibold">Stay in the loop</h2>
              </div>
              <Link href="/blog" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20">Blog</Link>
            </header>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {content.articles.map((article) => (
                <Link key={article.title} href={article.href} className="block rounded-3xl border border-white/10 bg-white/7 p-4 text-sm transition hover:border-white/30 hover:bg-white/12">
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/80">{article.badge}</span>
                  <p className="mt-2 text-base font-semibold text-white">{article.title}</p>
                  <p className="mt-2 text-sm text-white/70">{article.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <p className="pb-8 text-center text-[12px] text-white/60">Preview interface - live admissions data is on the roadmap.</p>
      </div>
    </div>
  );
}
