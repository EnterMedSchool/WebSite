"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import VideoPanel from "@/components/lesson/VideoPanel";
import TranscriptPanel from "@/components/lesson/TranscriptPanel";
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
      <div className="sticky top-16 z-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-[0_14px_42px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {/* Breadcrumb-like pill with course > chapter (UI only) */}
            <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">
              <a href={`/${course.slug}`} className="opacity-95 hover:underline">{course.title}</a>
              <span className="opacity-80">›</span>
              <a href={`/${course.slug}/${chapter.slug}`} className="opacity-95 hover:underline">{chapter.title}</a>
            </div>
            <h1 className="truncate text-3xl font-extrabold tracking-tight sm:text-4xl">{lessonTitle}</h1>

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

      {/* Chapter stepper (clickable) */}
      <div className="mt-4 rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
        <div className="mb-2 text-sm font-semibold text-gray-900">Chapter path</div>
        <ol className="flex flex-wrap items-center gap-2">
          {chapterTimeline.map((s, i) => (
            <li key={s.key} className="flex items-center gap-2">
              <button className={`flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold ring-1 ${s.active ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-gray-800 hover:bg-indigo-50 ring-gray-200'}`}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-700">{i+1}</span>
                <span className="max-w-[160px] truncate sm:max-w-[240px]">{s.title}</span>
              </button>
              {i < chapterTimeline.length - 1 && <span className="text-gray-300">→</span>}
            </li>
          ))}
        </ol>
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
      <div className={`mt-4 grid gap-4 ${focusMode ? '' : 'lg:grid-cols-[280px_1fr_320px]'}`}>
        {/* Left: Chapter progress */}
        {!focusMode && (
          <aside className="order-first space-y-3">
            <div className="rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-[12px] font-semibold text-indigo-900">Chapter progress</div>

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
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-600">
                        <span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.6"/></svg> ~4 min</span>
                        {l.q ? (<span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6"/><path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.6"/></svg> {l.q} quiz</span>) : null}
                        <span className="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 12h18" stroke="currentColor" strokeWidth="1.6"/></svg> 30%</span>
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
            src="https://www.youtube.com/watch?v=8qRLS1oG6lY"
            poster="/graph/v1/course-2.jpg"
            iframeSrc={undefined}
            locked={false}
            subtitles={[]}
            prev={{ href: '#', title: 'Hemostasis Overview' }}
            next={{ href: '#', title: 'DIC Management' }}
          />
          <TranscriptPanel />

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

        {/* Right: Sidebar (collapsible sections) */}
        {!focusMode && (
          <div className="hidden lg:block space-y-3">
            <details open className="rounded-2xl border bg-white p-2 shadow-sm ring-1 ring-black/5">
              <summary className="cursor-pointer list-none p-2 text-sm font-semibold text-indigo-900">Glossary</summary>
              <div className="px-2 pb-2"><Glossary /></div>
            </details>
            <details className="rounded-2xl border bg-white p-2 shadow-sm ring-1 ring-black/5">
              <summary className="cursor-pointer list-none p-2 text-sm font-semibold text-indigo-900">Download center</summary>
              <div className="space-y-3 px-2 pb-2">
                <UniResources enabled={false} comingSoon />
                <AnkiDownload comingSoon />
              </div>
            </details>
            <details className="rounded-2xl border bg-white p-2 shadow-sm ring-1 ring-black/5">
              <summary className="cursor-pointer list-none p-2 text-sm font-semibold text-indigo-900">Concept check</summary>
              <div className="px-2 pb-2">
                <div className="rounded-xl border p-3 text-[12px] text-gray-600">Inline checks are embedded in the reading area.</div>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Mobile bottom nav for Learn/Practice/Notes (skeleton) */}
      <div className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 gap-1 border-t bg-white p-2 shadow md:hidden">
        {(['learn','practice','background'] as const).map((m) => (
          <button key={m} onClick={() => setTab(m)} className={`h-11 rounded-xl text-sm font-semibold ${tab===m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>{m}</button>
        ))}
      </div>
    </div>
  );
}
