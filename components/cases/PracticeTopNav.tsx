"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { usePractice } from "./PracticeProvider";
import { CASE_GLASS_STRIP, CASE_PILL_CLASS, CASE_GRADIENT_BUTTON, CASE_TEXT_MUTED } from "./theme";

const NAV_KEYS: Array<{ key: string; label: string; segment?: string }> = [
  { key: "practice", label: "Practice" },
  { key: "library", label: "Cases", segment: "cases" },
  { key: "build", label: "Build Set", segment: "build" },
  { key: "dashboard", label: "Dashboard", segment: "dashboard" },
  { key: "review", label: "Review", segment: "review" },
  { key: "resources", label: "Resources", segment: "resources" },
];

export default function PracticeTopNav() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { bundle, setActiveSubject, state } = usePractice();

  const baseHref = useMemo(() => `/cases/${bundle.collection.slug}`, [bundle.collection.slug]);
  const navItems = useMemo(
    () =>
      NAV_KEYS.map((item) => ({
        ...item,
        href: item.segment ? `${baseHref}/${item.segment}` : baseHref,
      })),
    [baseHref]
  );

  const formattedExamDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(bundle.user.examDate));
    } catch {
      return "--";
    }
  }, [bundle.user.examDate]);

  const handleCollectionChange = (slug: string) => {
    if (!slug || slug === bundle.collection.slug) return;
    router.push(`/cases/${slug}`);
  };

  return (
    <div className={`sticky top-14 z-40 ${CASE_GLASS_STRIP} border-b border-white/15`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className={`flex flex-wrap items-center gap-2 text-xs ${CASE_TEXT_MUTED}`}>
            <span className={`${CASE_PILL_CLASS} px-3 py-1 font-semibold`}>
              Exam {formattedExamDate}
            </span>
            <span className={`${CASE_PILL_CLASS} px-3 py-1`}>
              Streak <span className="ml-1 font-semibold text-white">{bundle.dashboard.streak}d</span>
            </span>
            <span className={`${CASE_PILL_CLASS} px-3 py-1`}>
              Goal {bundle.user.targetDailyMinutes} min/day
            </span>
            <div className={`${CASE_PILL_CLASS} flex items-center gap-2 px-3 py-1`}>
              <span className="text-slate-400">Collection</span>
              <select
                value={bundle.collection.slug}
                onChange={(event) => handleCollectionChange(event.target.value)}
                className="bg-transparent text-indigo-200 focus:outline-none"
              >
                {bundle.availableCollections.map((collection) => (
                  <option key={collection.slug} value={collection.slug} className="text-slate-900">
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Link
            href={`${baseHref}/build`}
            className={`inline-flex items-center gap-2 rounded-full ${CASE_GRADIENT_BUTTON} px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:translate-y-[-1px] hover:shadow-indigo-700/40`}
          >
            New session
          </Link>
        </div>
        <nav className="relative -mx-2 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== baseHref && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`group relative rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? "text-white" : "text-slate-200 hover:text-white"
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  <span
                    className={`absolute inset-0 -z-10 rounded-full transition ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/60 via-violet-500/60 to-sky-500/60 shadow-[0_0_18px_rgba(99,102,241,0.35)]"
                        : "bg-white/10 group-hover:bg-white/15"
                    }`}
                  />
                  {isActive && <span className="absolute -bottom-3 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-400 to-sky-400" />}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className={`flex flex-wrap items-center gap-2 text-xs ${CASE_TEXT_MUTED}`}>
          {bundle.subjects.map((subject) => {
            const isActive = subject.slug === state.activeSubjectSlug;
            return (
              <button
                key={subject.slug}
                onClick={() => setActiveSubject(subject.slug)}
                className={`rounded-full px-3 py-1 font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/60 to-sky-500/60 text-white"
                    : `${CASE_PILL_CLASS} hover:bg-white/15`
                }`}
              >
                {subject.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
