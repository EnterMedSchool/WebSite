"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { usePractice } from "./PracticeProvider";

const NAV_ITEMS = [
  { key: "practice", label: "Practice", href: "/usmle" },
  { key: "cases", label: "Cases", href: "/usmle/cases" },
  { key: "build", label: "Build Set", href: "/usmle/build" },
  { key: "dashboard", label: "Dashboard", href: "/usmle/dashboard" },
  { key: "review", label: "Review", href: "/usmle/review" },
  { key: "resources", label: "Resources", href: "/usmle/resources" },
];

export default function PracticeTopNav() {
  const pathname = usePathname();
  const { bundle } = usePractice();
  const formattedExamDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(bundle.user.examDate));
    } catch {
      return "--";
    }
  }, [bundle.user.examDate]);

  return (
    <div className="sticky top-14 z-40 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="hidden rounded-full bg-slate-900/80 px-3 py-1 font-semibold text-indigo-200 sm:inline-flex">
              Exam {formattedExamDate}
            </span>
            <span className="hidden rounded-full bg-slate-900/80 px-3 py-1 text-indigo-200 sm:inline-flex">
              Streak <span className="ml-1 font-semibold text-white">{bundle.dashboard.streak}d</span>
            </span>
            <span className="hidden rounded-full bg-slate-900/80 px-3 py-1 text-indigo-200 md:inline-flex">
              Goal {bundle.user.targetDailyMinutes} min/day
            </span>
          </div>
          <Link
            href="/usmle/build"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:translate-y-[-1px] hover:shadow-indigo-700/40"
          >
            New Session
          </Link>
        </div>
        <nav className="relative -mx-2 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2 px-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/usmle" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`group relative rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  <span
                    className={`absolute inset-0 -z-10 rounded-full transition ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/60 via-violet-500/60 to-sky-500/60 shadow-[0_0_18px_rgba(99,102,241,0.35)]"
                        : "bg-slate-900/70 group-hover:bg-slate-900/90"
                    }`}
                  />
                  {isActive && <span className="absolute -bottom-3 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-400 to-sky-400" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
