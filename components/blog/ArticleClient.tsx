"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { ArticleContent, BlogArticleMeta } from "@/lib/blog/types";

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
      <div className="relative isolate overflow-hidden pb-32">
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
              left: "max(1.5rem, calc((100vw - 1280px) / 2 - 280px))",
              width: "18rem",
              zIndex: 40,
            }}
          >
            <div className="rounded-3xl bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.24)] ring-1 ring-white/60 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-indigo-500">Quick map</p>
              <p className="mt-2 text-sm text-slate-600">Jump between the key sections of this IMAT roadmap.</p>
              <ul className="mt-4 space-y-2 text-sm">
                {toc.map((heading) => (
                  <li key={heading.id}>
                    <button
                      type="button"
                      onClick={() => handleJumpTo(heading.id)}
                      className={clsx(
                        "group flex w-full items-center gap-2 rounded-2xl px-4 py-2 text-left transition",
                        activeHeading === heading.id
                          ? "bg-indigo-50 text-indigo-600 shadow-inner shadow-indigo-500/20"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-indigo-600",
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current transition-transform group-hover:scale-125" aria-hidden="true" />
                      <span>{heading.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        )}

        <div className="relative mx-auto w-full max-w-[1600px] px-4 pt-10 sm:px-8 xl:px-12 2xl:px-16">
          <div className="space-y-16">
            <section className="relative overflow-hidden rounded-[54px] bg-gradient-to-br from-indigo-950/70 via-indigo-900/55 to-indigo-900/60 p-[1px] shadow-[0_40px_120px_rgba(30,64,175,0.4)] ring-1 ring-indigo-500/30">
              <div className="rounded-[53px] bg-gradient-to-br from-white/90 via-white/92 to-white/95 p-8 sm:p-12 lg:p-14">
                <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
                  <div className="flex-1 space-y-8">
                    <div className="flex flex-wrap gap-3 text-sm">
                      {heroChips.map((chip) => (
                        <span
                          key={chip.label}
                          className={clsx(
                            "rounded-full px-4 py-1 font-medium shadow",
                            chip.tone === "exam" && "bg-indigo-600/90 text-white shadow-indigo-500/40",
                            chip.tone === "country" && "bg-sky-100/80 text-sky-700 shadow-sky-400/30",
                            chip.tone === "time" && "bg-white text-indigo-600 shadow-indigo-500/10",
                          )}
                        >
                          {chip.label}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-6 text-slate-900">
                      <h1 className="font-brand text-4xl leading-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                        {meta.title}
                      </h1>
                      <p className="max-w-2xl text-lg text-slate-600 sm:text-xl">
                        {meta.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
                      <div className="rounded-3xl bg-white/85 p-5 shadow-[0_16px_42px_rgba(15,23,42,0.18)] ring-1 ring-white/60">
                        <div className="flex items-center gap-4">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 text-xl font-semibold text-white shadow-lg">
                            {meta.author.avatarInitials ?? meta.author.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="text-xs sm:text-sm">
                            <p className="font-semibold text-slate-900">{meta.author.name}</p>
                            <p className="text-slate-600">{meta.author.title}</p>
                            <p className="text-slate-500">
                              <time dateTime={meta.published}>
                                Published {new Date(meta.published).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                              </time>
                              <span className="mx-2">{"\u2022"}</span>
                              <time dateTime={meta.updated}>
                                Updated {new Date(meta.updated).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                              </time>
                            </p>
                          </div>
                        </div>
                      </div>

                      {meta.callToActions?.length ? (
                        <div className="flex flex-wrap items-center gap-3">
                          {meta.callToActions.map((cta) => (
                            <a key={cta.href} href={cta.href} className="btn-primary-shine text-sm">
                              {cta.label}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-indigo-600">
                      <span className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-500">Explore IMAT hub</span>
                      {examHubPills.map((pill) => (
                        <a
                          key={pill.label}
                          href={pill.href}
                          className="rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-400 hover:text-indigo-700"
                        >
                          {pill.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="w-full max-w-xl space-y-6">
                    <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-indigo-600/85 via-indigo-500/60 to-sky-400/75 p-[6px] shadow-[0_30px_80px_rgba(30,64,175,0.4)]">
                      <div className="absolute inset-0 animate-pulse rounded-[38px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),transparent_60%)]" aria-hidden="true" />
                      <div className="relative rounded-[34px] bg-white pb-6">
                        <div className="relative overflow-hidden rounded-t-[34px]">
                          <Image
                            src={meta.heroImage.src}
                            alt={meta.heroImage.alt}
                            width={meta.heroImage.width ?? 960}
                            height={meta.heroImage.height ?? 540}
                            className="h-[300px] w-full object-cover"
                            priority
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                          <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-indigo-600 shadow-lg shadow-indigo-500/50">
                            {"\u203A"}
                          </div>
                        </div>
                        {meta.personas?.length ? (
                          <div className="space-y-4 px-6 text-sm text-slate-700">
                            <h2 className="pt-6 text-base font-semibold text-slate-900">Who this guide unlocks</h2>
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
                                  <span className="block text-[11px] uppercase tracking-wide text-slate-500">Level</span>
                                  <span>{meta.educationLevels.join(", ")}</span>
                                </div>
                              ) : null}
                              <div className="rounded-2xl bg-slate-100 px-3 py-3">
                                <span className="block text-[11px] uppercase tracking-wide text-slate-500">Reading</span>
                                <span>{`${article.readingMinutes} minutes`}</span>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {meta.tags?.length ? (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {meta.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-white/80 px-3 py-1 font-semibold text-indigo-600 shadow">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {toc.length > 0 && (
                  <div className="mt-8 flex gap-3 overflow-x-auto rounded-2xl bg-indigo-50/60 p-3 text-xs text-indigo-700 shadow-inner shadow-indigo-500/10 xl:hidden">
                    {toc.map((heading) => (
                      <button
                        key={heading.id}
                        type="button"
                        onClick={() => handleJumpTo(heading.id)}
                        className="rounded-full bg-white px-3 py-1 font-semibold shadow hover:bg-indigo-100"
                      >
                        {heading.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[48px] bg-gradient-to-br from-indigo-600/20 via-white/95 to-white/95 p-1 shadow-[0_32px_110px_rgba(30,64,175,0.2)]">
              <div className="rounded-[46px] bg-white/92 p-6 sm:p-10">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-500">Enrollment path</p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">From idea to IMAT seat</h2>
                    <p className="mt-3 max-w-2xl text-sm text-slate-600">
                      Follow the essential checkpoints for international applicants. We pair every milestone with tools inside EnterMedSchool so nothing slips.
                    </p>
                  </div>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-400 hover:text-indigo-700"
                  >
                    Save this as PDF
                    <span aria-hidden="true">{"\u2192"}</span>
                  </a>
                </div>

                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                  {timelineSteps.map((step, index) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
                      className="relative flex flex-col gap-3 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-white p-5 shadow-[0_18px_46px_rgba(37,99,235,0.18)] ring-1 ring-indigo-100/60"
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
                        <div className="absolute -right-3 top-1/2 hidden h-[3px] w-6 rounded-full bg-gradient-to-r from-indigo-300 to-indigo-500 lg:block" aria-hidden="true" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            <div className="grid gap-12 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.9fr)]">
              <article className="imat-article prose prose-slate relative max-w-none rounded-[40px] bg-white/95 p-8 shadow-[0_34px_120px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/60 backdrop-blur-xl sm:p-12">
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

                <aside className="rounded-[32px] bg-gradient-to-br from-white via-indigo-50/60 to-sky-50/70 p-6 text-sm shadow-[0_20px_60px_rgba(15,23,42,0.12)] ring-1 ring-indigo-100/60 backdrop-blur">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-500">Article Snapshot</h2>
                  <dl className="mt-5 space-y-4 text-slate-700">
                    {meta.exam && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-600">Exam focus</dt>
                        <dd className="font-semibold text-slate-900">{meta.exam}</dd>
                      </div>
                    )}
                    {meta.country && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-600">Country</dt>
                        <dd className="font-semibold text-slate-900">{meta.country}</dd>
                      </div>
                    )}
                    {meta.educationLevels?.length ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-600">Audience</dt>
                        <dd className="font-semibold text-slate-900">{meta.educationLevels.join(", ")}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">Word count</dt>
                      <dd className="font-semibold text-slate-900">{article.wordCount.toLocaleString("en-US")}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-600">Reading time</dt>
                      <dd className="font-semibold text-slate-900">{`${article.readingMinutes} minutes`}</dd>
                    </div>
                  </dl>
                </aside>

                <aside className="rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-sm text-slate-100 shadow-[0_26px_72px_rgba(15,23,42,0.45)]">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-200">Recommended next</h2>
                  <p className="mt-4 text-sm text-slate-200">
                    Deepen your IMAT knowledge with these hand-picked reads crafted for international applicants.
                  </p>
                  <ul className="mt-6 space-y-4">
                    {recommendedArticles.map((item) => (
                      <li key={item.title} className="rounded-2xl bg-white/10 p-4 transition hover:bg-white/16">
                        <div className="flex items-center justify-between text-xs font-semibold text-indigo-200/90">
                          <span>{item.badge}</span>
                          <span>{item.readMinutes} min read</span>
                        </div>
                        <a href={item.href} className="mt-2 block text-base font-semibold text-white">
                          {item.title}
                        </a>
                        <p className="mt-2 text-sm text-indigo-100/80">{item.summary}</p>
                      </li>
                    ))}
                  </ul>
                </aside>

                {meta.resources?.length ? (
                  <aside className="rounded-[32px] bg-gradient-to-br from-indigo-50 to-white p-6 text-sm text-slate-800 shadow-[0_22px_60px_rgba(15,23,42,0.1)] ring-1 ring-indigo-100/60">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-500">Next steps</h2>
                    <p className="mt-4 text-sm text-slate-600">
                      Continue building momentum with the roadmap and tools we created specifically for this journey.
                    </p>
                    <ul className="mt-5 space-y-3">
                      {meta.resources.map((resource) => (
                        <li key={resource.href}>
                          <a
                            href={resource.href}
                            className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 font-semibold text-indigo-600 shadow transition hover:bg-indigo-50"
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
      </AnimatePresence>

      <style jsx global>{`
        .imat-article h1,
        .imat-article h2,
        .imat-article h3,
        .imat-article h4 {
          font-family: var(--font-baloo), "Poppins", "Segoe UI", system-ui, -apple-system, sans-serif;
          color: rgb(30, 41, 59);
        }
        .imat-article h2 {
          font-size: clamp(2rem, 2.6vw + 1.2rem, 2.75rem);
          line-height: 1.15;
          margin-top: 3.5rem;
        }
        .imat-article h3 {
          font-size: clamp(1.6rem, 1.4vw + 1rem, 2.15rem);
          line-height: 1.2;
          margin-top: 2.75rem;
        }
        .imat-article p {
          color: rgb(71, 85, 105);
        }
        .imat-article a {
          color: rgb(79, 70, 229);
          font-weight: 600;
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 6px;
          transition: color 0.2s ease;
        }
        .imat-article a:hover {
          color: rgb(55, 48, 163);
        }
        .imat-article .cards {
          display: grid;
          gap: 1.5rem;
          margin: 2.75rem 0;
        }
        @media (min-width: 768px) {
          .imat-article .cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .imat-article .card {
          border-radius: 1.5rem;
          padding: 1.6rem;
          background: linear-gradient(180deg, rgba(79, 70, 229, 0.08), rgba(14, 165, 233, 0.08));
          box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
          border: 1px solid rgba(79, 70, 229, 0.18);
        }
        .imat-article .card h4 {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          color: rgb(30, 41, 59);
        }
        .imat-article .card .more {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.95rem;
          color: rgb(79, 70, 229);
          text-decoration: none;
        }
        .imat-article .card .more::after {
          content: ">";
          font-size: 0.9rem;
        }
        .imat-article table {
          border-radius: 1.25rem;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
        }
        .imat-article table thead {
          background: linear-gradient(90deg, rgba(37, 99, 235, 0.12), rgba(45, 212, 191, 0.12));
        }
        .imat-article table th,
        .imat-article table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.25);
        }
        .imat-article table tbody tr:nth-child(odd) {
          background-color: rgba(148, 163, 184, 0.08);
        }
        .imat-article .backtop a {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 9999px;
          padding: 0.4rem 0.9rem;
          background: rgba(79, 70, 229, 0.12);
          color: rgb(79, 70, 229);
          text-decoration: none;
        }
      `}</style>
    </>
  );
}
