"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import VideoPanel from "@/components/lesson/VideoPanel";
import TranscriptPanel from "@/components/lesson/TranscriptPanel";
// import AnkiDownload from "@/components/lesson/AnkiDownload";
import FlashcardsCTA from "@/components/lesson/FlashcardsCTA";
import ConceptChecklist from "@/components/lesson/ConceptChecklist";
import BackgroundMap from "@/components/lesson/BackgroundMap";
import Glossary from "@/components/lesson/Glossary";
import StudyToolbar from "@/components/lesson/StudyToolbar";
import FlashcardsWidget from "@/components/flashcards/FlashcardsWidget";
import { dicDeck } from "@/data/flashcards/dic";
import UniResources from "@/components/lesson/UniResources";

type LessonQuestionItem = {
  id: string;
  title: string;
  status: 'todo' | 'correct' | 'incorrect';
};

export default function LessonPage() {
  const { slug: rawSlug } = useParams();
  const slug = String(rawSlug || "lesson");

  const [tab, setTab] = useState<"learn" | "practice" | "background">("learn");
  const [focusMode, setFocusMode] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [fav, setFav] = useState(false);
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);

  // Lesson bundle (questions + chapter lessons + progress) — requires login
  const [bundle, setBundle] = useState<any | null>(null);
  const [bundleErr, setBundleErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setBundle(null); setBundleErr(null);
    fetch(`/api/lesson/${encodeURIComponent(slug)}/bundle?scope=chapter`, { credentials: 'include' })
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 200) { const j = await r.json(); setBundle(j); }
        else if (r.status === 401) setBundleErr('unauthenticated');
        else if (r.status === 403) setBundleErr('forbidden');
        else setBundleErr('error');
      })
      .catch(() => alive && setBundleErr('error'));
    return () => { alive = false; };
  }, [slug]);

  // Fake UI data (no network calls)
  const course = { slug: "hematology", title: "Hematology" };
  const chapter = { slug: "coagulation", title: "Coagulation Disorders" };
  const lessonTitle = "Disseminated Intravascular Coagulation (DIC)";
  const courseProgress = { total: 42, completed: 19, pct: 45 };
  const lessonProgress = { completed: false, qCorrect: 3, qTotal: 10, lessonPct: 30 };

  // Skeleton: questions relevant to this lesson only
  const lessonId = useMemo(() => Number(bundle?.lesson?.id || 0), [bundle]);
  const relevantQuestions = useMemo<LessonQuestionItem[]>(() => {
    const arr = (bundle?.questionsByLesson && lessonId)
      ? (bundle.questionsByLesson[String(lessonId)] || [])
      : [];
    if (!arr.length) return [];
    const qProg: Record<string, any> = (bundle?.progress?.questions || {}) as any;
    return arr.map((q: any, i: number): LessonQuestionItem => {
      const st = qProg && qProg[q.id]?.status;
      const status = st === 'correct' ? 'correct' : st === 'incorrect' ? 'incorrect' : 'todo';
      return { id: String(q.id), title: String(q.prompt || `Q${i+1}`), status };
    });
  }, [bundle, lessonId]);
  const qTotal = relevantQuestions.length;
  const qCorrect = relevantQuestions.filter((q) => q.status === 'correct').length;
  const chapterTimeline = useMemo(() => {
    const ls = bundle?.lessons as any[] | undefined;
    if (!ls?.length) return [
      { key: "intro", title: "Intro: Coagulation…", q: 0, active: false },
      { key: "dic", title: "Disseminated Intravascular…", q: 0, active: true },
    ];
    return ls.map((l) => ({ key: String(l.id), title: String(l.title), q: 0, active: Number(l.id) === lessonId }));
  }, [bundle, lessonId]);

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <FlashcardsWidget open={flashcardsOpen} onClose={() => setFlashcardsOpen(false)} deck={dicDeck} title="DIC Review" />
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
              <span className="hidden inline-flex items-center gap-1">Recently completed <span className="inline-flex -space-x-2 overflow-hidden pl-1">
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
      {/* Toolbar */}
      <div className="mt-4">
        <StudyToolbar
          mode={tab}
          onMode={(m) => setTab(m)}
          onFocusToggle={() => setFocusMode((v) => !v)}
          focus={focusMode}
          softLockPractice={false}
          chapterCount={chapterTimeline.length}
          activeStep={Math.max(0, chapterTimeline.findIndex((s) => s.active))}
        />
      </div>

      {/* Content area */}
      <div className={`mt-4 grid gap-4 ${focusMode ? '' : 'lg:grid-cols-[280px_1fr_320px]'}`}>
        {/* Left: Chapter progress */}
        {!focusMode && (
          <aside className="order-first space-y-3">
            {/* Flashcards above question progress */}
            <div className="rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-[12px] font-semibold text-indigo-900">Flashcards</div>
              <div className="mt-2">
                <FlashcardsCTA
                  count={10}
                  tags={["hematology", "coagulation", "DIC"]}
                  onStart={() => setFlashcardsOpen(true)}
                />
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-[12px] font-semibold text-indigo-900">Question progress</div>

              {/* Lesson summary */}
              <div className="hidden mt-2 rounded-xl bg-indigo-50/60 p-3 ring-1 ring-inset ring-indigo-100">
                <div className="text-xs font-semibold text-indigo-900 truncate">Chapter: {chapter.title}</div>
                <div className="text-[11px] text-indigo-800/70">Intro · 3–5 min read</div>
              </div>

              {/* Lesson summary */}
              <div className="mt-2 rounded-xl bg-indigo-50/60 p-3 ring-1 ring-inset ring-indigo-100">
                <div className="truncate text-xs font-semibold text-indigo-900">Relevant to: {lessonTitle}</div>
                <div className="text-[11px] text-indigo-800/80">{qCorrect}/{relevantQuestions.length} correct - {relevantQuestions.length - qCorrect} remaining</div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/60">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.round((qCorrect / Math.max(1, relevantQuestions.length)) * 100)}%` }} />
                </div>
              </div>

              {/* Question list */}
              <ul className="relative mt-2">
                {relevantQuestions.map((q, i) => {
                  const cls = q.status === 'correct' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : q.status === 'incorrect' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-transparent hover:bg-gray-50 text-gray-800';
                  const chip = q.status === 'correct' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : q.status === 'incorrect' ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-gray-100 text-gray-700 ring-gray-300';
                  const label = q.status === 'correct' ? 'Correct' : q.status === 'incorrect' ? 'Review' : 'To do';
                  return (
                    <li key={q.id} className="relative pl-8">
                      {i < relevantQuestions.length - 1 && (
                        <span className="absolute left-3 top-8 bottom-0 w-px bg-indigo-100" />
                      )}
                      <span className="absolute left-0 top-3 grid h-6 w-6 place-items-center rounded-full bg-gray-200 text-gray-700 text-[12px] font-semibold">{i + 1}</span>
                      <button type="button" className={`mb-2 w-full rounded-xl border px-3 py-2 text-left transition ${cls}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium">{q.title}</div>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${chip}`}>{label}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-600">Single best answer · 1 point</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {/* Footer actions */}
              <div className="mt-2 flex justify-end">
                <button type="button" className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">Practice all</button>
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

          {/* Practice tab — shows bundled questions when available */}
          {tab === "practice" && (
            <div className="rounded-2xl border bg-white p-6 text-sm shadow-sm ring-1 ring-black/5">
              <div className="mb-2 text-sm font-semibold text-indigo-900">Practice</div>
              {!bundle && !bundleErr && <p className="text-gray-700">Loading questions…</p>}
              {bundleErr === 'unauthenticated' && (
                <p className="text-gray-700">Log in to see and practice questions.</p>
              )}
              {bundleErr === 'forbidden' && (
                <p className="text-gray-700">This course is paid. Your account doesn’t have access.</p>
              )}
              {!!relevantQuestions.length && (
                <ul className="mt-2 space-y-2">
                  {relevantQuestions.map((q) => (
                    <li key={q.id} className="rounded-xl border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{q.title}</div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${q.status==='correct' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : q.status==='incorrect' ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-gray-100 text-gray-700 ring-gray-300'}`}>{q.status==='todo'?'To do': q.status==='correct'?'Correct':'Review'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
            {/* Flashcards moved to left sidebar above question progress */}
            <details className="rounded-2xl border bg-white p-2 shadow-sm ring-1 ring-black/5">
              <summary className="cursor-pointer list-none p-2 text-sm font-semibold text-indigo-900">Concept check</summary>
              <div className="px-2 pb-2"> 
                <div className="rounded-xl border p-3 text-[12px] text-gray-600">Inline checks are embedded in the reading area.</div>
              </div>
            </details>
            {/* University Resources */}
            <details id="uni-resources" className="rounded-2xl border bg-white p-2 shadow-sm ring-1 ring-black/5">
              <summary className="cursor-pointer list-none p-2 text-sm font-semibold text-indigo-900">University Resources</summary>
              <div className="px-2 pb-2">
                <UniResources enabled={false} comingSoon />
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
