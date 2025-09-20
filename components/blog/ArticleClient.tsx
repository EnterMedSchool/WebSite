"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { ArticleContent, BlogArticleMeta } from "@/lib/blog/types";
import ArticleTypographyStyles from "./ArticleTypographyStyles";

const CountrySpotlight = dynamic(() => import("./CountrySpotlight"), { ssr: false });
const HomeMap = dynamic(() => import("../home/HomeMap"), { ssr: false });

type ArticleClientProps = {
  meta: BlogArticleMeta;
  article: ArticleContent;
  siteUrl: string;
  structuredData: string;
};

type TimelineStep = {
  phase: string;
  title: string;
  description: string;
  action?: string;
};

type RecommendedArticle = {
  title: string;
  summary: string;
  href: string;
  readMinutes: number;
  badge: string;
};

export default function ArticleClient({ meta, article, siteUrl, structuredData }: ArticleClientProps) {
  const heroChips = useMemo(
    () => [
      meta.exam ? { label: meta.exam, tone: "exam" as const } : null,
      meta.country ? { label: meta.country, tone: "country" as const } : null,
      { label: `${article.readingMinutes}-minute read`, tone: "time" as const },
    ].filter(Boolean) as Array<{ label: string; tone: "exam" | "country" | "time" }>,
    [meta.exam, meta.country, article.readingMinutes],
  );

  const timelineSteps: TimelineStep[] = useMemo(
    () => [
      {
        phase: "January",
        title: "Lock your IMAT game plan",
        description: "Confirm universities, gather required documents, and create an IMAT-focused revision map for the next 6 months.",
        action: "Download the planning template",
      },
      {
        phase: "February - April",
        title: "Master the fundamentals",
        description: "Alternate scientific theory blocks with logical reasoning drills. Track weekly scores to spot gaps early.",
        action: "Follow the adaptive weekly schedule",
      },
      {
        phase: "May - June",
        title: "Simulate admission day",
        description: "Sit full IMAT mocks under timed conditions, then review errors with our analytics workbook for targeted fixes.",
        action: "Book proctored mock sessions",
      },
      {
        phase: "July - August",
        title: "Paperwork + rankings",
        description: "Finish translations, notarise certificates, and finalise Universitaly rankings before submissions open.",
        action: "Preview the application checklist",
      },
      {
        phase: "September",
        title: "Exam + enrolment",
        description: "Travel early, sit the IMAT with confidence, then monitor results and accept offers inside EnterMedSchool.",
        action: "Learn how score releases work",
      },
    ],
    [],
  );

  const recommendedArticles: RecommendedArticle[] = useMemo(
    () => [
      {
        title: "IMAT Past Papers 2014-2024: Smart Analysis",
        summary: "Discover the recurring question themes and weightings to prioritise what moves your score.",
        href: "#",
        readMinutes: 7,
        badge: "Strategy",
      },
      {
        title: "Visa & Relocation: IMAT International Students",
        summary: "Step-by-step guidance for documents, embassy timelines, and healthcare registration once you win a seat.",
        href: "#",
        readMinutes: 6,
        badge: "Logistics",
      },
      {
        title: "How Italians Structure Their IMAT Study Weeks",
        summary: "Borrow the routines of current Italian med students and adapt them to your timetable in minutes.",
        href: "#",
        readMinutes: 5,
        badge: "Community",
      },
    ],
    [],
  );

  const examHubPills = useMemo(
    () => [
      { label: "IMAT Timeline", href: "#" },
      { label: "Universities in Italy", href: "#" },
      { label: "Scholarships", href: "#" },
      { label: "Student Stories", href: "#" },
    ],
    [],
  );

  const toc = useMemo(() => article.headings.filter((heading) => heading.level === 2), [article.headings]);
  const [activeHeading, setActiveHeading] = useState<string | null>(toc[0]?.id ?? null);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (!toc.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-40% 0px -50% 0px",
        threshold: [0, 1],
      },
    );

    const elements = toc
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => Boolean(el));

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [toc]);

  const handleJumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
  };

  return (
    <>
      <div className="relative isolate overflow-hidden bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(238,242,255,0.4) 45%,#ffffff)] pb-32">
        <div className="pointer-events-none absolute inset-x-0 top-[-420px] h-[720px] bg-[radial-gradient(180%_120%_at_50%_0%,rgba(88,28,135,0.28),rgba(49,46,129,0.18)_45%,transparent)]" />
        <div className="pointer-events-none absolute left-[-220px] top-12 h-[620px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(236,72,153,0.28)_0%,_transparent_62%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-180px] top-24 h-[520px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.24)_0%,_transparent_64%)] blur-3xl" />

        {toc.length > 0 && (
          <motion.aside
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.2, duration: 0.5, ease: "easeOut" } }}
            className="hidden xl:block"
            style={{
              position: "fixed",
              top: "7.5rem",
              left: "max(1.5rem, calc((100vw - 1320px) / 2 - 240px))",
              width: "16.5rem",
              zIndex: 40,
            }}
          >
            <div className="rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_14px_48px_rgba(15,23,42,0.16)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">Quick map</p>
              <p className="mt-2 text-sm text-slate-500">Jump between the key sections of this IMAT roadmap.</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {toc.map((heading) => (
                  <li key={heading.id}>
                    <button
                      type="button"
                      onClick={() => handleJumpTo(heading.id)}
                      className={clsx(
                        "group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition",
                        activeHeading === heading.id
                          ? "bg-indigo-50/90 text-indigo-600 ring-1 ring-indigo-200"
                          : "text-slate-600 hover:bg-indigo-50/60 hover:text-indigo-600",
                      )}
                    >
                      <span
                        className={clsx(
                          "h-8 w-1 rounded-full transition-all group-hover:bg-indigo-300",
                          activeHeading === heading.id ? "bg-indigo-500" : "bg-indigo-200/60",
                        )}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{heading.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        )}

        <div className="relative mx-auto w-full max-w-[1320px] px-6 pt-14 sm:px-8 xl:px-10 2xl:px-14 xl:pl-[320px]">
          <div className="space-y-14">
            <section className="relative overflow-hidden rounded-[40px] border border-white/70 bg-gradient-to-br from-white via-indigo-50/40 to-white shadow-[0_28px_120px_rgba(30,64,175,0.25)] backdrop-blur-xl">
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-200/25 blur-3xl" aria-hidden="true" />
              <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-sky-200/20 blur-3xl" aria-hidden="true" />
              <div className="relative grid gap-10 px-8 py-12 sm:px-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="space-y-8 text-slate-900">
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
                    {heroChips.map((chip) => (
                      <span
                        key={chip.label}
                        className={clsx(
                          "rounded-full border px-3 py-1 transition",
                          chip.tone === "exam" && "border-indigo-400 bg-indigo-100/60 text-indigo-700",
                          chip.tone === "country" && "border-sky-400 bg-sky-100/60 text-sky-700",
                          chip.tone === "time" && "border-slate-200 bg-white/70 text-slate-700",
                        )}
                      >
                        {chip.label}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-5">
                    <h1 className="font-brand text-4xl leading-[1.05] text-slate-900 sm:text-[2.75rem] lg:text-[3rem]">
                      {meta.title}
                    </h1>
                    <p className="max-w-xl text-base text-slate-600 sm:text-lg">
                      {meta.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-6 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4 rounded-3xl bg-white/75 px-4 py-3 shadow-sm ring-1 ring-indigo-100/70">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 text-base font-semibold text-white shadow-md">
                        {meta.author.avatarInitials ?? meta.author.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="space-y-1 text-left">
                        <p className="font-semibold text-slate-900">{meta.author.name}</p>
                        <p className="text-xs text-slate-500">{meta.author.title}</p>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          <time dateTime={meta.published}>
                            Published {new Date(meta.published).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                          </time>
                          {meta.updated ? (
                            <>
                              <span className="mx-1">{"\u2022"}</span>
                              <time dateTime={meta.updated}>
                                Updated {new Date(meta.updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                              </time>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    {meta.callToActions?.length ? (
                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                        {meta.callToActions.map((cta) => (
                          <a
                            key={cta.href}
                            href={cta.href}
                            className="rounded-full bg-indigo-600 px-5 py-2 text-white shadow-[0_18px_36px_rgba(79,70,229,0.28)] transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-300"
                          >
                            {cta.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-indigo-600">
                    <span className="rounded-full bg-indigo-100/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-indigo-500">
                      Explore IMAT hub
                    </span>
                    {examHubPills.map((pill) => (
                      <a
                        key={pill.label}
                        href={pill.href}
                        className="rounded-full border border-indigo-100 bg-white/80 px-3 py-1 transition hover:border-indigo-300 hover:text-indigo-700"
                      >
                        {pill.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="relative flex flex-col overflow-hidden rounded-[32px] bg-white/85 shadow-[0_24px_80px_rgba(30,64,175,0.22)] ring-1 ring-indigo-100/70">
                  <div className="relative h-60 w-full overflow-hidden sm:h-64">
                    <Image
                      src={meta.heroImage.src}
                      alt={meta.heroImage.alt}
                      width={meta.heroImage.width ?? 960}
                      height={meta.heroImage.height ?? 540}
                      className="h-full w-full object-cover"
                      priority
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" aria-hidden="true" />
                    <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-indigo-600 shadow-lg shadow-indigo-500/40">
                      {"\u25B6"}
                    </div>
                  </div>

                  {meta.personas?.length ? (
                    <div className="space-y-4 px-6 py-6 text-sm text-slate-700">
                      <h2 className="pt-2 text-base font-semibold text-slate-900">Who this guide unlocks</h2>
                      <ul className="space-y-2">
                        {meta.personas.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
                        {meta.exam && (
                          <div className="rounded-2xl bg-slate-100 px-3 py-3">
                            <span className="block text-[11px] uppercase tracking-wide text-slate-500">Exam</span>
                            <span>{meta.exam}</span>
                          </div>
                        )}
                        {meta.country && (
                          <div className="rounded-2xl bg-slate-100 px-3 py-3">
                            <span className="block text-[11px] uppercase tracking-wide text-slate-500">Country</span>
                            <span>{meta.country}</span>
                          </div>
                        )}
                        {meta.educationLevels?.length ? (
                          <div className="rounded-2xl bg-slate-100 px-3 py-3">
                            <span className="block text-[11px] uppercase tracking-wide text-slate-500">Audience</span>
                            <span>{meta.educationLevels.join(", ")}</span>
                          </div>
                        ) : null}
                        <div className="rounded-2xl bg-slate-100 px-3 py-3">
                          <span className="block text-[11px] uppercase tracking-wide text-slate-500">Reading time</span>
                          <span>{`${article.readingMinutes} minutes`}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {meta.tags?.length ? (
                    <div className="mt-auto px-6 pb-6">
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
                        {meta.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-indigo-100/70 px-3 py-1 text-indigo-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {toc.length > 0 && (
                <div className="relative mt-10 flex gap-3 overflow-x-auto px-8 pb-8 text-xs text-indigo-700 xl:hidden">
                  {toc.map((heading) => (
                    <button
                      key={heading.id}
                      type="button"
                      onClick={() => handleJumpTo(heading.id)}
                      className="rounded-full border border-indigo-100 bg-white px-3 py-1 font-semibold shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
                    >
                      {heading.text}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="px-6 py-8 sm:px-10 sm:py-9">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">Enrollment path</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">From idea to IMAT seat</h2>
                    <p className="mt-3 max-w-2xl text-sm text-slate-600">
                      Follow the essential checkpoints for international applicants. We pair every milestone with tools inside EnterMedSchool so nothing slips.
                    </p>
                  </div>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-100/80 bg-white/90 px-4 py-2 text-xs font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
                  >
                    Save this as PDF
                    <span aria-hidden="true">{"\u2192"}</span>
                  </a>
                </div>

                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                  {timelineSteps.map((step, index) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
                      className="relative flex flex-col gap-3 rounded-2xl border border-indigo-100/60 bg-white/95 p-5 shadow-[0_12px_32px_rgba(79,70,229,0.12)]"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-indigo-500">
                        <span>{step.phase}</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">{index + 1}</span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                      <p className="text-sm text-slate-600">{step.description}</p>
                      {step.action ? (
                        <a href="#" className="mt-auto text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                          {step.action}
                        </a>
                      ) : null}
                      {index < timelineSteps.length - 1 && (
                        <div className="absolute -right-3 top-1/2 hidden h-[3px] w-6 rounded-full bg-gradient-to-r from-indigo-200/60 to-indigo-400/80 lg:block" aria-hidden="true" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            <div className="grid gap-12 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
              <article className="imat-article prose prose-slate prose-headings:tracking-tight prose-p:leading-relaxed prose-li:leading-relaxed relative w-full max-w-[720px] rounded-[40px] bg-white/96 p-8 shadow-[0_30px_110px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/60 backdrop-blur-xl sm:p-12 xl:mx-auto">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-[40px] bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-500" aria-hidden="true" />
                <div dangerouslySetInnerHTML={{ __html: article.html }} />
              </article>

              <div className="space-y-8">
                {meta.map ? (
                  <CountrySpotlight
                    dataset={meta.map.dataset}
                    countryName={meta.map.countryName}
                    isoA3={meta.map.isoA3}
                    center={meta.map.center}
                    zoom={meta.map.zoom}
                    examTag={meta.map.examTag ?? meta.exam}
                    onOpenMap={() => setMapOpen(true)}
                  />
                ) : null}

                <aside className="rounded-[28px] border border-indigo-100/60 bg-white/85 p-6 text-sm shadow-[0_14px_44px_rgba(15,23,42,0.12)] backdrop-blur">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">Article Snapshot</h2>
                  <dl className="mt-5 space-y-4 text-slate-700">
                    {meta.exam && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Exam focus</dt>
                        <dd className="font-semibold text-slate-900">{meta.exam}</dd>
                      </div>
                    )}
                    {meta.country && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Country</dt>
                        <dd className="font-semibold text-slate-900">{meta.country}</dd>
                      </div>
                    )}
                    {meta.educationLevels?.length ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Audience</dt>
                        <dd className="font-semibold text-slate-900">{meta.educationLevels.join(", ")}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Word count</dt>
                      <dd className="font-semibold text-slate-900">{article.wordCount.toLocaleString("en-US")}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Reading time</dt>
                      <dd className="font-semibold text-slate-900">{`${article.readingMinutes} minutes`}</dd>
                    </div>
                  </dl>
                </aside>

                <aside className="rounded-[28px] border border-indigo-100/60 bg-white/90 p-6 text-sm text-slate-800 shadow-[0_16px_48px_rgba(79,70,229,0.15)]">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">Recommended next</h2>
                  <p className="mt-4 text-sm text-slate-600">
                    Deepen your IMAT knowledge with these hand-picked reads crafted for international applicants.
                  </p>
                  <ul className="mt-6 space-y-4">
                    {recommendedArticles.map((item) => (
                      <li key={item.title} className="rounded-2xl border border-indigo-100 bg-white/95 p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
                        <div className="flex items-center justify-between text-xs font-semibold text-indigo-500">
                          <span>{item.badge}</span>
                          <span>{item.readMinutes} min read</span>
                        </div>
                        <a href={item.href} className="mt-2 block text-base font-semibold text-slate-900">
                          {item.title}
                        </a>
                        <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
                      </li>
                    ))}
                  </ul>
                </aside>

                {meta.resources?.length ? (
                  <aside className="rounded-[28px] border border-indigo-100/60 bg-white/85 p-6 text-sm text-slate-800 shadow-[0_14px_44px_rgba(15,23,42,0.12)]">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">Next steps</h2>
                    <p className="mt-4 text-sm text-slate-600">
                      Continue building momentum with the roadmap and tools we created specifically for this journey.
                    </p>
                    <ul className="mt-5 space-y-3">
                      {meta.resources.map((resource) => (
                        <li key={resource.href}>
                          <a
                            href={resource.href}
                            className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-white px-4 py-3 font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
                          >
                            <span>{resource.label}</span>
                            <span aria-hidden="true">{"\u2192"}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </aside>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

      <AnimatePresence>
        {mapOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-5xl rounded-[36px] bg-slate-900/90 p-6 shadow-[0_40px_160px_rgba(15,23,42,0.65)] ring-1 ring-sky-500/40"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow"
                aria-label="Close map"
              >
                x
              </button>
              <div className="mb-5 flex flex-col gap-2 text-white">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Interactive map</span>
                <h3 className="text-2xl font-semibold">Explore IMAT universities across {meta.country ?? "the country"}</h3>
                <p className="text-sm text-slate-200">
                  Filter by seat availability, scores, or student community support just like on the homepage map.
                </p>
              </div>
              <div className="overflow-hidden rounded-[28px] bg-slate-900">
                <div className="h-[520px] w-full">
                  <HomeMap variant="compact" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>\r\n      <ArticleTypographyStyles />
    </>
  );
}
