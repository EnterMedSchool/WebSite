"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getBundleCached, setBundleCached, getPlayerCached, setPlayerCached, fetchBundleDedupe, fetchPlayerDedupe } from "@/lib/study/cache";
import { StudyStore } from "@/lib/study/store";
import type { MCQ } from "@/components/lesson/MCQPanel";
import { LessonPageContext, type LessonPageContextValue, type LessonQuestionItem, type QStatus } from "@/components/lesson/context";

const MobileLessonShell = dynamic(() => import("@/components/lesson/mobile/MobileLessonShell"));
const DesktopLessonShell = dynamic(() => import("@/components/lesson/desktop/DesktopLessonShell"));
export default function LessonPage() {
  const { slug: rawSlug } = useParams() as { slug?: string | string[] };
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
  // Viewport detection for mobile-only experience
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return window.matchMedia('(max-width: 768px)').matches; } catch { return false; }
  });
  useEffect(() => {
    try {
      const mql = window.matchMedia('(max-width: 768px)');
      const on = () => setIsMobile(mql.matches);
      on();
      mql.addEventListener?.('change', on);
      return () => { mql.removeEventListener?.('change', on); };
    } catch {}
  }, []);
  useEffect(() => {
    let alive = true;
    setBundle(null); setBundleErr(null); setGuest(null);
    const hasAuth = typeof window !== 'undefined' ? !!(window as any).__ems_authed : false;
    setAuthed(hasAuth);
    // If we recently got denied for this slug, avoid hammering the API for ~10 minutes
    const deniedPaid = (() => {
      try {
        if (typeof document === 'undefined') return false;
        const name = `ems_paid_denied_l_${slug}`;
        return new RegExp(`(?:^|;\\s*)${name}=`).test(document.cookie);
      } catch { return false; }
    })();

    const precheckAndRun = async () => {
      if (!hasAuth) return;
      if (deniedPaid) {
        setBundleErr('forbidden');
        setPlayerErr('forbidden');
        try { setPlayer({ provider: null, iframeSrc: null, locked: true, lockReason: 'paid_course', source: 'client' } as any); } catch {}
        return;
      }
      const cachedP = getPlayerCached(slug, 0) as any;
      if (cachedP) {
        setPlayer(cachedP);
      } else {
        setPlayer(null);
      }
      setPlayerErr(null);
      const loadPlayer = () => {
        fetchPlayerDedupe(slug, async () => {
          const r = await fetch(`/api/lesson/${encodeURIComponent(slug)}/player`, { credentials: 'include', cache: 'no-store' });
          if (r.status === 200) return r.json();
          if (r.status === 401) { setPlayerErr('unauthenticated'); throw new Error('unauthenticated'); }
          if (r.status === 403) {
            setPlayerErr('forbidden');
            try { document.cookie = `ems_paid_denied_l_${slug}=1; Max-Age=600; Path=/`; } catch {}
            throw new Error('forbidden');
          }
          setPlayerErr('error'); throw new Error('error');
        })
          .then((j) => { if (!alive) return; setPlayer(j); setPlayerCached(slug, j); })
          .catch(() => {});
      };
      fetchBundleDedupe(slug, async () => {
        const r = await fetch(`/api/lesson/${encodeURIComponent(slug)}/bundle?scope=chapter&include=player,body`, { credentials: 'include' });
        if (r.status === 200) return r.json();
        if (r.status === 401) { setBundleErr('unauthenticated'); throw new Error('unauthenticated'); }
        if (r.status === 403) {
          setBundleErr('forbidden');
          try { document.cookie = `ems_paid_denied_l_${slug}=1; Max-Age=600; Path=/`; } catch {}
          throw new Error('forbidden');
        }
        setBundleErr('error'); throw new Error('error');
      })
        .then((j) => {
          if (!alive) return;
          setBundle(j);
          setBundleCached(slug, j);
          if (j?.player) {
            setPlayer(j.player);
            setPlayerCached(slug, j.player);
          } else if (!cachedP) {
            loadPlayer();
          }
        })
        .catch(() => {
          if (!alive) return;
          setBundleErr((e) => e || 'error');
          if (!cachedP) {
            loadPlayer();
          }
        });
    };
    precheckAndRun();
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
        const hash = idx.get(slug);
        const hasEntry = idx.has(slug);
        const version = hash ? `?v=${encodeURIComponent(hash)}` : '';
        const tryLoad = async (path: string) => {
          try {
            const res = await fetch(path, { cache: 'force-cache' });
            if (res.ok) { setGuest(await res.json()); return true; }
          } catch {}
          return false;
        };
        if (hasEntry) {
          if (await tryLoad(`/free-lessons/v1/lite/${encodeURIComponent(slug)}.json${version}`)) return;
          if (await tryLoad(`/free-lessons/v1/${encodeURIComponent(slug)}.json${version}`)) return;
        }
        await tryLoad(`/free-lessons/v1/${encodeURIComponent(slug)}.json`);
      };
      ensureIndex().then((idx) => { if (!alive) return; loadGuest(idx); }).catch(() => { 
        // As a final fallback, try direct without index
        fetch(`/free-lessons/v1/${encodeURIComponent(slug)}.json`, { cache: 'force-cache' }).then(async (r) => { if (r.ok) setGuest(await r.json()); }).catch(()=>{});
      });
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
    void pendingVersion; // re-run when local pending progress changes
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
  }, [bundle, guest, lessonId, pendingVersion, authed]) as LessonQuestionItem[];
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

  // Build richer tooltips for the mini path and a lessons menu for quick nav
  const byLessonMap = useMemo(() => {
    const m = (chapterSummary && ((chapterSummary as any).byLesson || (chapterSummary as any).summary?.byLesson)) as Record<string, any> | undefined;
    return m || {};
  }, [chapterSummary]);
  const completedIdSet = useMemo(() => {
    const ids: number[] = ((chapterSummary && (((chapterSummary as any).lessonsCompleted || (chapterSummary as any).summary?.lessonsCompleted) as number[])) || []) as number[];
    return new Set<number>(ids.map((n) => Number(n)));
  }, [chapterSummary]);
  const chapterLabelsDetailed = useMemo(() => {
    const arr: string[] = [];
    try {
      arr.push(`${String(chapter.title || 'Chapter')} - ${Number(chapterQCorrect||0)}/${Number(chapterQTotal||0)} correct across ${Math.max(0, lessonsList.length)} lessons`);
    } catch { arr.push(String(chapter.title || 'Chapter')); }
    for (const l of lessonsList as any[]) {
      const s = byLessonMap[String(Number(l.id))] || {};
      const q = Number(s.total || 0);
      const done = completedIdSet.has(Number(l.id));
      arr.push(`${String(l.title)} - ${done ? 'Done' : 'To do'} - ${q} questions`);
    }
    return arr;
  }, [chapter.title, lessonsList, byLessonMap, completedIdSet, chapterQTotal, chapterQCorrect]);

  const chapterLessonMenu = useMemo(() => {
    return (lessonsList as any[]).map((l) => ({
      title: String(l.title),
      href: `/lesson/${String(l.slug)}`,
      total: Number((byLessonMap[String(Number(l.id))] || {}).total || 0),
      done: completedIdSet.has(Number(l.id)),
      current: Number(l.id) === Number(lessonId),
    }));
  }, [lessonsList, byLessonMap, completedIdSet, lessonId]);

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

  const authors = useMemo(() => ({
    author: ((bundle as any)?.authors?.author ?? (guest as any)?.authors?.author) || '',
    reviewer: ((bundle as any)?.authors?.reviewer ?? (guest as any)?.authors?.reviewer) || '',
  }), [bundle, guest]);

  const chapterLabels = useMemo(() => [
    String(chapter.title || 'Chapter'),
    ...lessonsList.map((l: any) => String(l.title)),
  ], [chapter.title, lessonsList]);

  const chapterLessonsTotal = lessonsList.length;
  const canToggleCompleted = authed && Boolean(bundle?.lesson?.courseId && bundle?.lesson?.id);

  const toggleCompleted = useCallback(() => {
    if (!canToggleCompleted || !bundle?.lesson?.courseId || !bundle?.lesson?.id) return;
    try {
      if (completed) {
        StudyStore.removeLessonComplete(Number(bundle.lesson.courseId), Number(bundle.lesson.id));
        setCompleted(false);
      } else {
        StudyStore.addLessonComplete(Number(bundle.lesson.courseId), Number(bundle.lesson.id));
        setCompleted(true);
      }
    } catch {}
  }, [canToggleCompleted, completed, bundle]);

  const toggleFavorite = useCallback(() => setFav((value) => !value), []);
  const openFlashcards = useCallback(() => setFlashcardsOpen(true), []);
  const closeFlashcards = useCallback(() => setFlashcardsOpen(false), []);
  const toggleFocusMode = useCallback(() => setFocusMode((value) => !value), []);

  const openPracticeAll = useCallback(() => {
    setTab('practice');
    setPracticeAll(true);
    setOpenQuestionId(null);
  }, []);

  const openPracticeQuestion = useCallback((id: number) => {
    setTab('practice');
    setPracticeAll(false);
    setOpenQuestionId(id);
  }, []);

  const onAnswerQuestion = useCallback((qid: number, status: QStatus) => {
    if (!courseIdNum) return;
    if (status !== 'correct' && status !== 'incorrect') return;
    try {
      StudyStore.addQuestionStatus(courseIdNum, qid, status);
    } catch {}
  }, [courseIdNum]);

  const bundleHasQuestions = Boolean(bundle && mcqs.length > 0);
  const canPractice = authed && bundleHasQuestions;

  const contextValue: LessonPageContextValue = {
    slug,
    authed,
    tab,
    setTab,
    focusMode,
    toggleFocusMode,
    completed,
    canToggleCompleted,
    toggleCompleted,
    fav,
    toggleFavorite,
    flashcardsOpen,
    openFlashcards,
    closeFlashcards,
    bundle,
    bundleErr,
    player,
    playerErr,
    guest,
    course,
    chapter,
    lessonTitle,
    bodyHtml,
    authors,
    chapterSummary,
    chapterSummaryErr,
    lessonsList,
    chapterDotsCount,
    activeDot,
    chapterCompletedList,
    chapterLabels,
    chapterLabelsDetailed,
    chapterLessonMenu,
    chapterQTotal,
    chapterQCorrect,
    chapterLessonsDone,
    chapterLessonsTotal,
    chapterPctUnits,
    qCorrect,
    relevantQuestions,
    effectiveIframeSrc,
    courseIdNum,
    mcqs,
    initialStatus,
    practiceAll,
    setPracticeAll,
    openQuestionId,
    setOpenQuestionId,
    openPracticeAll,
    openPracticeQuestion,
    onAnswerQuestion,
    bundleHasQuestions,
    canPractice,
    saveDockCourseId: Number(bundle?.lesson?.courseId || 0),
  };

  if (isMobile) {
    return (
      <LessonPageContext.Provider value={contextValue}>
        <MobileLessonShell />
      </LessonPageContext.Provider>
    );
  }

  return (
    <LessonPageContext.Provider value={contextValue}>
      <DesktopLessonShell />
    </LessonPageContext.Provider>
  );
}
