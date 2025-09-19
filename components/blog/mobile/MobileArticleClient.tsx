"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import type { ArticleContent, BlogArticleMeta } from "@/lib/blog/types";
import ArticleTypographyStyles from "../ArticleTypographyStyles";

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), { ssr: false });
const CountrySpotlight = dynamic(() => import("../CountrySpotlight"), { ssr: false });

type MobileArticleClientProps = {
  meta: BlogArticleMeta;
  article: ArticleContent;
  structuredData: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function MobileArticleClient({ meta, article, structuredData }: MobileArticleClientProps) {
  const heroChips = useMemo(
    () => [
      meta.exam ? { label: meta.exam, tone: "exam" as const } : null,
      meta.country ? { label: meta.country, tone: "country" as const } : null,
      { label: `${article.readingMinutes}-minute read`, tone: "time" as const },
    ].filter(Boolean) as Array<{ label: string; tone: "exam" | "country" | "time" }>,
    [meta.exam, meta.country, article.readingMinutes],
  );

  const toc = useMemo(() => article.headings.filter((heading) => heading.level === 2), [article.headings]);
  const [tocOpen, setTocOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const authorInitials = meta.author.avatarInitials?.slice(0, 2).toUpperCase() ??
    meta.author.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <>
      <article className="min-h-screen bg-slate-950 text-slate-50">
        <header className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={meta.heroImage.src}
              alt={meta.heroImage.alt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950" />
          </div>

          <div className="relative z-10 px-6 pt-16 pb-20 sm:px-8">
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
              {heroChips.map((chip) => (
                <span
                  key={chip.label}
                  className={clsx("rounded-full px-3 py-1", {
                    "bg-indigo-500/20 text-indigo-100": chip.tone === "exam",
                    "bg-cyan-500/20 text-cyan-100": chip.tone === "country",
                    "bg-slate-500/20 text-slate-100": chip.tone === "time",
                  })}
                >
                  {chip.label}
                </span>
              ))}
            </div>

            <h1 className="mt-6 text-3xl font-semibold leading-tight sm:text-4xl">{meta.title}</h1>
            <p className="mt-4 text-base text-slate-300 sm:text-lg">{meta.description}</p>

            {meta.callToActions?.length ? (
              <div className="mt-8 flex flex-col gap-3">
                {meta.callToActions.map((cta) => (
                  <Link
                    key={cta.href}
                    href={cta.href}
                    className="inline-flex items-center justify-center rounded-full bg-white/90 px-6 py-3 text-base font-semibold text-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.25)] backdrop-blur transition hover:bg-white"
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-10 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-lg font-semibold text-white">
                {authorInitials}
              </div>
              <div className="text-sm text-slate-200">
                <p className="font-semibold text-white">{meta.author.name}</p>
                <p className="text-slate-300">{meta.author.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  Published {dateFormatter.format(new Date(meta.published))}
                  {meta.updated ? ` - Updated ${dateFormatter.format(new Date(meta.updated))}` : null}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="relative -mt-8 rounded-t-[32px] bg-white text-slate-900 shadow-[0_26px_80px_rgba(15,23,42,0.45)]">
          <div className="px-5 pb-16 pt-10 sm:px-7">
            {meta.personas?.length ? (
              <section className="rounded-3xl bg-slate-900/5 p-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500">
                  This guide unlocks
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {meta.personas.map((persona) => (
                    <li key={persona} className="flex gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" aria-hidden />
                      <span>{persona}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
              <button
                type="button"
                onClick={() => setTocOpen((open) => !open)}
                className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-700"
                aria-expanded={tocOpen}
              >
                <span>Quick map</span>
                <span className="text-xs uppercase tracking-[0.25em] text-indigo-400">{tocOpen ? "Hide" : "Show"}</span>
              </button>

              <div className={clsx("mt-4 space-y-3 text-sm text-slate-600", { hidden: !tocOpen })}>
                {toc.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className="block rounded-2xl border border-transparent bg-slate-100/60 px-4 py-3 font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    {heading.text}
                  </a>
                ))}
              </div>
            </section>

            <section className="mt-10" id="article-body">
              <article
                className="imat-article prose prose-slate relative max-w-none rounded-3xl bg-white/98 p-5 shadow-[0_26px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60 sm:p-6"
              >
                <div dangerouslySetInnerHTML={{ __html: article.html }} />
              </article>
            </section>

            {meta.resources?.length ? (
              <section className="mt-10 rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500">Keep building momentum</h2>
                <ul className="mt-4 space-y-3 text-sm text-indigo-700">
                  {meta.resources.map((resource) => (
                    <li key={resource.href}>
                      <Link
                        href={resource.href}
                        className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 font-semibold text-indigo-600 shadow transition hover:bg-indigo-100"
                      >
                        <span>{resource.label}</span>
                        <span aria-hidden="true">{"->"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="mt-10 space-y-4 text-sm text-slate-600">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Word count
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {article.wordCount.toLocaleString("en-US")}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Reading time
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {`${article.readingMinutes} minutes`}
                </span>
              </div>

              {meta.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {meta.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            {meta.map ? (
              <section className="mt-12">
                <CountrySpotlight
                  dataset={meta.map.dataset}
                  countryName={meta.map.countryName}
                  isoA3={meta.map.isoA3}
                  center={meta.map.center}
                  zoom={meta.map.zoom}
                  examTag={meta.map.examTag ?? meta.exam}
                  onOpenMap={() => setMapOpen(true)}
                />
              </section>
            ) : null}
          </div>
        </main>
      </article>

      {meta.map && mapOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur">
          <div className="relative mx-4 w-full max-w-3xl rounded-[32px] bg-slate-900 p-5 text-slate-100 shadow-[0_36px_140px_rgba(12,22,48,0.6)] ring-1 ring-sky-500/40">
            <button
              type="button"
              onClick={() => setMapOpen(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow"
              aria-label="Close map"
            >
              x
            </button>
            <h2 className="pr-16 text-base font-semibold">
              Explore IMAT universities across {meta.country ?? "the country"}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Filter by admissions data, seat availability, and student community unlocks.
            </p>
            <div className="mt-4 h-[420px] overflow-hidden rounded-[26px] bg-slate-950">
              <HomeMap variant="compact" />
            </div>
          </div>
        </div>
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <ArticleTypographyStyles />
    </>
  );
}







