"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import LessonBody from "@/components/lesson/LessonBody";
// import AnkiDownload from "@/components/lesson/AnkiDownload";
import FlashcardsCTA from "@/components/lesson/FlashcardsCTA";
import ConceptChecklist from "@/components/lesson/ConceptChecklist";
import BackgroundMap from "@/components/lesson/BackgroundMap";
import Glossary from "@/components/lesson/Glossary";
import StudyToolbar from "@/components/lesson/StudyToolbar";
import FlashcardsWidget from "@/components/flashcards/FlashcardsWidget";
import { dicDeck } from "@/data/flashcards/dic";
import { getBundleCached, setBundleCached, getPlayerCached, setPlayerCached, fetchBundleDedupe, fetchPlayerDedupe } from "@/lib/study/cache";
import UniResources from "@/components/lesson/UniResources";
import SaveDock from "@/components/study/SaveDock";
import { StudyStore } from "@/lib/study/store";

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
  const [authed, setAuthed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).__ems_authed;
  });

  // Lesson bundle (questions + chapter lessons + progress) — requires login
  const [bundle, setBundle] = useState<any | null>(null);
  const [bundleErr, setBundleErr] = useState<string | null>(null);
  const [player, setPlayer] = useState<any | null>(null);
  const [playerErr, setPlayerErr] = useState<string | null>(null);
  const [guest, setGuest] = useState<any | null>(null); // static JSON for guests
  useEffect(() => {
    let alive = true;
    setBundle(null); setBundleErr(null); setGuest(null);
    const hasAuth = typeof window !== 'undefined' ? !!(window as any).__ems_authed : false;
    setAuthed(hasAuth);

    if (hasAuth) {
    // Use local cache first (5 min TTL) to avoid repeated API hits
    const cachedB = getBundleCached<any>(slug, 5 * 60 * 1000);
    let gotPlayerFromBundle = false;
    if (cachedB) {
      setBundle(cachedB);
      if ((cachedB as any)?.player) { setPlayer((cachedB as any).player); gotPlayerFromBundle = true; }
    } else {
      fetchBundleDedupe<any>(slug, async () => {
        const r = await fetch(`/api/lesson/${encodeURIComponent(slug)}/bundle?scope=chapter&include=player,body`, { credentials: 'include' });
        if (r.status === 200) return r.json();
        if (r.status === 401) { setBundleErr('unauthenticated'); throw new Error('unauthenticated'); }
        if (r.status === 403) { setBundleErr('forbidden'); throw new Error('forbidden'); }
        setBundleErr('error'); throw new Error('error');
      })
        .then((j) => { if (!alive) return; setBundle(j); setBundleCached(slug, j); if (j?.player) { setPlayer(j.player); setPlayerCached(slug, j.player); gotPlayerFromBundle = true; } })
        .catch(() => { if (alive) setBundleErr((e)=> e||'error'); });
    }
    // Player info (iframeSrc / locked) — short TTL cache (60s) due to signed URLs
    setPlayer(null); setPlayerErr(null);
    const cachedP = getPlayerCached<any>(slug, 60 * 1000);
    if (cachedP) {
      setPlayer(cachedP);
    } else if (!gotPlayerFromBundle) {
      fetchPlayerDedupe<any>(slug, async () => {
        const r = await fetch(`/api/lesson/${encodeURIComponent(slug)}/player`, { credentials: 'include' });
        if (r.status === 200) return r.json();
        if (r.status === 401) { setPlayerErr('unauthenticated'); throw new Error('unauthenticated'); }
        if (r.status === 403) { setPlayerErr('forbidden'); throw new Error('forbidden'); }
        setPlayerErr('error'); throw new Error('error');
      })
        .then((j) => { if (!alive) return; setPlayer(j); setPlayerCached(slug, j); })
        .catch(() => {});
    }
    }
    // Try static guest JSON from CDN (free lessons)
    // Avoid 404 noise by checking index first and only fetching when available.
    try {
      const cached = (typeof window !== 'undefined') ? (window as any).__ems_free_index as Map<string,string> | undefined : undefined;
      const ensureIndex = async (): Promise<Map<string,string>> => {
        if (cached && cached.size) return cached;
        try {
          const r = await fetch('/free-lessons/v1/index.json', { cache: 'force-cache' });
          if (!r.ok) return new Map();
          const j = await r.json().catch(() => ({} as any));
          const map = new Map<string,string>();
          if (Array.isArray(j?.lessons)) {
            for (const x of j.lessons) { const s = String(x.slug); const h = String(x.hash||''); map.set(s, h); }
          }
          if (typeof window !== 'undefined') (window as any).__ems_free_index = map;
          return map;
        } catch { return new Map(); }
      };
      ensureIndex()
        .then((idx) => {
          if (!alive) return;
          const h = idx.get(slug);
          if (h !== undefined) {
            const v = h ? `?v=${encodeURIComponent(h)}` : '';
            fetch(`/free-lessons/v1/${encodeURIComponent(slug)}.json${v}`, { cache: 'force-cache' })
              .then(async (r) => { if (!alive) return; if (r.ok) setGuest(await r.json()); })
              .catch(() => {});
          }
        })
        .catch(() => {});
    } catch {}
    return () => { alive = false; };
  }, [slug]);

  

  // Reflect server progress (when logged in) into local UI state
  useEffect(() => {
    try {
      const lid = Number(bundle?.lesson?.id || 0);
      const done = !!(lid && (bundle as any)?.progress?.lessons?.[lid]?.completed_at);
      setCompleted(done);
    } catch {}
  }, [bundle]);

  // Fake UI data (no network calls)
  const course = useMemo(() => ({ slug: String((bundle?.course?.slug ?? guest?.course?.slug) || 'course'), title: String((bundle?.course?.title ?? guest?.course?.title) || 'Course') }), [bundle, guest]);
  const chapter = useMemo(() => ({ slug: String((bundle?.chapter?.slug ?? guest?.chapter?.slug) || 'chapter'), title: String((bundle?.chapter?.title ?? guest?.chapter?.title) || 'Chapter') }), [bundle, guest]);
  const lessonTitle = useMemo(() => String((bundle?.lesson?.title ?? guest?.lesson?.title) || 'Lesson'), [bundle, guest]);
  const [chapterSummary, setChapterSummary] = useState<any | null>(null);
  const [chapterSummaryErr, setChapterSummaryErr] = useState<string | null>(null);
  const lessonProgress = { completed: false, qCorrect: 3, qTotal: 10, lessonPct: 30 };

  // Fetch chapter summary once (authed only), cache in localStorage for a few minutes
  useEffect(() => {
    const chSlug = (bundle?.chapter?.slug || guest?.chapter?.slug) as string | undefined;
    const hasAuth = typeof document !== 'undefined' && /(?:^|; )(__Secure-next-auth\.session-token|next-auth\.session-token)=/.test(document.cookie);
    if (!chSlug || !hasAuth) { setChapterSummary(null); return; }
    const key = `ems:chapter:summary:${chSlug}`;
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const j = JSON.parse(cached);
        if (Date.now() - (j.v || 0) < 3 * 60 * 1000) setChapterSummary(j.data);
      }
    } catch {}
    fetch(`/api/chapter/${encodeURIComponent(chSlug)}/summary`, { credentials: 'include' })
      .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); const j = await r.json(); setChapterSummary(j); try { localStorage.setItem(key, JSON.stringify({ v: Date.now(), data: j })); } catch {} })
      .catch(() => setChapterSummaryErr('error'));
  }, [bundle?.chapter?.slug, guest?.chapter?.slug]);

  // Skeleton: questions relevant to this lesson only
  const lessonId = useMemo(() => Number((bundle?.lesson?.id ?? guest?.lesson?.id) || 0), [bundle, guest]);
  const relevantQuestions = useMemo<LessonQuestionItem[]>(() => {
    let arr: any[] = [];
    if (bundle?.questionsByLesson && lessonId) arr = bundle.questionsByLesson[String(lessonId)] || [];
    else if (guest?.questionsByLesson && lessonId) arr = guest.questionsByLesson[String(lessonId)] || [];
    else if (guest?.questions) arr = guest.questions || [];
    if (!arr.length) return [];
    const qProg: Record<string, any> = (bundle?.progress?.questions || {}) as any;
    return arr.map((q: any, i: number): LessonQuestionItem => {
      const st = qProg && qProg[q.id]?.status;
      const status = st === 'correct' ? 'correct' : st === 'incorrect' ? 'incorrect' : 'todo';
      return { id: String(q.id), title: String(q.prompt || q.text || `Q${i+1}`), status };
    });
  }, [bundle, guest, lessonId]);
  const qTotal = relevantQuestions.length;
  const qCorrect = relevantQuestions.filter((q) => q.status === 'correct').length;
  const lessonsList = useMemo(() => (bundle?.lessons || guest?.lessons || []) as any[], [bundle, guest]);
  const currentIdxInLessons = useMemo(() => lessonsList.findIndex((l)=> Number(l.id) === lessonId), [lessonsList, lessonId]);
  const chapterDotsCount = 1 + (lessonsList?.length || 0);
  const activeDot = Math.max(0, currentIdxInLessons >= 0 ? currentIdxInLessons + 1 : 0);

  const chapterPct = useMemo(() => {
    const totalQ = chapterSummary ? Object.values<any>(chapterSummary.summary?.byLesson || {}).reduce((a:any,b:any)=>a+Number(b.total||0),0) : (guest?.questionsByLesson ? Object.values<any>(guest.questionsByLesson).reduce((a:any,b:any)=>a+((b as any[]).length||0), 0) : 0);
    const correct = chapterSummary ? Object.values<any>(chapterSummary.summary?.byLesson || {}).reduce((a:any,b:any)=>a+Number(b.correct||0),0) : 0;
    const lessonsDone = chapterSummary ? (chapterSummary.summary?.lessonsCompleted?.length || 0) : 0;
    const p1 = totalQ>0 ? (correct/totalQ) : 0;
    const p2 = lessonsList.length>0 ? (lessonsDone/lessonsList.length) : 0;
    return Math.round((p1 + p2) * 50);
  }, [chapterSummary, guest, lessonsList]);

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
              <div className="mt-1 text-[10px] opacity-90">Chapter progress: ${(function(){})()}</div>
            </div>

            {/* Credits row */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-white/90">
              <span>Author – <span className="font-semibold">{(bundle as any)?.authors?.author || (guest as any)?.authors?.author || '—'}</span></span>
              <span className="opacity-80">·</span>
              <span>Reviewed by – <span className="font-semibold">{(bundle as any)?.authors?.reviewer || (guest as any)?.authors?.reviewer || '—'}</span></span>
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
              disabled={!authed || !bundle?.lesson?.courseId || !bundle?.lesson?.id}
              onClick={() => {
                if (!authed) return;
                if (bundle?.lesson?.courseId && bundle?.lesson?.id) {
                  try {
                    if (completed) {
                      StudyStore.removeLessonComplete(Number(bundle.lesson.courseId), Number(bundle.lesson.id));
                      setCompleted(false);
                    } else {
                      StudyStore.addLessonComplete(Number(bundle.lesson.courseId), Number(bundle.lesson.id));
                      setCompleted(true);
                    }
                  } catch {}
                }
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${!authed ? 'bg-white/10 text-white/60 ring-white/25 cursor-not-allowed' : (completed ? 'bg-emerald-100 text-emerald-700 ring-emerald-300 hover:bg-emerald-100' : 'bg-white/20 text-white/90 ring-white/40 hover:bg-white/30')}`}
              title={!authed ? 'Log in to track progress' : (completed ? 'Click to undo completion' : 'Mark this lesson complete')}
            >
              {!authed ? 'Login to complete' : (completed ? 'Completed (Undo)' : 'Mark as complete')}
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
          chapterCount={chapterDotsCount}
          activeStep={activeDot}
        />
      </div>

      {/* Content area */}
      <div className={`mt-4 grid gap-4 ${focusMode ? '' : 'lg:grid-cols-[280px_1fr_320px]'}`}>
        {/* Left: Chapter progress */}
        {!focusMode && (
          <aside className="order-first space-y-3">
            {/* Flashcards (Coming soon overlay) */}
            <div className="relative overflow-hidden rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-[12px] font-semibold text-indigo-900">Flashcards</div>
              <div className="mt-2 opacity-40 pointer-events-none select-none">
                <FlashcardsCTA count={10} tags={["hematology", "coagulation", "DIC"]} onStart={() => {}} />
              </div>
              <div className="absolute inset-0 grid place-items-center backdrop-blur-sm bg-white/40">
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">Coming soon</span>
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
          {/* Video embed */}
          <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-black/5">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              {((() => { const p = player?.iframeSrc; if (p) return p; const g = guest?.player?.iframeSrc; if (g) return g; const h = guest?.html || ""; const m = h.match(/<iframe[^>]*src=\"([^\"]+)\"/i); if (m?.[1]) return m[1]; const y = h.match(/https?:\\/\\/(?:www\\.)?(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([A-Za-z0-9_-]+)/i); if (y?.[1]) return `https://www.youtube-nocookie.com/embed/${y[1]}`; return ""; })()) ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={((() => { const p = player?.iframeSrc; if (p) return p; const g = guest?.player?.iframeSrc; if (g) return g; const h = guest?.html || ""; const m = h.match(/<iframe[^>]*src=\"([^\"]+)\"/i); if (m?.[1]) return m[1]; const y = h.match(/https?:\\/\\/(?:www\\.)?(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([A-Za-z0-9_-]+)/i); if (y?.[1]) return `https://www.youtube-nocookie.com/embed/${y[1]}`; return ""; })()) as string}
                  title="Lesson video"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  style={{ border: 0 }}
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gray-100 text-gray-500">No video</div>
              )}
              {player?.locked && (
                <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-sm">
                  <div className="rounded-xl border bg-white p-4 text-center shadow ring-1 ring-black/5">
                    <div className="text-sm font-semibold text-gray-900">Locked</div>
                    <div className="text-xs text-gray-600">{player?.lockReason || 'Login and enroll to watch this video.'}</div>
                  </div>
                </div>
              )}
              {((() => { const p = player?.iframeSrc; if (p) return p; const g = guest?.player?.iframeSrc; if (g) return g; const h = guest?.html || ""; const m = h.match(/<iframe[^>]*src=\"([^\"]+)\"/i); if (m?.[1]) return m[1]; const y = h.match(/https?:\\/\\/(?:www\\.)?(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([A-Za-z0-9_-]+)/i); if (y?.[1]) return `https://www.youtube-nocookie.com/embed/${y[1]}`; return ""; })()) && (
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-xs opacity-90">{course.title}</div>
                  <div className="text-lg font-semibold">{lessonTitle}</div>
                </div>
              )}
            </div>
          </div>

          {/* Learn tab — render lesson HTML body */}
          {tab === "learn" && (
            <div className="rounded-2xl border bg-white p-6 text-sm shadow-sm ring-1 ring-black/5">
              <LessonBody slug={slug} html={guest?.html} />
            </div>
          )}

          {/* Practice tab — shows bundled questions when available */}
          {tab === "practice" && (
            <div className="rounded-2xl border bg-white p-6 text-sm shadow-sm ring-1 ring-black/5">
              <div className="mb-2 text-sm font-semibold text-indigo-900">Practice</div>
              {!bundle && !bundleErr && <p className="text-gray-700">Loading questions…</p>}
              {bundleErr === 'unauthenticated' && !guest && (
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
                        {bundle ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { try { StudyStore.addQuestionStatus(Number(bundle?.lesson?.courseId||0), Number(q.id), 'correct'); } catch {}; }}
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${q.status==='correct' ? 'bg-emerald-600 text-white ring-emerald-700' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}`}
                            >Correct</button>
                            <button
                              onClick={() => { try { StudyStore.addQuestionStatus(Number(bundle?.lesson?.courseId||0), Number(q.id), 'incorrect'); } catch {}; }}
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${q.status==='incorrect' ? 'bg-rose-600 text-white ring-rose-700' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}
                            >Review</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-gray-500" title="Log in to practice">Login to practice</div>
                        )}
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
            <div className="relative rounded-2xl border bg-white p-2 shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="p-2 text-sm font-semibold text-indigo-900">Glossary</div>
              <div className="h-28 opacity-30" />
              <div className="absolute inset-0 grid place-items-center backdrop-blur-sm bg-white/60">
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">Coming soon</span>
              </div>
            </div>
            <div className="relative rounded-2xl border bg-white p-2 shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="p-2 text-sm font-semibold text-indigo-900">Concept check</div>
              <div className="h-24 opacity-30" />
              <div className="absolute inset-0 grid place-items-center backdrop-blur-sm bg-white/60">
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">Coming soon</span>
              </div>
            </div>
            <div id="uni-resources" className="relative rounded-2xl border bg-white p-2 shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="p-2 text-sm font-semibold text-indigo-900">University Resources</div>
              <div className="h-24 opacity-30" />
              <div className="absolute inset-0 grid place-items-center backdrop-blur-sm bg-white/60">
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">Coming soon</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom nav for Learn/Practice/Notes (skeleton) */}
      <div className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 gap-1 border-t bg-white p-2 shadow md:hidden">
        {(['learn','practice','background'] as const).map((m) => (
          <button key={m} onClick={() => setTab(m)} className={`h-11 rounded-xl text-sm font-semibold ${tab===m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>{m}</button>
        ))}
      </div>

      {/* Save dock */}
      <SaveDock courseId={Number(bundle?.lesson?.courseId || 0)} />
    </div>
  );
}





              <div className="mt-1 text-[10px] opacity-90">Chapter progress: ${chapterPct}%</div>
