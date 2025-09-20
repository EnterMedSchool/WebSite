"use client";

import Link from "next/link";
import { useMemo } from "react";

import HomeBackdrop from "@/components/home/HomeBackdrop";
import type { DashboardContext } from "@/lib/dashboard/context";

type DesktopMedicalDashboardProps = {
  context: DashboardContext;
  showcaseHref: string;
};

const fallbackCourses = [
  { title: "Advanced endocrine cases", description: "Interactive pituitary and adrenal decision trees.", tag: "Cases", href: "/cases" },
  { title: "Clerkship skills refresh", description: "Video refreshers for OSCE stations.", tag: "Skills", href: "/courses/skills" },
  { title: "Rapid pharm review", description: "Flash drills on endocrine therapeutics.", tag: "Flashcards", href: "/flashcards" },
];

const fallbackStats = [
  { label: "Rotations", value: "Endocrine", meta: "2 weeks remaining" },
  { label: "Weekend plan", value: "Study jam", meta: "Sat 09:00 CET" },
  { label: "Peer replies", value: "5", meta: "New this week" },
  { label: "Streak", value: "7 days", meta: "+1 vs last week" },
];

const fallbackTimeline = [
  { title: "Patient log update", detail: "Submit endocrine clinic reflections by tonight.", status: "active" },
  { title: "Ward round prep", detail: "Review pituitary imaging talking points.", status: "upcoming" },
  { title: "Mentor check-in", detail: "Share two learning wins from the week.", status: "upcoming" },
];

const fallbackArticles = [
  { title: "Hand-off mastery", excerpt: "Checklist to keep ICU transfers crisp and friendly.", href: "/blog/handoff-mastery", badge: "On the wards" },
  { title: "Energy management for double shifts", excerpt: "Layer study blocks with recovery routines.", href: "/blog/energy-management", badge: "Wellness" },
  { title: "OSCE pearls", excerpt: "Common endocrine pitfalls and how to avoid them.", href: "/blog/osce-pearls", badge: "OSCE" },
];

const fallbackCommunity = [
  { title: "Course-mates - Endocrine", caption: "18 colleagues live", href: "/course-mates" },
  { title: "Mentor office hours", caption: "Tomorrow 18:00 - bring cases", href: "/course-mates/mentors" },
  { title: "Peer resources", caption: "Aya shared a lab interpretation cheat sheet", href: "/course-mates/resources" },
];

export default function DesktopMedicalDashboard({ context, showcaseHref }: DesktopMedicalDashboardProps) {
  const friendlyName = useMemo(() => {
    const value = context.displayName ?? "friend";
    const first = value.split(/\s+/)[0]?.trim();
    return first && first.length > 0 ? first : "friend";
  }, [context.displayName]);

  const schoolStatus = (context.schoolStatus ?? "unknown").toLowerCase();
  const schoolLabel = schoolStatus === "verified" ? "Verified" : schoolStatus === "pending" ? "Pending verification" : "Unverified";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <HomeBackdrop />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-10">
        <header className="rounded-[32px] bg-gradient-to-br from-emerald-600 via-sky-600 to-indigo-600 p-8 shadow-[0_30px_80px_rgba(13,148,136,0.35)] ring-1 ring-white/15">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-white/65">Med school dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold lg:text-4xl">Welcome back, {friendlyName}</h1>
              <p className="mt-3 text-sm text-white/80">We are prototyping this view with placeholder data. Soon you will see your live course queue, clerkship tasks, and course-mates insights.</p>
              {context.needsSchoolRequest ? (
                <Link
                  href="mailto:hello@entermedschool.com?subject=Add my medical school"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-lg"
                >
                  Request my school
                </Link>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="rounded-3xl bg-white/15 px-4 py-2 text-sm text-white/90">
                <p className="text-[11px] uppercase tracking-wide text-white/60">School status</p>
                <p className="mt-1 text-sm font-semibold">{schoolLabel}</p>
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {fallbackStats.map((stat) => (
            <article key={stat.label} className="rounded-[28px] border border-white/10 bg-white/10 p-6">
              <p className="text-[11px] uppercase tracking-wide text-white/65">{stat.label}</p>
              <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-white/70">{stat.meta}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Timeline</p>
                <h2 className="text-xl font-semibold">On your radar</h2>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">Preview</span>
            </header>
            <ol className="mt-4 space-y-4">
              {fallbackTimeline.map((item) => (
                <li key={item.title} className="rounded-3xl border border-white/12 bg-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{item.title}</p>
                    <span className="text-[11px] uppercase tracking-wide text-white/60">{item.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{item.detail}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Courses & tools</p>
                <h2 className="text-xl font-semibold">Strengthen your skills</h2>
              </div>
              <Link href="/courses" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">Browse all</Link>
            </header>
            <div className="mt-4 space-y-4">
              {fallbackCourses.map((course) => (
                <Link key={course.title} href={course.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4 transition hover:border-white/30 hover:bg-white/20">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">{course.title}</p>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/85">{course.tag}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/75">{course.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,2fr,3fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Community</p>
            <h2 className="mt-2 text-xl font-semibold">Pulse from your peers</h2>
            <div className="mt-4 space-y-4">
              {fallbackCommunity.map((card) => (
                <Link key={card.title} href={card.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4 text-sm transition hover:border-white/30 hover:bg-white/20">
                  <p className="text-base font-semibold">{card.title}</p>
                  <p className="mt-2 text-sm text-white/75">{card.caption}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Wellness & checks</p>
            <h2 className="mt-2 text-xl font-semibold">Keep balanced</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li className="rounded-3xl border border-white/10 bg-white/5 p-3">Log your sleep hours for this week.</li>
              <li className="rounded-3xl border border-white/10 bg-white/5 p-3">Schedule a micro-break after tomorrow&apos;s long case.</li>
              <li className="rounded-3xl border border-white/10 bg-white/5 p-3">Share one learning win with your mentor.</li>
            </ul>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/60">Articles</p>
                <h2 className="text-xl font-semibold">What to read next</h2>
              </div>
              <Link href="/blog" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">Blog</Link>
            </header>
            <div className="mt-4 space-y-3">
              {fallbackArticles.map((article) => (
                <Link key={article.title} href={article.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4 text-sm transition hover:border-white/30 hover:bg-white/20">
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/80">{article.badge}</span>
                  <p className="mt-2 text-base font-semibold">{article.title}</p>
                  <p className="mt-2 text-sm text-white/70">{article.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <p className="pb-8 text-center text-[12px] text-white/60">Preview interface - live med school data will arrive soon.</p>
      </div>
    </div>
  );
}


