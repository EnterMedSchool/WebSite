"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import LessonBody from "@/components/lesson/LessonBody";
// import AnkiDownload from "@/components/lesson/AnkiDownload";
import FlashcardsCTA from "@/components/lesson/FlashcardsCTA";
import ConceptChecklist from "@/components/lesson/ConceptChecklist";
import BackgroundMap from "@/components/lesson/BackgroundMap";
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

  // Mobile-specific presentation (separate UI, same underlying state)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] pb-24">
        <FlashcardsWidget open={flashcardsOpen} onClose={() => setFlashcardsOpen(false)} deck={dicDeck} title="DIC Review" />
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-10 pb-28">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
              <a href={`/${course.slug}`} className="text-slate-500 hover:text-slate-700">{course.title}</a>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <a href={`/${course.slug}/${chapter.slug}`} className="text-slate-500 hover:text-slate-700">{chapter.title}</a>
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900">{lessonTitle}</h1>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                <span>Chapter progress</span>
                <span>{chapterPctUnits}%</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-indigo-600" style={{ width: `${Math.max(0, Math.min(100, chapterPctUnits))}%` }} />
              </div>
              <div className="mt-3 text-sm font-medium text-slate-700">{chapterLessonsDone} lessons done &bull; {chapterQCorrect}/{chapterQTotal} questions correct</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => setTab('learn')} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-400/30 transition hover:bg-slate-800">
                Start lesson
              </button>
              <button type="button" onClick={() => setFav((v) => !v)} className={`inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold transition ${fav ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 hover:bg-slate-50'}`} aria-pressed={fav} title={fav ? 'Remove from saved lessons' : 'Save this lesson'}>
                {fav ? 'Saved' : 'Save for later'}
              </button>
              <button
                type="button"
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
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${!authed ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : (completed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}`}
                title={!authed ? 'Log in to track progress' : (completed ? 'Mark as not complete' : 'Mark this lesson complete')}
              >
                {!authed ? 'Login required' : (completed ? 'Completed' : 'Mark complete')}
              </button>
            </div>
            <div className="mt-4 text-xs text-slate-600">
              <div>Author <span className="font-medium text-slate-800">{(bundle as any)?.authors?.author || (guest as any)?.authors?.author || ''}</span></div>
              <div>Reviewed by <span className="font-medium text-slate-800">{(bundle as any)?.authors?.reviewer || (guest as any)?.authors?.reviewer || ''}</span></div>
            </div>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
            <StudyToolbar
              mode={tab}
              onMode={(m) => setTab(m)}
              onFocusToggle={() => setFocusMode((v) => !v)}
              focus={focusMode}
              chapterCount={chapterDotsCount}
              activeStep={activeDot}
              chapterLabels={[String(chapter.title || 'Chapter'), ...lessonsList.map((l: any) => String(l.title))]}
              chapterCompleted={chapterCompletedList}
            />
          </section>
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm">
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
                <div className="absolute inset-0 grid place-items-center bg-slate-100 text-sm font-semibold text-slate-500">No video available</div>
              )}
              {player?.locked && (
                <div className="absolute inset-0 grid place-items-center bg-white/85 backdrop-blur">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-600 shadow-sm">
                    {player?.lockReason || 'Login and enroll to watch this video.'}
                  </div>
                </div>
              )}
            </div>
          </section>
          {authed && (
            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <header className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Question progress</div>
                <button
                  type="button"
                  onClick={() => { setTab('practice'); setPracticeAll(true); setOpenQuestionId(null); }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Practice all
                </button>
              </header>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="truncate text-xs font-semibold text-slate-700">Relevant to: {lessonTitle}</div>
                <div className="mt-1 text-xs text-slate-600">{qCorrect}/{relevantQuestions.length} correct &bull; {Math.max(0, relevantQuestions.length - qCorrect)} remaining</div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: `${Math.round((qCorrect / Math.max(1, relevantQuestions.length)) * 100)}%` }} />
                </div>
              </div>
              {relevantQuestions.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {relevantQuestions.map((q, i) => {
                    const state =
                      q.status === 'correct'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : q.status === 'incorrect'
                          ? 'border-rose-200 bg-rose-50 text-rose-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/80';
                    const label = q.status === 'correct' ? 'Correct' : q.status === 'incorrect' ? 'Review' : 'To do';
                    return (
                      <li key={q.id}>
                        <button
                          type="button"
                          onClick={() => { setTab('practice'); setPracticeAll(false); setOpenQuestionId(Number(q.id)); }}
                          className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${state}`}
                        >
                          <span className="mt-0.5 text-xs font-semibold text-slate-500">{i + 1}</span>
                          <div className="flex-1 space-y-1">
                            <div className="truncate">{q.title}</div>
                            <span className="inline-flex rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{label}</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
          {tab === 'learn' && (
            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-sm shadow-sm">
              {bodyHtml ? (
                <LessonBody slug={slug} html={bodyHtml} noApi={!authed} />
              ) : (
                <div className="space-y-3 text-slate-500">Loading lesson...</div>
              )}
            </section>
          )}
          {tab === 'practice' && (
            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-sm shadow-sm">
              {bundle && mcqs.length > 0 ? (
                <MCQPanel
                  courseId={courseIdNum}
                  questions={mcqs}
                  initialStatus={initialStatus}
                  openAll={practiceAll}
                  openOnlyId={openQuestionId}
                  disabled={!authed}
                  onAnswer={(qid, st) => { try { if (courseIdNum) StudyStore.addQuestionStatus(courseIdNum, qid, st); } catch {} }}
                />
              ) : (
                <p className="text-slate-600">{bundleErr === 'unauthenticated' ? 'Log in to practice.' : 'Loading questions...'}</p>
              )}
            </section>
          )}
          {tab === 'background' && (
            <section className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-sm shadow-sm">
                <div className="text-sm font-semibold text-slate-800">Background knowledge</div>
                <p className="mt-1 text-slate-600">Relevant foundations and reference material will appear here.</p>
              </div>
              <BackgroundMap comingSoon />
            </section>
          )}
        </div>
        <div className="lesson-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-inner md:hidden">
          <div className="grid grid-cols-3 gap-2">
            {(['learn', 'practice', 'background'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTab(m)}
                className={`h-10 rounded-full text-sm font-semibold transition ${tab === m ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <SaveDock courseId={Number(bundle?.lesson?.courseId || 0)} />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-24">
      <FlashcardsWidget open={flashcardsOpen} onClose={() => setFlashcardsOpen(false)} deck={dicDeck} title="DIC Review" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-14 lg:px-6">
        <section className="rounded-[32px] border border-slate-200 bg-white/95 px-8 py-10 shadow-sm">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                <a href={`/${course.slug}`} className="text-slate-500 hover:text-slate-700">{course.title}</a>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <a href={`/${course.slug}/${chapter.slug}`} className="text-slate-500 hover:text-slate-700">{chapter.title}</a>
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-900">{lessonTitle}</h1>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Progress</div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-indigo-600" style={{ width: `${Math.max(0, Math.min(100, chapterPctUnits))}%` }} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">{chapterPctUnits}% of chapter complete</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Accuracy</div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{chapterQCorrect}/{chapterQTotal}</p>
                  <p className="text-xs text-slate-600">Questions answered correctly across the chapter.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Lesson status</div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{completed ? 'Completed' : 'In progress'}</p>
                  <p className="text-xs text-slate-600">Track your place and pick up where you left off.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div>Author <span className="font-medium text-slate-800">{(bundle as any)?.authors?.author || (guest as any)?.authors?.author || ''}</span></div>
                <div className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline" />
                <div>Reviewed by <span className="font-medium text-slate-800">{(bundle as any)?.authors?.reviewer || (guest as any)?.authors?.reviewer || ''}</span></div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setTab('learn')}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-400/30 transition hover:bg-slate-800"
              >
                Start lesson
              </button>
              <button
                type="button"
                onClick={() => setFav((v) => !v)}
                className={`inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold transition ${fav ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                aria-pressed={fav}
                title={fav ? 'Remove from saved lessons' : 'Save this lesson'}
              >
                {fav ? 'Saved' : 'Save for later'}
              </button>
              <button
                type="button"
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
                className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${!authed ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : (completed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}`}
                title={!authed ? 'Log in to track progress' : (completed ? 'Mark as not complete' : 'Mark this lesson complete')}
              >
                {!authed ? 'Login required' : (completed ? 'Completed' : 'Mark complete')}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white/95 px-6 py-4 shadow-sm">
          <StudyToolbar
            mode={tab}
            onMode={(m) => setTab(m)}
            onFocusToggle={() => setFocusMode((v) => !v)}
            focus={focusMode}
            softLockPractice={false}
            chapterCount={chapterDotsCount}
            activeStep={activeDot}
            chapterLabels={chapterLabelsDetailed}
            chapterCompleted={chapterCompletedList}
            lessonMenu={chapterLessonMenu}
          />
        </section>

        <div className={`grid gap-6 ${focusMode ? '' : 'xl:grid-cols-[260px_minmax(0,1fr)_260px]'}`}>
          {!focusMode && (
            <aside className="hidden xl:flex flex-col gap-5">
              <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Lesson snapshot</div>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="text-sm font-semibold text-slate-700">Chapter progress</div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: `${Math.max(0, Math.min(100, chapterPctUnits))}%` }} />
                  </div>
                  <div className="mt-3 text-xs text-slate-600">{chapterLessonsDone} lessons complete &bull; {chapterQCorrect}/{chapterQTotal} correct</div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>Status</span><span className="font-medium text-slate-800">{completed ? 'Completed' : 'In progress'}</span></div>
                  <div className="flex items-center justify-between"><span>Relevant questions</span><span className="font-medium text-slate-800">{relevantQuestions.length || '0'}</span></div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Flashcards</div>
                <p className="mt-2 text-sm text-slate-600">Reinforce this lesson with a 10-card micro deck.</p>
                <button
                  type="button"
                  onClick={() => setFlashcardsOpen(true)}
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Open deck
                </button>
              </div>
              {authed && (
                <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Question progress</div>
                    <button
                      type="button"
                      onClick={() => { setTab('practice'); setPracticeAll(true); setOpenQuestionId(null); }}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Practice all
                    </button>
                  </div>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="truncate text-xs font-semibold text-slate-700">Relevant to: {lessonTitle}</div>
                    <div className="mt-1 text-xs text-slate-600">{qCorrect}/{relevantQuestions.length} correct &bull; {Math.max(0, relevantQuestions.length - qCorrect)} remaining</div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: `${Math.round((qCorrect / Math.max(1, relevantQuestions.length)) * 100)}%` }} />
                    </div>
                  </div>
                  {relevantQuestions.length > 0 && (
                    <ul className="mt-4 space-y-3">
                      {relevantQuestions.map((q, i) => {
                        const state =
                          q.status === 'correct'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : q.status === 'incorrect'
                              ? 'border-rose-200 bg-rose-50 text-rose-800'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/70';
                        const label = q.status === 'correct' ? 'Correct' : q.status === 'incorrect' ? 'Review' : 'To do';
                        return (
                          <li key={q.id}>
                            <button
                              type="button"
                              onClick={() => { setTab('practice'); setPracticeAll(false); setOpenQuestionId(Number(q.id)); }}
                              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${state}`}
                            >
                              <span className="mt-0.5 text-xs font-semibold text-slate-500">{i + 1}</span>
                              <div className="flex-1 space-y-1">
                                <div className="truncate">{q.title}</div>
                                <span className="inline-flex rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{label}</span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </aside>
          )}

          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
                  <div className="absolute inset-0 grid place-items-center bg-slate-100 text-sm font-semibold text-slate-500">No video available</div>
                )}
                {player?.locked && (
                  <div className="absolute inset-0 grid place-items-center bg-white/85 backdrop-blur">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-600 shadow-sm">
                      {player?.lockReason || 'Login and enroll to watch this video.'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {tab === 'learn' && (
              <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 text-sm shadow-sm">
                {bodyHtml ? (
                  <LessonBody slug={slug} html={bodyHtml} noApi={!authed} />
                ) : (
                  <div className="space-y-4 text-slate-500">
                    <div className="h-5 w-1/3 rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-200" />
                    <div className="h-3 w-5/6 rounded bg-slate-200" />
                    <div className="h-64 w-full rounded-2xl bg-slate-100" />
                  </div>
                )}
              </section>
            )}

            {tab === 'practice' && (
              <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 text-sm shadow-sm">
                <div className="mb-4 text-sm font-semibold text-slate-800">Practice questions</div>
                {!bundle && !bundleErr && <p className="text-slate-600">Loading questions...</p>}
                {bundleErr === 'unauthenticated' && !guest && (
                  <p className="text-slate-600">Log in to see and practice questions.</p>
                )}
                {bundleErr === 'forbidden' && (
                  <p className="text-slate-600">This course is paid. Your account does not have access.</p>
                )}
                {bundle && mcqs.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
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
              </section>
            )}

            {tab === 'background' && (
              <section className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 text-sm shadow-sm">
                  <div className="text-sm font-semibold text-slate-800">Background knowledge</div>
                  <p className="mt-1 text-slate-600">Relevant foundations and reference material will appear here.</p>
                </div>
                <BackgroundMap comingSoon />
              </section>
            )}
          </div>

          {!focusMode && (
            <aside className="hidden xl:flex flex-col gap-5">
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
                <div className="font-semibold text-slate-700">Concept check</div>
                <p className="mt-2">Short review quizzes are being prepared.</p>
              </div>
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
                <div className="font-semibold text-slate-700">University resources</div>
                <p className="mt-2">Curated clinical references will land here soon.</p>
              </div>
            </aside>
          )}
        </div>

        <div className="lesson-bottom-nav fixed inset-x-4 bottom-6 z-30 border border-slate-200 bg-white/95 px-4 py-3 shadow-inner shadow-slate-200/70 lg:hidden">
          <div className="grid grid-cols-3 gap-2">
            {(['learn', 'practice', 'background'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTab(m)}
                className={`h-10 rounded-full border text-sm font-semibold transition ${tab === m ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
      <SaveDock courseId={Number(bundle?.lesson?.courseId || 0)} />
    </div>
  );
}

















