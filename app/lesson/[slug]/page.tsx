"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import VideoPanel from "@/components/lesson/VideoPanel";
import UniResources from "@/components/lesson/UniResources";
import AnkiDownload from "@/components/lesson/AnkiDownload";
import ConceptChecklist from "@/components/lesson/ConceptChecklist";
import BackgroundMap from "@/components/lesson/BackgroundMap";
import Glossary from "@/components/lesson/Glossary";
import StudyToolbar from "@/components/lesson/StudyToolbar";

export default function LessonPage() {
  const { slug: rawSlug } = useParams();
  const slug = String(rawSlug || "lesson");

  const [tab, setTab] = useState<"learn" | "practice" | "background">("learn");
  const [focusMode, setFocusMode] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [fav, setFav] = useState(false);

  // Fake UI data (no network calls)
  const course = { slug: "hematology", title: "Hematology" };
  const chapter = { slug: "coagulation", title: "Coagulation Disorders" };
  const lessonTitle = "Disseminated Intravascular Coagulation (DIC)";
  const courseProgress = { total: 42, completed: 19, pct: 45 };
  const lessonProgress = { completed: false, qCorrect: 3, qTotal: 10, lessonPct: 30 };
  const chapterTimeline = [
    { key: "intro", title: "Intro: Coagulation…", q: 0, active: false },
    { key: "dic", title: "Disseminated Intravascular…", q: 2, active: true },
    { key: "ttp", title: "Thrombotic Thrombocytopenic…", q: 1, active: false },
  ];

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      {/* Header – UI only */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-[0_14px_42px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {/* Breadcrumb-like pill with course > chapter (UI only) */}
            <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
              <span className="opacity-95">{course.title}</span>
              <span className="opacity-80">›</span>
              <span className="opacity-95">{chapter.title}</span>
            </div>
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{lessonTitle}</h1>

            {/* Compact status + visual bar */}
            <div className="mt-3 w-full max-w-md text-[11px] font-medium text-white/90">
              <div className="mb-1">{completed ? "Completed" : "Incomplete"} · {lessonProgress.qCorrect}/{lessonProgress.qTotal} questions</div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-emerald-200 to-white/60" style={{ width: `${Math.max(0, Math.min(100, lessonProgress.lessonPct))}%` }} />
              </div>
              <div className="mt-1 text-[10px] opacity-90">Course progress: {courseProgress.completed}/{courseProgress.total} · {courseProgress.pct}%</div>
            </div>

            {/* Credits row */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-white/90">
              <span>Author — <span className="font-semibold">Dr. A. Example</span></span>
              <span className="opacity-80">·</span>
              <span>Reviewed by — <span className="font-semibold">Prof. B. Reviewer</span></span>
              <span className="opacity-80">·</span>
              <span className="inline-flex items-center gap-1">Recently completed <span className="inline-flex -space-x-2 overflow-hidden pl-1">
                <span className="h-5 w-5 rounded-full bg-white/70 ring-1 ring-white/80" />
                <span className="h-5 w-5 rounded-full bg-white/60 ring-1 ring-white/80" />
                <span className="h-5 w-5 rounded-full bg-white/50 ring-1 ring-white/80" />
              </span></span>
            </div>
          </div>

          {/* Actions cluster: course pill, favorite, mark complete (UI only) */}
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{course.title}</span>
            <button
              className="rounded-full px-3 py-1 text-xs font-semibold bg-white/20 text-white/90 hover:bg-white/30"
              title="Open all chapters"
            >
              open all chapters
            </button>
            <button
              onClick={() => setFav((v) => !v)}
              className={`rounded-full px-2 py-1 text-xs font-semibold ${fav ? 'bg-rose-500 text-white' : 'bg-white/20 text-white/90 hover:bg-white/30'}`}
              title={fav ? 'Unfavorite' : 'Favorite'}
              aria-pressed={fav}
            >
              {fav ? '♥' : '♡'}
            </button>
            <button
              onClick={() => setCompleted((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${completed ? 'bg-emerald-100 text-emerald-700 ring-emerald-300' : 'bg-white/20 text-white/90 ring-white/40 hover:bg-white/30'}`}
            >
              {completed ? 'Completed' : 'Mark as complete'}
            </button>
          </div>
        </div>
      </div>

      {/* Chapter path bar (UI only) */}
      <div className="mt-4 rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
        <div className="mb-1 text-[12px] font-semibold text-gray-900">Chapter path</div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-indigo-100">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-400" style={{ width: '55%' }} />
          <div className="absolute -right-2 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow ring-2 ring-indigo-500" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-4">
        <StudyToolbar
          mode={tab}
          onMode={(m) => setTab(m)}
          onFocusToggle={() => setFocusMode((v) => !v)}
          focus={focusMode}
          softLockPractice={false}
        />
      </div>

      {/* Content area */}
      <div className={`mt-4 grid gap-4 ${focusMode ? '' : 'lg:grid-cols-[260px_1fr_280px]'}`}>
        {/* Left: Chapter progress */}
        {!focusMode && (
          <aside className="order-first space-y-3">
            <div className="rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-[11px] font-semibold text-indigo-900">CHAPTER PROGRESS</div>

              {/* Chapter header */}
              <div className="mt-2 rounded-xl bg-indigo-50/60 p-3 ring-1 ring-inset ring-indigo-100">
                <div className="text-xs font-semibold text-indigo-900 truncate">Chapter: {chapter.title}</div>
                <div className="text-[11px] text-indigo-800/70">Intro · 3–5 min read</div>
              </div>

              {/* Step list */}
              <ul className="relative mt-2">
                {chapterTimeline.map((l, i) => (
                  <li key={l.key} className="relative pl-8">
                    {/* connector */}
                    {i < chapterTimeline.length - 1 && (
                      <span className="absolute left-3 top-8 bottom-0 w-px bg-indigo-100" />
                    )}
                    {/* index bubble */}
                    <span className={`absolute left-0 top-3 grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold ${l.active ? 'bg-indigo-600 text-white shadow' : 'bg-gray-200 text-gray-700'}`}>{i + 1}</span>
                    <button type="button" className={`mb-2 w-full rounded-xl border px-3 py-2 text-left transition ${l.active ? 'border-indigo-200 bg-indigo-50 text-indigo-900' : 'border-transparent hover:bg-gray-50 text-gray-800'}`}>
                      <div className="truncate text-sm font-medium">{l.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
                        <span>Questions</span>
                        <span className="inline-flex gap-1">
                          {Array.from({ length: Math.max(0, l.q || 0) }).map((_, j) => (
                            <span key={j} className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-semibold ${l.active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{j + 1}</span>
                          ))}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {/* Footer actions */}
              <div className="mt-2 flex justify-end">
                <button type="button" className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">All chapters</button>
              </div>
            </div>
          </aside>
        )}

        {/* Middle: Main */}
        <div className="space-y-4">
          {/* Video panel – static example */}
          <VideoPanel
            src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            iframeSrc={undefined}
            locked={false}
            subtitles={[]}
            prev={{ href: '#', title: 'Hemostasis Overview' }}
            next={{ href: '#', title: 'DIC Management' }}
          />

          {/* Learn tab – static content */}
          {tab === "learn" && (
            <div className="prose prose-indigo max-w-none rounded-2xl border bg-white p-6 text-sm shadow-sm ring-1 ring-black/5">
              <h2>Overview</h2>
              <p>
                This is a simplified lesson UI. All data loading, analytics,
                progress tracking, and backend integrations are removed so we
                can iterate on visual design and interactions only.
              </p>
              <h3>Key Concepts</h3>
              <ul>
                <li>Clean, focused video experience</li>
                <li>Lightweight reading area</li>
                <li>Practice tab placeholder</li>
                <li>Includes endocrine references like ACTH</li>
              </ul>
              <p>
                We’ll re-introduce features step by step once the core UI feels
                right and performance is solid.
              </p>
            </div>
          )}

          {/* Practice tab – placeholder only */}
          {tab === "practice" && (
            <div className="rounded-2xl border bg-white p-6 text-sm shadow-sm ring-1 ring-black/5">
              <div className="mb-2 text-sm font-semibold text-indigo-900">Practice</div>
              <p className="text-gray-700">Practice questions will appear here. For now, this is a UI-only placeholder.</p>
            </div>
          )}

          {/* Background tab – placeholder only */}
          {tab === "background" && (
            <>
              <div className="rounded-2xl border bg-white p-6 text-sm shadow-sm ring-1 ring-black/5">
                <div className="mb-2 text-sm font-semibold text-indigo-900">Background knowledge</div>
                <p className="text-gray-700">Relevant foundations and reference material will appear here.</p>
              </div>
              <BackgroundMap comingSoon />
            </>
          )}
        </div>

        {/* Right: Sidebar */}
        {!focusMode && (
          <div className="hidden lg:block space-y-4">
            <Glossary />
            <UniResources enabled={false} comingSoon />
            <AnkiDownload comingSoon />
            <ConceptChecklist items={["Concept A", "Concept B", "Concept C"]} comingSoon />
          </div>
        )}
      </div>
    </div>
  );
}
