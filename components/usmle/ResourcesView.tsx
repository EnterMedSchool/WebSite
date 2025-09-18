"use client";

import Link from "next/link";
import { usePractice } from "./PracticeProvider";

export default function ResourcesView() {
  const { bundle } = usePractice();
  const categories = [
    { key: "algorithm", label: "Algorithms", accent: "from-indigo-500/30 via-violet-500/20 to-sky-500/10" },
    { key: "one-pager", label: "One-pagers", accent: "from-emerald-500/25 via-teal-500/15 to-sky-500/10" },
    { key: "atlas", label: "Image atlas", accent: "from-rose-500/25 via-fuchsia-500/15 to-indigo-500/10" },
  ] as const;

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/30 backdrop-blur">
        <div className="absolute -top-14 left-6 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-16 right-12 h-36 w-36 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">Resources</h2>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Algorithm galleries, one-pagers, and image atlases linked from debriefs so you can jump straight to the right refresher.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {categories.map((category) => (
          <section
            key={category.key}
            className={`relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-lg shadow-indigo-950/20 backdrop-blur`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${category.accent}`} aria-hidden="true" />
            <div className="relative">
              <h3 className="text-lg font-semibold text-white md:text-xl">{category.label}</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                {bundle.resources.filter((r) => r.category === category.key).map((resource) => (
                  <li key={resource.id} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4">
                    <p className="text-sm font-semibold text-white md:text-base">{resource.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{resource.description}</p>
                    {resource.media && (
                      <div className="mt-3 flex h-24 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-900/80 text-xs text-slate-500">
                        {resource.media.alt}
                      </div>
                    )}
                    <Link
                      href="#"
                      className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-200 transition hover:text-white"
                    >
                      Open resource
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
