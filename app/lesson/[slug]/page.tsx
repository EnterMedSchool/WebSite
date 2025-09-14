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
import MCQPanel, { type MCQ } from "@/components/lesson/MCQPanel";

type LessonQuestionItem = {
  id: string;
  title: string;
  status: 'todo' | 'correct' | 'incorrect';
};

// Local status alias to keep TSX parsing simple
type QStatus = 'correct' | 'incorrect' | undefined;

export default function LessonPage() {
  const { slug: rawSlug } = useParams();
  const slug = String(rawSlug || "lesson");

  const [tab, setTab] = useState<"learn" | "practice" | "background">("learn");
  const [focusMode, setFocusMode] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [fav, setFav] = useState(false);
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  // Trigger recompute when local pending progress changes (per course)
  const [pendingVersion, setPendingVersion] = useState(0);
  const [authed, setAuthed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).__ems_authed;
  });

  // Lesson bundle (questions + chapter lessons + progress)  requires login
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
    // Always fetch fresh bundle for authed users to reflect latest progress
    let gotPlayerFromBundle = false;
    fetchBundleDedupe(slug, async () => {
      const r = await fetch(`/api/lesson/${encodeURIComponent(slug)}/bundle?scope=chapter&include=player,body`, { credentials: 'include' });
      if (r.status === 200) return r.json();
      if (r.status === 401) { setBundleErr('unauthenticated'); throw new Error('unauthenticated'); }
      if (r.status === 403) { setBundleErr('forbidden'); throw new Error('forbidden'); }
      setBundleErr('error'); throw new Error('error');
    })
      .then((j) => { if (!alive) return; setBundle(j); setBundleCached(slug, j); if (j?.player) { setPlayer(j.player); setPlayerCached(slug, j.player); gotPlayerFromBundle = true; } })
      .catch(() => { if (alive) setBundleErr((e)=> e||'error'); });
    // Player info (iframeSrc / locked)  short TTL cache (60s) due to signed URLs
    setPlayer(null); setPlayerErr(null);
    const cachedP = getPlayerCached(slug, 0) as any;
    if (cachedP) {
      setPlayer(cachedP);
    } else if (!gotPlayerFromBundle) {
      fetchPlayerDedupe(slug, async () => {
        const r = await fetch(`/api/lesson/${encodeURIComponent(slug)}/player`, { credentials: 'include', cache: 'no-store' });
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
    // Prefer the lightweight payloads when available, but gracefully fall back
    // to the non-lite structure currently committed in public/.
    try {
      const cached = (typeof window !== 'undefined') ? (window as any).__ems_free_index_lite as Map<string,string> | undefined : undefined;
      const ensureIndex = async (): Promise<Map<string,string>> => {
        if (cached && cached.size) return cached;
        const buildMap = (j: any) => {
          const map = new Map<string,string>();
          if (Array.isArray(j?.lessons)) {
            for (const x of j.lessons) { const s = String(x.slug); const h = String(x.hash||''); map.set(s, h); }
          }
          return map;
        };
        // Try lite index first
        try {
          const rl = await fetch('/free-lessons/v1/index-lite.json', { cache: 'force-cache' });
          if (rl.ok) {
            const jl = await rl.json().catch(() => ({} as any));
            const map = buildMap(jl);
            if (typeof window !== 'undefined') (window as any).__ems_free_index_lite = map;
            return map;
          }
        } catch {}
        // Fallback to full index
        try {
          const rf = await fetch('/free-lessons/v1/index.json', { cache: 'force-cache' });
          if (!rf.ok) return new Map();
          const jf = await rf.json().catch(() => ({} as any));
          const map = buildMap(jf);
          if (typeof window !== 'undefined') (window as any).__ems_free_index_lite = map;
          return map;
        } catch { return new Map(); }
      };
      const loadGuest = async (idx: Map<string,string>) => {
        const h = idx.get(slug);
        if (h === undefined) return; // slug not found
        const v = h ? `?v=${encodeURIComponent(h)}` : '';
        // Try lite payload first
        try {
          const rl = await fetch(`/free-lessons/v1/lite/${encodeURIComponent(slug)}.json${v}`, { cache: 'force-cache' });
          if (rl.ok) { setGuest(await rl.json()); return; }
        } catch {}
        // Fallback to non-lite payload
        try {
          const rf = await fetch(`/free-lessons/v1/${encodeURIComponent(slug)}.json${v}`, { cache: 'force-cache' });
          if (rf.ok) { setGuest(await rf.json()); return; }
        } catch {}
      };
      ensureIndex().then((idx) => { if (!alive) return; loadGuest(idx); }).catch(() => {});
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
  const bodyHtml = useMemo(() => String(((bundle as any)?.html ?? guest?.html) || ''), [bundle, guest]);
  const [chapterSummary, setChapterSummary] = useState<any | null>(null);
  const [chapterSummaryErr, setChapterSummaryErr] = useState<string | null>(null);
  const lessonProgress = { completed: false, qCorrect: 3, qTotal: 10, lessonPct: 30 };

  // Practice UI state
  const [practiceAll, setPracticeAll] = useState(false);
  const [openQuestionId, setOpenQuestionId] = useState<number | null>(null);

  // Prefer bundle.summary to avoid extra requests; compute fallback locally
  useEffect(() => {
    try {
      // If bundle provides summary, use it directly
      if ((bundle as any)?.summary) { setChapterSummary((bundle as any).summary); return; }
      // Compute minimal summary from questionsByLesson and progress (local overlay included)
      const lessonsArr = (bundle?.lessons || guest?.lessons || []) as any[];
      const byLesson: Record<string, { total: number; correct: number; incorrect: number; attempted: number }> = {};
      for (const l of lessonsArr) byLesson[String(Number(l.id))] = { total: 0, correct: 0, incorrect: 0, attempted: 0 };
      const qbl = (bundle?.questionsByLesson || guest?.questionsByLesson) as Record<string, any[]> | undefined;
      if (qbl) {
        for (const [lid, arr] of Object.entries(qbl as Record<string, any[]>)) {
          if (!byLesson[lid]) byLesson[lid] = { total: 0, correct: 0, incorrect: 0, attempted: 0 };
          byLesson[lid].total = (arr || []).length;
        }
      }
      // Overlay saved + pending question statuses to compute attempted/correct/incorrect
      const courseIdOverlay = Number((bundle?.lesson?.courseId ?? guest?.lesson?.courseId) || 0);
      const saved = ((bundle as any)?.progress?.questions || {}) as Record<number, { status?: 'correct'|'incorrect' }>;
      const pending = courseIdOverlay ? (StudyStore.getPending(courseIdOverlay)?.question_status || []) as [number,'correct'|'incorrect'][] : [];
      const latest = new Map<number,'correct'|'incorrect'>();
      for (const [qidStr, v] of Object.entries(saved)) { const qid = Number(qidStr); if (v?.status) latest.set(qid, v.status); }
      for (const [qid, st] of pending) latest.set(Number(qid), st);
      if (latest.size) {
        // Map qid->lesson id for those we have in this chapter
        const qids = Array.from(latest.keys());
        // Build inverse from local data where possible
        const inv: Record<number, number> = {};
        if (qbl) {
          for (const [lid, arr] of Object.entries(qbl as Record<string, any[]>)) {
            for (const q of (arr || [])) inv[Number(q.id)] = Number(lid);
          }
        }
        for (const [qid, st] of latest) {
          const lid = inv[qid]; if (!lid) continue;
          const s = byLesson[String(lid)] || (byLesson[String(lid)] = { total: 0, correct: 0, incorrect: 0, attempted: 0 });
          if (st === 'correct') { s.correct++; s.attempted++; }
          else if (st === 'incorrect') { s.incorrect++; s.attempted++; }
        }
      }
      const lessonsCompleted = Object.keys(((bundle as any)?.progress?.lessons || {})).map((k)=> Number(k)).filter((id)=> lessonsArr.some((l:any)=> Number(l.id)===id));
      setChapterSummary({ byLesson, lessonsCompleted });
    } catch { setChapterSummary(null); }
  }, [bundle, guest, pendingVersion]);

  // Skeleton: questions relevant to this lesson only
  const lessonId = useMemo(() => Number((bundle?.lesson?.id ?? guest?.lesson?.id) || 0), [bundle, guest]);
  const relevantQuestions = useMemo(() => {
    // Guests: do not expose or compute questions; keep the card blurred only
    if (!authed) return [] as LessonQuestionItem[];
    let arr: any[] = [];
    if (bundle?.questionsByLesson && lessonId) arr = bundle.questionsByLesson[String(lessonId)] || [];
    else if (guest?.questionsByLesson && lessonId) arr = guest.questionsByLesson[String(lessonId)] || [];
    else if (guest?.questions) arr = guest.questions || [];
    if (!arr.length) return [];
    const qProg: Record<string, any> = (bundle?.progress?.questions || {}) as any;
    // Overlay local pending statuses for the course (unsaved, local-first)
    let overlay: Record<number, 'correct'|'incorrect'> = {};
    try {
      const courseIdOverlay = Number((bundle?.lesson?.courseId ?? guest?.lesson?.courseId) || 0);
      if (courseIdOverlay) {
        const pend = StudyStore.getPending(courseIdOverlay);
        for (const [qid, st] of (pend?.question_status || [])) {
          const n = Number(qid);
          if (Number.isFinite(n) && (st === 'correct' || st === 'incorrect')) overlay[n] = st;
        }
      }
    } catch {}
    return arr.map((q: any, i: number): LessonQuestionItem => {
      let st = qProg && qProg[q.id]?.status;
      // Pending overlay wins
      const pending = overlay[Number(q.id)];
      if (pending) st = pending;
      const status = st === 'correct' ? 'correct' : st === 'incorrect' ? 'incorrect' : 'todo';
      return { id: String(q.id), title: String(q.prompt || q.text || `Q${i+1}`), status };
    });
  }, [bundle, guest, lessonId, pendingVersion]) as LessonQuestionItem[];
  const qTotal = relevantQuestions.length;
  const qCorrect = relevantQuestions.filter((q) => q.status === 'correct').length;
  const lessonsList = useMemo(() => (bundle?.lessons || guest?.lessons || []) as any[], [bundle, guest]);
  const currentIdxInLessons = useMemo(() => lessonsList.findIndex((l)=> Number(l.id) === lessonId), [lessonsList, lessonId]);
  const chapterDotsCount = 1 + (lessonsList?.length || 0);
  const activeDot = Math.max(0, currentIdxInLessons >= 0 ? currentIdxInLessons + 1 : 0);

  // Subscribe to StudyStore pending updates (per course) to reflect statuses instantly
  useEffect(() => {
    const courseIdSub = Number((bundle?.lesson?.courseId ?? guest?.lesson?.courseId) || 0);
    if (!courseIdSub) return;
    const unsub = StudyStore.subscribe((cid) => { if (cid === courseIdSub) setPendingVersion((v) => v + 1); });
    return () => { try { if (typeof unsub === 'function') unsub(); } catch {} };
  }, [bundle?.lesson?.courseId, guest?.lesson?.courseId]);

  // Chapter-level progress and question totals across the chapter (exclude the "chapter" dot itself)
  const { chapterQTotal, chapterQCorrect, chapterLessonsDone, chapterPctUnits } = useMemo(() => {
    const byLessonVals = (chapterSummary && (chapterSummary.byLesson || chapterSummary.summary?.byLesson)) ? (Object.values(chapterSummary.byLesson || chapterSummary.summary?.byLesson || {}) as any[]) : [];
    const totalQ = byLessonVals.reduce((a, b) => a + Number(b.total || 0), 0);
    const correct = byLessonVals.reduce((a, b) => a + Number(b.correct || 0), 0);
    const lessonsDone = (chapterSummary && (chapterSummary.lessonsCompleted || chapterSummary.summary?.lessonsCompleted)) ? ((chapterSummary.lessonsCompleted || chapterSummary.summary?.lessonsCompleted) as number[]).length : 0;
    const unitsTotal = (lessonsList.length) + totalQ; // exclude the synthetic chapter dot
    const unitsDone = lessonsDone + correct;
    const pctUnits = unitsTotal > 0 ? Math.round((unitsDone / unitsTotal) * 100) : 0;
    return { chapterQTotal: totalQ, chapterQCorrect: correct, chapterLessonsDone: lessonsDone, chapterPctUnits: pctUnits };
  }, [chapterSummary, lessonsList]);

  // Precompute chapterCompleted flags array for the toolbar
  const chapterCompletedList = useMemo(() => {
    const ids: number[] = ((chapterSummary && (((chapterSummary as any).lessonsCompleted || (chapterSummary as any).summary?.lessonsCompleted) as number[])) || []) as number[];
    return [false, ...lessonsList.map((l: any) => ids.includes(Number(l.id)) )];
  }, [chapterSummary, lessonsList]);

  // Compute effective video iframe src once for simpler JSX below
  // Compute effective iframe src once for simpler JSX below
  const effectiveIframeSrc = useMemo(() => {
    try {
      if (player?.iframeSrc) return String(player.iframeSrc);
      if (guest?.player?.iframeSrc) return String(guest.player.iframeSrc);
      const html = String(guest?.html || "");
      const m = html.match(/<iframe[^>]*\s+src=\"([^\"]+)\"/i);
      if (m?.[1]) return String(m[1]);
      const y = html.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/i);
      if (y?.[1]) return `https://www.youtube-nocookie.com/embed/${y[1]}`;
    } catch {}
    return "";
  }, [player?.iframeSrc, guest?.player?.iframeSrc, guest?.html]);

  // Build MCQ list for the current lesson (authed bundle only)
  const courseIdNum = useMemo(() => Number((bundle?.lesson?.courseId ?? guest?.lesson?.courseId) || 0), [bundle, guest]);
  const mcqs: MCQ[] = useMemo(() => {
    const list: MCQ[] = [];
    const arr = (bundle?.questionsByLesson && lessonId) ? (bundle.questionsByLesson[String(lessonId)] || []) : [];
    for (const q of arr) {
      list.push({ id: Number(q.id), prompt: String(q.prompt||''), choices: (q.choices||[]).map((c:any)=>({ id: Number(c.id), text: String(c.text||c.content||''), correct: typeof c.correct === 'boolean' ? Boolean(c.correct) : undefined })) } as MCQ);
    }
    return list;
  }, [bundle, lessonId]);

  // Initial status comes from bundled compact progress (server)
  const initialStatus = useMemo(() => {
    const m: Record<number, QStatus> = {};
    const p = (bundle as any)?.progress?.questions || {};
    for (const [qid, v] of Object.entries(p as Record<string, any>)) {
      const st = v?.status;
      if (st === 'correct' || st === 'incorrect') m[Number(qid)] = st;
    }
    // Overlay local pending changes for this course
    try {
      if (courseIdNum) {
        const pend = StudyStore.getPending(courseIdNum);
        for (const [qid, st] of pend.question_status || []) {
          if (st === 'correct' || st === 'incorrect') m[Number(qid)] = st;
        }
      }
    } catch {}
    return m;
  }, [bundle, courseIdNum]);

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <FlashcardsWidget open={flashcardsOpen} onClose={() => setFlashcardsOpen(false)} deck={dicDeck} title="DIC Review" />
      {/* Header - UI only */}
      <div className="sticky top-16 z-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-[0_14px_42px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {/* Breadcrumb-like pill with course > chapter (UI only) */}
            <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">
              <a href={`/${course.slug}`} className="opacity-95 hover:underline">{course.title}</a>
              <span className="opacity-80"></span>
              <a href={`/${course.slug}/${chapter.slug}`} className="opacity-95 hover:underline">{chapter.title}</a>
            </div>
            <h1 className="truncate text-3xl font-extrabold tracking-tight sm:text-4xl">{lessonTitle}</h1>

            {/* Compact status + visual bar (chapter-wide) */}
            <div className="mt-3 w-full max-w-md text-[11px] font-medium text-white/90">
              <div className="mb-1">Completed {chapterQCorrect}/{chapterQTotal} questions</div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/25">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-emerald-200 to-white/60" style={{ width: `${Math.max(0, Math.min(100, chapterPctUnits))}%` }} />
              </div>
              <div className="mt-1 text-[10px] opacity-90">Chapter progress: {chapterPctUnits}%</div>
            </div>

            {/* Credits row */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-white/90">
              <span>Author  <span className="font-semibold">{(bundle as any)?.authors?.author || (guest as any)?.authors?.author || ''}</span></span>
              <span className="opacity-80"></span>
              <span>Reviewed by  <span className="font-semibold">{(bundle as any)?.authors?.reviewer || (guest as any)?.authors?.reviewer || ''}</span></span>
              <span className="opacity-80"></span>
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
              {fav ? '' : ''}
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
          chapterLabels={[String(chapter.title || 'Chapter'), ...lessonsList.map((l:any)=> String(l.title))]}
          chapterCompleted={chapterCompletedList}
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
              {!authed && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-sm">
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">Log in to practice questions</span>
                </div>
              )}
            </div>
            <div className="relative rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-[12px] font-semibold text-indigo-900">Question progress</div>

              {/* Lesson summary */}
              <div className="hidden mt-2 rounded-xl bg-indigo-50/60 p-3 ring-1 ring-inset ring-indigo-100">
                <div className="text-xs font-semibold text-indigo-900 truncate">Chapter: {chapter.title}</div>
                <div className="text-[11px] text-indigo-800/70">Intro  35 min read</div>
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
                      <button type="button" onClick={() => { setTab('practice'); setPracticeAll(false); setOpenQuestionId(Number(q.id)); }} className={`mb-2 w-full rounded-xl border px-3 py-2 text-left transition ${cls}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium">{q.title}</div>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${chip}`}>{label}</span>
                          <div className="mt-0.5 text-[11px] text-gray-600">Single best answer  1 point</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {/* Footer actions */}
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setTab('practice'); setPracticeAll(true); setOpenQuestionId(null); }}
                  className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Practice all
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Middle: Main */}
        <div className="space-y-4">
          {/* Video embed */}
          <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-black/5">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              {effectiveIframeSrc ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={effectiveIframeSrc}
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
              {effectiveIframeSrc && (
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-xs opacity-90">{course.title}</div>
                  <div className="text-lg font-semibold">{lessonTitle}</div>
                </div>
              )}
            </div>
          </div>

          {/* Learn tab  render lesson HTML body */}
          {tab === "learn" && (
            <div className="rounded-2xl border bg-white p-6 text-sm shadow-sm ring-1 ring-black/5">
              {!bodyHtml ? (
                <div aria-busy="true" className="relative">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 w-1/3 rounded bg-indigo-100" />
                    <div className="h-3 w-5/6 rounded bg-indigo-50" />
                    <div className="h-3 w-11/12 rounded bg-indigo-50" />
                    <div className="h-3 w-10/12 rounded bg-indigo-50" />
                    <div className="h-64 w-full rounded-xl bg-indigo-50" />
                    <div className="h-3 w-4/5 rounded bg-indigo-50" />
                    <div className="h-3 w-9/12 rounded bg-indigo-50" />
                    <div className="h-3 w-7/12 rounded bg-indigo-50" />
                  </div>
                  <div className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-2 rounded-full bg-indigo-600/90 px-3 py-1 text-xs font-semibold text-white shadow">
                    <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-white [animation-delay:-200ms]" />
                    <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-white [animation-delay:-100ms]" />
                    <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-white" />
                    <span>Loading lesson</span>
                  </div>
                </div>
              ) : (
                <LessonBody slug={slug} html={bodyHtml} noApi={!authed} />
              )}
            </div>
          )}

          {/* Practice tab - shows bundled questions when available */}
          {tab === "practice" && (
            <div className="rounded-2xl border bg-white p-6 text-sm shadow-sm ring-1 ring-black/5">
              <div className="mb-2 text-sm font-semibold text-indigo-900">Practice</div>
              {!bundle && !bundleErr && <p className="text-gray-700">Loading questions</p>}
              {bundleErr === 'unauthenticated' && !guest && (
                <p className="text-gray-700">Log in to see and practice questions.</p>
              )}
              {bundleErr === 'forbidden' && (
                <p className="text-gray-700">This course is paid. Your account doesn&apos;t have access.</p>
              )}
              {bundle && mcqs.length > 0 && (
                <div className="mt-2">
                  <MCQPanel
                    courseId={courseIdNum}
                    questions={mcqs}
                    initialStatus={initialStatus}
                    openAll={practiceAll}
                    openOnlyId={openQuestionId}
                    disabled={!authed}
                    onAnswer={(qid, st) => { try { if (courseIdNum) StudyStore.addQuestionStatus(courseIdNum, qid, st); } catch {} }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Background tab  placeholder only */}
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











