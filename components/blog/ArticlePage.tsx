import dynamic from "next/dynamic";
import Image from "next/image";
import type { ArticleContent, BlogArticleMeta } from "@/lib/blog/types";

const CountrySpotlight = dynamic(() => import("./CountrySpotlight"), { ssr: false, loading: () => null });

const readableDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

type Props = {
  meta: BlogArticleMeta;
  article: ArticleContent;
  siteUrl: string;
};

export default function ArticlePage({ meta, article, siteUrl }: Props) {
  const published = new Date(meta.published);
  const updated = new Date(meta.updated);
  const readingLabel = article.readingMinutes === 1 ? "1 minute" : `${article.readingMinutes} minutes`;
  const topLevelHeadings = article.headings.filter((heading) => heading.level === 2);
  const articleUrl = `${siteUrl}${meta.slug}`;

  const articleStructuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: articleUrl,
    headline: meta.title,
    description: meta.description,
    image: [meta.heroImage.src],
    datePublished: published.toISOString(),
    dateModified: updated.toISOString(),
    author: {
      "@type": "Person",
      name: meta.author.name,
      jobTitle: meta.author.title,
      url: meta.author.profile,
    },
    publisher: {
      "@type": "Organization",
      name: "EnterMedSchool",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.svg`,
      },
    },
    inLanguage: meta.locales.default,
    availableLanguage: meta.locales.available,
    isAccessibleForFree: true,
    timeRequired: `PT${article.readingMinutes}M`,
    wordCount: article.wordCount,
  };

  if (meta.tags?.length) {
    articleStructuredData.keywords = meta.tags.join(", ");
  }

  const about: Array<Record<string, string>> = [];
  if (meta.exam) about.push({ "@type": "Thing", name: meta.exam });
  if (meta.country) about.push({ "@type": "Place", name: meta.country });
  if (about.length) {
    articleStructuredData.about = about;
  }

  if (meta.educationLevels?.length) {
    articleStructuredData.audience = {
      "@type": "EducationalAudience",
      educationalRole: meta.educationLevels.join(", "),
    };
  }

  if (meta.country) {
    articleStructuredData.contentLocation = {
      "@type": "Country",
      name: meta.country,
    };
  }

  const structuredData = JSON.stringify(
    [
      articleStructuredData,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: meta.title,
            item: articleUrl,
          },
        ],
      },
    ],
    null,
    0,
  );

  return (
    <>
      <div className="relative isolate overflow-hidden pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-[-320px] h-[520px] bg-[radial-gradient(120%_60%_at_50%_0%,rgba(79,70,229,0.18),transparent)]" />

        <section className="vbg vbg-violet relative mx-auto w-full max-w-6xl overflow-hidden rounded-[42px] px-6 py-16 shadow-[0_24px_80px_rgba(46,37,107,0.28)] sm:px-10 lg:py-20">
          <div className="pointer-events-none absolute left-1/2 top-[-160px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.18)_0%,_rgba(37,99,235,0)_66%)]" />
          <div className="pointer-events-none absolute -right-24 bottom-[-180px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(6,182,212,0.22)_0%,_transparent_70%)]" />

          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-6 text-slate-900">
              <div className="flex flex-wrap gap-3 text-sm text-slate-700">
                {meta.exam && (
                  <span className="rounded-full bg-white/70 px-4 py-1 font-medium shadow-sm backdrop-blur">{meta.exam}</span>
                )}
                {meta.country && (
                  <span className="rounded-full bg-white/40 px-4 py-1 font-medium shadow-sm backdrop-blur">{meta.country}</span>
                )}
                <span className="rounded-full bg-indigo-500/90 px-4 py-1 font-semibold text-white shadow">{`${article.readingMinutes}-minute read`}</span>
              </div>
              <h1 className="font-brand text-4xl leading-tight text-slate-900 sm:text-5xl lg:text-6xl">{meta.title}</h1>
              <p className="max-w-2xl text-lg text-slate-800 sm:text-xl">{meta.description}</p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 text-xl font-semibold text-white shadow-lg">
                    {meta.author.avatarInitials ?? meta.author.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">{meta.author.name}</p>
                    <p className="text-slate-700">{meta.author.title}</p>
                    <p className="text-slate-600">
                      <time dateTime={published.toISOString().slice(0, 10)}>Published {readableDateFormatter.format(published)}</time>
                      <span className="mx-2">&bull;</span>
                      <time dateTime={updated.toISOString().slice(0, 10)}>Updated {readableDateFormatter.format(updated)}</time>
                    </p>
                  </div>
                </div>
                {meta.callToActions?.length ? (
                  <div className="flex flex-wrap gap-3">
                    {meta.callToActions.map((cta) => (
                      <a key={cta.href} href={cta.href} className="btn-primary-shine text-sm">
                        {cta.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="relative flex w-full max-w-lg shrink-0 flex-col gap-4 overflow-hidden rounded-[36px] bg-white/70 p-6 shadow-[0_28px_60px_rgba(30,64,175,0.18)] ring-1 ring-indigo-200/60 backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-indigo-100/80 via-transparent to-transparent" />
              <div className="relative">
                <Image
                  src={meta.heroImage.src}
                  alt={meta.heroImage.alt}
                  width={meta.heroImage.width ?? 720}
                  height={meta.heroImage.height ?? 480}
                  className="h-52 w-full rounded-[28px] object-cover shadow-lg"
                  priority
                />
              </div>
              {meta.personas?.length ? (
                <div className="relative space-y-4 text-slate-800">
                  <h2 className="text-lg font-semibold text-slate-900">Who this guide is for</h2>
                  <ul className="space-y-2 text-sm">
                    {meta.personas.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                    {meta.exam && (
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Exam</span>
                        <span>{meta.exam}</span>
                      </div>
                    )}
                    {meta.country && (
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Country</span>
                        <span>{meta.country}</span>
                      </div>
                    )}
                    {meta.educationLevels?.length ? (
                      <div className="rounded-2xl bg-slate-50 px-3 py-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Level</span>
                        <span>{meta.educationLevels.join(", ")}</span>
                      </div>
                    ) : null}
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <span className="block text-[11px] uppercase tracking-wide text-slate-500">Reading time</span>
                      <span>{readingLabel}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-20 w-full max-w-6xl px-6 pb-24 pt-12 sm:px-10 lg:px-12">
          <span id="top" className="sr-only" aria-hidden="true" />
          <div className="grid gap-12 lg:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)]">
            <article className="imat-article prose prose-slate max-w-none rounded-[32px] bg-white/80 p-8 shadow-[0_24px_72px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 backdrop-blur-xl sm:p-10">
              <div dangerouslySetInnerHTML={{ __html: article.html }} />
            </article>

            <div className="space-y-6">
              {meta.map ? (
                <CountrySpotlight
                  dataset={meta.map.dataset}
                  countryName={meta.map.countryName}
                  isoA3={meta.map.isoA3}
                  center={meta.map.center}
                  zoom={meta.map.zoom}
                  examTag={meta.map.examTag ?? meta.exam}
                />
              ) : null}

              <aside className="rounded-[28px] bg-gradient-to-br from-indigo-500/12 via-white to-sky-500/10 p-6 text-sm shadow-[0_18px_48px_rgba(37,99,235,0.18)] ring-1 ring-indigo-200/60 backdrop-blur">
                <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500">Article Snapshot</h2>
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
                    <dd className="font-semibold text-slate-900">{readingLabel}</dd>
                  </div>
                </dl>
                {meta.tags?.length ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {meta.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </aside>

              {topLevelHeadings.length > 0 && (
                <aside className="rounded-[28px] bg-white/90 p-6 text-sm shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 backdrop-blur">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">On this page</h2>
                  <nav aria-label="On this page" className="mt-4 space-y-2">
                    {topLevelHeadings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className="group block rounded-2xl px-4 py-3 transition hover:bg-slate-100"
                      >
                        <span className="font-semibold text-slate-800 group-hover:text-indigo-600">{heading.text}</span>
                      </a>
                    ))}
                  </nav>
                </aside>
              )}

              {meta.resources?.length ? (
                <aside className="rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 text-sm text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.45)]">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-200">Next steps</h2>
                  <p className="mt-4 text-sm text-slate-200">
                    Continue building momentum with the roadmap and tools we created specifically for this journey.
                  </p>
                  <ul className="mt-5 space-y-3">
                    {meta.resources.map((resource) => (
                      <li key={resource.href}>
                        <a
                          href={resource.href}
                          className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                        >
                          <span>{resource.label}</span>
                          <span aria-hidden="true">&gt;</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </aside>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

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
