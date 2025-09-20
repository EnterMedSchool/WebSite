"use client";

import Link from "next/link";
import { useMemo } from "react";

import HomeBackdrop from "@/components/home/HomeBackdrop";
import type { DashboardContext } from "@/lib/dashboard/context";

type MobileMedicalDashboardProps = {
  context: DashboardContext;
  showcaseHref: string;
};

const fallbackCourses = [
  { title: "Endocrine reasoning 101", badge: "Course", href: "/courses/endocrine" },
  { title: "Clinical cases - Pituitary", badge: "Cases", href: "/cases" },
  { title: "Rapid-fire pharm", badge: "Flashcards", href: "/flashcards" },
];

const fallbackTimeline = [
  { title: "Morning clinical skills", detail: "OSCE prep lab with peer group.", status: "active" },
  { title: "Endocrine seminar", detail: "Upload notes and share top 3 pearls.", status: "upcoming" },
  { title: "Study jam", detail: "Join community room for cardio physiology blitz.", status: "upcoming" },
];

const fallbackArticles = [
  { title: "Clerkship survival kit", excerpt: "Prep templates, patient log tricks, and stamina routines.", href: "/blog/clerkship-kit", badge: "Clerkship" },
  { title: "Micro breaks on wards", excerpt: "Stay sharp through double shifts with 5-minute resets.", href: "/blog/micro-breaks", badge: "Wellness" },
];

const fallbackCommunity = [
  { title: "Course-mates - Endocrine", detail: "18 peers live now", href: "/course-mates" },
  { title: "Mentor office hours", detail: "Bring cases for feedback", href: "/course-mates/mentors" },
];

export default function MobileMedicalDashboard({ context, showcaseHref }: MobileMedicalDashboardProps) {
  const friendlyName = useMemo(() => {
    const value = context.displayName ?? "friend";
    const first = value.split(/\s+/)[0]?.trim();
    return first && first.length > 0 ? first : "friend";
  }, [context.displayName]);

  const schoolStatus = (context.schoolStatus ?? "unknown").toLowerCase();
  const schoolLabel = schoolStatus === "verified" ? "Verified" : schoolStatus === "pending" ? "Pending" : "Unverified";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <HomeBackdrop />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-6">
        <header className="rounded-3xl bg-gradient-to-br from-emerald-600 via-sky-600 to-indigo-600 p-5 shadow-xl ring-1 ring-white/20">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Med school dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold">Welcome back, {friendlyName}</h1>
              <p className="mt-2 text-sm text-white/80">Placeholder metrics for now. Soon we will surface your latest rotations, course-mates updates, and progress streaks.</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-2xl bg-white/15 px-3 py-2 text-xs text-white/90">
                <p className="text-[11px] uppercase tracking-wide text-white/60">School status</p>
                <p className="mt-1 text-sm font-semibold">{schoolLabel}</p>
              </div>
              <Link
                href={showcaseHref}
                className="rounded-full border border-white/30 px-3 py-1 text-[12px] font-semibold text-white/85 backdrop-blur transition hover:bg-white/20"
              >
                Switch to showcase
              </Link>
            </div>
          </div>
        </header>

        {context.needsSchoolRequest ? (
          <section className="rounded-3xl border border-rose-200/50 bg-rose-100/10 p-4 text-rose-100">
            <p className="text-sm font-semibold">Help us add your school</p>
            <p className="mt-1 text-xs text-rose-100/80">It looks like your program is not in the directory yet. Tap below to send the details and we will add it.</p>
            <Link
              href="mailto:hello@entermedschool.com?subject=Add my medical school"
              className="mt-3 inline-flex items-center justify-center rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-600 shadow-md"
            >
              Contact support
            </Link>
          </section>
        ) : null}

        <section>
          <div className="grid grid-cols-2 gap-2">
            <article className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
              <p className="text-[11px] uppercase tracking-wide text-white/70">Today&apos;s focus</p>
              <p className="mt-2 text-lg font-semibold">Case review</p>
              <p className="mt-1 text-xs text-white/70">Endocrine differential walkthrough</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
              <p className="text-[11px] uppercase tracking-wide text-white/70">Streak</p>
              <p className="mt-2 text-lg font-semibold">7 days</p>
              <p className="mt-1 text-xs text-white/70">Daily recall kept alive</p>
            </article>
          </div>
        </section>

        <section className="space-y-3">
          <header>
            <p className="text-[11px] uppercase tracking-wide text-white/60">Next up</p>
            <h2 className="text-lg font-semibold">Timeline highlights</h2>
          </header>
          <ol className="space-y-3">
            {fallbackTimeline.map((item) => (
              <li key={item.title} className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{item.title}</p>
                  <span className="text-[11px] uppercase tracking-wide text-white/60">{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-white/75">{item.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">Courses & tools</p>
              <h2 className="text-lg font-semibold">Where to jump in</h2>
            </div>
            <Link href="/courses" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">Browse</Link>
          </header>
          <div className="space-y-3">
            {fallbackCourses.map((course) => (
              <Link key={course.title} href={course.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold">{course.title}</p>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/85">{course.badge}</span>
                </div>
                <p className="mt-2 text-sm text-white/75">Continue learning with fresh notes and spaced repetition.</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">Course-mates</p>
              <h2 className="text-lg font-semibold">Who is online</h2>
            </div>
            <Link href="/course-mates" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">Open rooms</Link>
          </header>
          <div className="space-y-3">
            {fallbackCommunity.map((card) => (
              <Link key={card.title} href={card.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4 text-sm">
                <p className="text-base font-semibold">{card.title}</p>
                <p className="mt-2 text-sm text-white/75">{card.detail}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">Articles</p>
              <h2 className="text-lg font-semibold">Fresh from the wards</h2>
            </div>
            <Link href="/blog" className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">More</Link>
          </header>
          <div className="space-y-3">
            {fallbackArticles.map((article) => (
              <Link key={article.title} href={article.href} className="block rounded-3xl border border-white/10 bg-white/10 p-4 text-sm">
                <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/80">{article.badge}</span>
                <p className="mt-2 text-base font-semibold">{article.title}</p>
                <p className="mt-2 text-sm text-white/75">{article.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>

        <p className="pb-2 text-center text-[11px] text-white/60">Preview interface - live medical school data coming soon.</p>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/95 backdrop-blur" aria-label="Medical navigation">
        <div className="mx-auto flex max-w-5xl items-center justify-around px-6 py-3 text-sm text-white/80">
          <Link href="/study" className="flex flex-col items-center gap-1">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Study</span>
            <span className="text-[11px]">Planner</span>
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



