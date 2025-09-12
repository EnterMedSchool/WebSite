"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import VideoPanel from "@/components/lesson/VideoPanel";
import UniResources from "@/components/lesson/UniResources";
import AnkiDownload from "@/components/lesson/AnkiDownload";
import ConceptChecklist from "@/components/lesson/ConceptChecklist";
import BackgroundMap from "@/components/lesson/BackgroundMap";
import Glossary from "@/components/lesson/Glossary";
import StudyToolbar from "@/components/lesson/StudyToolbar";

type Block = { id: number; kind: string; content: string };
type Lesson = { id: number; slug: string; title: string };
type Course = { id: number; slug: string; title: string } | null;
type Chapter = { id: number; slug: string; title: string; description?: string | null; position?: number; meta?: any } | null;

type CourseProg = { total: number; completed: number; pct: number } | null;

type LessonProg = { completed: boolean; qTotal: number; qCorrect: number; lessonPct: number } | null;

type NavInfo = { prev: { slug: string; title: string } | null; next: { slug: string; title: string } | null } | null;

type Timeline = { lessons: { id: number; slug: string; title: string; completed?: boolean; qCount?: number }[] } | null;

export default function LessonPage() {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const { slug: rawSlug } = useParams();
  const slug = String(rawSlug || "");

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [tab, setTab] = useState<"learn" | "practice">("learn");
  const [qs, setQs] = useState<any[]>([]);
  const [ansState, setAnsState] = useState<Record<number, "correct" | "wrong">>({});
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isSavingComplete, setIsSavingComplete] = useState(false);
  const completeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [nav, setNav] = useState<NavInfo>(null);
  const [course, setCourse] = useState<Course>(null);
  const [chapter, setChapter] = useState<Chapter>(null);
  const [courseProg, setCourseProg] = useState<CourseProg>(null);
  const [lessonProg, setLessonProg] = useState<LessonProg>(null);
  const [timeline, setTimeline] = useState<Timeline>(null);
  const [uniSynced, setUniSynced] = useState<boolean>(false);
  const [unlockDemoVideo, setUnlockDemoVideo] = useState<boolean>(false);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [introVisited, setIntroVisited] = useState<boolean>(false);
  const [nudgeDismissed, setNudgeDismissed] = useState<boolean>(false);
  const [player, setPlayer] = useState<{ provider: string | null; iframeSrc: string | null; locked?: boolean; lockReason?: string; source?: "video_html" | "body" | "none" } | null>(null);

  const q = qs[idx];

  // URL router + search params
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize tab and question index from URL on slug change
  useEffect(() => {
    const t = (searchParams.get('tab') || '').toLowerCase();
    if (t === 'learn' || t === 'practice') setTab(t as any);
    const qParam = Number(searchParams.get('q') || NaN);
    if (Number.isFinite(qParam) && qParam > 0) setIdx(Math.max(0, qParam - 1));
    try {
      const u = searchParams.get('uni');
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('ems:uniSynced') : null;
      setUniSynced(u === '1' || saved === '1');
      setUnlockDemoVideo((searchParams.get('demo') || '') === '1');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Load lesson and course/timeline data
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/lesson/${slug}`);
      if (!res.ok) {
        // Reset to safe defaults when lesson is missing
        setLesson(null);
        setBlocks([]);
        setNav(null);
        setCourse(null);
        setChapter(null);
        setCourseProg(null);
        setTimeline(null);
        return;
      }
      const j = await res.json();
      setLesson(j?.lesson ?? null);
      setBlocks(Array.isArray(j?.blocks) ? j.blocks : []);
      setNav(j?.nav || null);
      setCourse(j?.course || null);
      setChapter(j?.chapter || null);
      setCourseProg(j?.courseProgress || null);
      setTimeline(j?.timeline || null);
    })();
  }, [slug]);

  // Load player embed (lazy, small payload) — avoids fetching large bodies repeatedly
  useEffect(() => {
    (async () => {
      try {
        const qs = unlockDemoVideo ? "?demo=1" : "";
        const r = await fetch(`/api/lesson/${slug}/player${qs}`);
        if (!r.ok) { setPlayer(null); return; }
        const k = await r.json();
        setPlayer(k || null);
      } catch { setPlayer(null); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, unlockDemoVideo]);

  // Load questions on opening practice
  useEffect(() => {
    if (tab !== "practice") return;
    (async () => {
      const r = await fetch(`/api/lesson/${slug}/questions`);
      const j = await r.json();
      setQs(j.questions || []);
      const qParam = Number(searchParams.get('q') || NaN);
      const startIdx = (Number.isFinite(qParam) && qParam > 0) ? Math.max(0, Math.min((j.questions?.length || 1) - 1, qParam - 1)) : 0;
      setIdx(startIdx);
      setPicked(null);
      const init: Record<number, "correct" | "wrong"> = {};
      (j.questions || []).forEach((qq: any) => {
        if (qq.answeredCorrect) init[Number(qq.id)] = "correct";
        else if (qq.selectedChoiceId != null) init[Number(qq.id)] = "wrong";
      });
      setAnsState(init);
    })();
  }, [slug, tab]);

  // Track lightweight progress (only when authenticated)
  useEffect(() => {
    if (!isAuthed) return;
    fetch(`/api/lesson/${slug}/progress`, {
      method: "POST",
      body: JSON.stringify({ progress: tab === "learn" ? 40 : 70 }),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  }, [slug, tab, isAuthed]);

  // Load completion status and per-lesson progress
  useEffect(() => {
    (async () => {
      if (!isAuthed) {
        setIsComplete(false);
        setLessonProg(null);
        return;
      }
      try {
        const r = await fetch(`/api/lesson/${slug}/progress`, { credentials: "include" });
        const j = await r.json();
        setIsComplete(!!j.completed);
        if (j && ("lessonPct" in j)) setLessonProg(j);
      } catch {}
    })();
  }, [slug, isAuthed]);

  // Read intro visited + nudge state when chapter changes
  useEffect(() => {
    if (!chapter?.slug) { setIntroVisited(false); return; }
    try {
      const visited = localStorage.getItem(`ems:chapter:intro:visited:${chapter.slug}`) === '1';
      setIntroVisited(visited);
      setNudgeDismissed(localStorage.getItem(`ems:chapter:intro:nudge:${chapter.slug}:dismissed`) === '1');
    } catch {}
  }, [chapter?.slug]);

  const progressPct = useMemo(() => (qs.length ? Math.round((idx) / qs.length * 100) : 0), [idx, qs.length]);

  // Keep URL in sync with tab and question index for shareable deep links
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    if (tab === 'practice') params.set('q', String(Math.max(1, Math.min(qs.length || 1, idx + 1))));
    else params.delete('q');
    router.replace(`/lesson/${slug}?${params.toString()}`);
  }, [tab, idx, qs.length, slug]);

  async function markCompleteToggle() {
    if (!isAuthed) return;
    const target = !isComplete;
    const wasComplete = isComplete;
    setIsSavingComplete(true);
    setIsComplete(target);
    setTimeline((tl) => (tl ? { lessons: tl.lessons.map((l) => (l.slug === slug ? { ...l, completed: target } : l)) } : tl));
    setCourseProg((p) => {
      if (!p) return p;
      if (wasComplete === target) return p;
      const completed = Math.max(0, Math.min(p.total, p.completed + (target ? 1 : -1)));
      const pct = p.total ? Math.round((completed / p.total) * 100) : 0;
      return { ...p, completed, pct } as any;
    });
    try {
      const res = await fetch(`/api/lesson/${slug}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ completed: target }),
      });
      if (res.ok) {
        const payload = await res.json().catch(() => ({}));
        if (payload?.awardedXp && Number(payload.awardedXp) > 0) {
          const rect = completeBtnRef.current?.getBoundingClientRect();
          const from = rect ? { x: rect.left + rect.width / 2, y: rect.top } : { x: window.innerWidth - 80, y: 12 };
          window.dispatchEvent(new CustomEvent("xp:awarded", { detail: { amount: Number(payload.awardedXp), from, newLevel: Number(payload.newLevel || 1), newPct: Number(payload.pct || 0), newInLevel: Number(payload.inLevel || 0), newSpan: Number(payload.span || 1) } }));
        }
        if (Array.isArray((payload as any)?.rewards)) {
          for (const r of (payload as any).rewards) {
            try { window.dispatchEvent(new CustomEvent('reward:earned', { detail: r })); } catch {}
            try { if (r?.type === 'chest' && typeof r?.key === 'string') localStorage.setItem(`ems:chest:flash:${r.key}`, '1'); } catch {}
          }
        }
      } else {
        // revert
        setIsComplete(!target);
        setTimeline((tl) => (tl ? { lessons: tl.lessons.map((l) => (l.slug === slug ? { ...l, completed: wasComplete } : l)) } : tl));
        setCourseProg((p) => {
          if (!p) return p;
          if (wasComplete === target) return p;
          const completed = Math.max(0, Math.min(p.total, p.completed + (target ? -1 : 1)));
          const pct = p.total ? Math.round((completed / p.total) * 100) : 0;
          return { ...p, completed, pct } as any;
        });
      }
    } finally {
      setIsSavingComplete(false);
    }
  }

  function next() {
    if (idx < qs.length - 1) {
      setIdx(idx + 1);
      setPicked(null);
    } else {
      if (isAuthed)
        fetch(`/api/lesson/${slug}/progress`, {
          method: "POST",
          body: JSON.stringify({ progress: 100, completed: true }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-[0_14px_42px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            {course?.slug && chapter?.slug && (
              <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                <Link href={`/course/${course.slug}`} className="hover:underline">{course.title || 'Course'}</Link>
                <span className="opacity-80">›</span>
                <Link href={`/course/${course.slug}/guidebook/${chapter.slug}`} className="hover:underline">{chapter.title}</Link>
              </div>
            )}
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{lesson?.title}</h1>
            {/* removed tiny pills; mode switcher moved below */}
            {/* Compact status instead of a full bar */}
            <div className="mt-3 w-full max-w-md text-xs font-medium text-white/90">
              {isAuthed ? (
                lessonProg ? (
                  <span>{lessonProg.completed ? "Completed" : "Incomplete"} • {lessonProg.qCorrect}/{lessonProg.qTotal} questions</span>
                ) : (
                  <span>Progress will appear here</span>
                )
              ) : (
                <span className="text-white/70">Sign in to track lesson progress</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                {course?.title ? course.title : 'Course'}
              </div>
              <button
                onClick={() => { try { const k=`ems:fav:${slug}`; const v=localStorage.getItem(k)==='1'?'0':'1'; localStorage.setItem(k,v); } catch {} }}
                title="Favorite"
                className="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold text-white/90 hover:bg-white/30"
              >
                ♥
              </button>
              <button
              ref={completeBtnRef}
              onClick={markCompleteToggle}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                isComplete ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-white text-indigo-700 hover:bg-indigo-50"
              } ${!isAuthed || isSavingComplete ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={!isAuthed || isSavingComplete}
              title={isAuthed ? undefined : "Sign in to track progress"}
            >
              {isComplete ? "Mark as incomplete" : "Mark as complete"}
            </button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] text-white/85">
              <span>Author —</span>
              <span className="hidden sm:inline">•</span>
              <span>Reviewed by —</span>
              <span className="hidden sm:inline">•</span>
              <span>Recently completed</span>
              <span className="flex -space-x-2 overflow-hidden">
                {[0,1,2,3].map((i)=> (<span key={i} className="inline-block h-5 w-5 rounded-full bg-white/30 ring-2 ring-white/20" />))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible intro teaser */}
      {chapter?.slug && (
        <TeaserCard courseSlug={course?.slug || ''} chapter={chapter as any} />
      )}

      {/* Chapter path bar (UI only, sticky) */}
      <div className="sticky top-16 z-30 mt-3 rounded-2xl border bg-white/90 p-4 shadow-md ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-indigo-900">Chapter path</div>
          {courseProg && (
            <div className="text-[11px] text-gray-600">{courseProg.completed}/{courseProg.total} done</div>
          )}
        </div>
        {(() => {
          const lessons = timeline?.lessons || [];
          // Insert a chapter intro as step 0 when available
          const lessonMarkers = lessons.map((l) => ({ key: l.slug, title: l.title, href: `/lesson/${l.slug}`, type: 'lesson' as const }));
          const markers = (chapter && course)
            ? ([{ key: `intro-${chapter.slug}`, title: chapter.title, href: `/course/${course.slug}/guidebook/${chapter.slug}`, type: 'chapter' as const }, ...lessonMarkers])
            : lessonMarkers;
          const count = Math.max(1, markers.length);
          const currIdx = Math.max(0, markers.findIndex((m) => m.type === 'lesson' && m.key === slug));
          const pct = Math.round((currIdx / Math.max(1, count - 1)) * 100);
          return (
            <div className="relative overflow-visible rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 p-2 ring-1 ring-inset ring-indigo-100">
              <div className="relative h-4 w-full overflow-visible rounded-full bg-white/70 shadow-inner ring-1 ring-indigo-100">
                <div className="path-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
                {markers.map((m, i) => {
                  const left = (i / Math.max(1, count - 1)) * 100;
                  const isCurr = i === currIdx;
                  const isLesson = m.type === 'lesson';
                  const lessonIdx = isLesson ? (i - ((chapter && course) ? 1 : 0)) : -1;
                  const done = isLesson ? ((courseProg?.completed ?? 0) > Math.max(0, lessonIdx)) : !!introVisited;
                  const state = isCurr ? 'curr' : done ? 'done' : 'todo';
                  return (
                    <a
                      key={m.key}
                      href={m.href}
                      title={m.type === 'chapter' ? `Intro: ${m.title}` : m.title}
                      className={`ems-dot ${state} ${m.type === 'chapter' ? 'intro' : ''}`}
                      style={{ left: `${left}%` }}
                    >
                      <span className="icon" aria-hidden>
                        {m.type === 'chapter' ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v14.5A2.5 2.5 0 0 1 17.5 20H7.5A2.5 2.5 0 0 0 5 22.5V5.5Z" fill="currentColor"/></svg>
                        ) : isCurr ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M8 5l11 7-11 7V5z" fill="currentColor"/></svg>
                        ) : done ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>
                        )}
                      </span>
                      <span className="tooltip">{m.type === 'chapter' ? `Intro: ${m.title}${chapter ? `\nComplete all lessons to unlock the chapter chest${(chapter as any)?.meta?.readMin ? ` • Intro · ${(chapter as any).meta.readMin} min read` : ''}` : ''}` : m.title}</span>
                    </a>
                  );
                })}
              </div>
              <style jsx>{`
                .path-fill::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-100%); animation:sheen 3s linear infinite; }
                .ems-dot { position:absolute; top:50%; transform:translate(-50%,-50%); display:grid; place-items:center; height:22px; width:22px; border-radius:9999px; color:#374151; text-decoration:none; }
                .ems-dot .tooltip { position:absolute; left:50%; bottom:-6px; transform:translate(-50%,100%); white-space:nowrap; font-size:10px; color:#4b5563; background:rgba(255,255,255,.95); border:1px solid rgba(99,102,241,.25); padding:2px 6px; border-radius:999px; box-shadow:0 4px 10px rgba(0,0,0,.08); opacity:0; pointer-events:none; transition:opacity .15s ease; }
                .ems-dot:hover .tooltip { opacity:1; }
                .ems-dot.todo { background:white; box-shadow:0 0 0 2px rgba(99,102,241,.35) inset; color:#4f46e5; }
                .ems-dot.done { background:#10b981; color:white; box-shadow:0 0 0 2px rgba(16,185,129,.45) inset; }
                .ems-dot.curr { background:white; color:#4f46e5; box-shadow:0 0 0 2px rgba(99,102,241,.6) inset, 0 0 0 0 rgba(99,102,241,.25); animation:glow 2s ease-out infinite; }
                .ems-dot.intro { background:#f5f3ff; color:#6d28d9; box-shadow:0 0 0 2px rgba(109,40,217,.35) inset; }
                @keyframes glow { 0% { box-shadow:0 0 0 0 rgba(99,102,241,.35), 0 0 0 2px rgba(99,102,241,.6) inset } 70% { box-shadow:0 0 0 12px rgba(99,102,241,0), 0 0 0 2px rgba(99,102,241,.6) inset } 100% { box-shadow:0 0 0 0 rgba(99,102,241,0), 0 0 0 2px rgba(99,102,241,.6) inset } }
                .ems-dot::after { content:''; position:absolute; inset:0; border-radius:inherit; background:radial-gradient(circle at center, rgba(99,102,241,.20), transparent 70%); opacity:0; transform:scale(.6); transition:transform .2s ease, opacity .2s ease; }
                .ems-dot:hover::after { opacity:1; transform:scale(1); }
              `}</style>
            </div>
          );
        })()}
      </div>

      {/* Content */}
      <div className={`mt-5 grid grid-cols-1 gap-6 ${focusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-[280px,1fr,320px]'}`}>
        {/* Timeline sidebar */}
        {!focusMode && (
        <aside className="hidden lg:block">
          <div className="sticky top-36 rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm ring-1 ring-black/5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">Chapter Progress</div>
            {/* Removed sidebar progress bar to reduce duplication */}
            <ul className="relative mt-2">
              {chapter && course && (
                <li className="group relative pl-8 pb-4">
                  {/* connector to next */}
                  <span className="absolute left-3 top-6 h-full w-[2px] bg-gradient-to-b from-indigo-200 to-transparent" />
                  <span className="absolute left-0 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-indigo-700 ring-2 ring-indigo-200">0</span>
                  <Link
                    href={`/course/${course.slug}/guidebook/${chapter.slug}`}
                    className={"block rounded-lg px-2 py-1.5 text-sm transition hover:bg-gray-50 text-gray-800"}
                    title="Chapter introduction"
                  >
                    <div className="flex items-center gap-2 pr-6">
                      <div className="line-clamp-2">Chapter: {chapter.title}</div>
                      {estimateLabel(chapter) && (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">{estimateLabel(chapter)}</span>
                      )}
                      {introVisited && (
                        <span className="ml-auto inline-flex items-center text-emerald-600" title="Viewed">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              )}
              {timeline?.lessons?.map((t, i) => {
                const isCurr = t.slug === slug;
                const done = !!t.completed || (isCurr && isComplete);
                const last = (timeline?.lessons?.length || 0) - 1 === i;
                return (
                  <li key={t.slug} className="group relative pl-8 pb-4">
                    {!last && <span className="absolute left-3 top-6 h-full w-[2px] bg-gradient-to-b from-indigo-200 to-transparent" />}
                    <span
                      className={`absolute left-0 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ${
                        done ? "bg-emerald-500 text-white ring-emerald-200" : isCurr ? "bg-indigo-600 text-white ring-indigo-200" : "bg-white text-indigo-700 ring-indigo-200"
                      }`}
                    >
                      {(i + 1)}
                    </span>
                    <Link
                      href={`/lesson/${t.slug}${isCurr && (tab==='practice') ? `?tab=${tab}&q=${idx+1}` : ''}`}
                      className={`block rounded-lg px-2 py-1.5 text-sm transition ${isCurr ? "bg-indigo-50 text-indigo-800" : "hover:bg-gray-50 text-gray-800"}`}
                    >
                      <div className="line-clamp-2 pr-6">{t.title}</div>
                    </Link>
                    {t.qCount && t.qCount > 0 && (
                      <div className="mt-1 space-y-1 pl-1">
                        {isCurr && <div className="text-[10px] font-semibold text-indigo-700">Questions</div>}
                        <div className="flex flex-wrap gap-1">
                          {Array.from({ length: t.qCount }).map((_, qi) => {
                            const active = isCurr && tab === 'practice' && idx === qi;
                            const state = isCurr ? ansState[Number((qs[qi]?.id) || -1)] : undefined;
                            const cls = active ? 'bg-indigo-600 text-white ring-indigo-300' : state==='correct' ? 'bg-emerald-600 text-white ring-emerald-300' : state==='wrong' ? 'bg-rose-100 text-rose-700 ring-rose-200' : 'bg-white text-gray-700 hover:bg-gray-50 ring-gray-200';
                            const href = `/lesson/${t.slug}?tab=practice&q=${qi + 1}`;
                            return (
                              <Link
                                key={qi}
                                href={href}
                                className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ring-1 ring-inset ${cls}`}
                                title={`Question ${qi+1}`}
                                onClick={(e)=>{ if (isCurr) { e.preventDefault(); setTab('practice'); setIdx(qi); setPicked(null); } }}
                              >
                                {qi+1}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
        )}

        <section>
          {/* Study toolbar with clear mode switch + tools */}
          <div className="mb-4">
            <StudyToolbar
              mode={tab}
              onMode={(m)=> setTab(m)}
              focus={focusMode}
              onFocusToggle={()=> setFocusMode((v)=> !v)}
              softLockPractice={!introVisited}
              practiceHint="Start with the chapter intro"
            />
          </div>
          {chapter && !introVisited && !nudgeDismissed && (timeline?.lessons?.[0]?.slug === slug) && (
            <div className="mb-3 flex items-start justify-between rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] text-violet-900">
              <div>
                <span className="font-semibold">Start with the chapter intro.</span>
                <span className="ml-1 opacity-80">It sets context for the lessons.</span>
              </div>
              <button
                onClick={() => { setNudgeDismissed(true); try { localStorage.setItem(`ems:chapter:intro:nudge:${chapter.slug}:dismissed`, '1'); } catch {} }}
                className="rounded-full px-2 py-0.5 text-violet-700 hover:bg-violet-100"
                title="Dismiss"
              >✕</button>
            </div>
          )}
          {tab === "learn" && (
            <div className="space-y-4">
              {/* Ensure a video appears for demo even if lesson lacks one */}
              {(() => {
                // Consider only blocks to decide if the page already has a video block.
                // If there is no video block, we will show the player (from DB video_html)
                // or a simple YouTube demo fallback.
                const hasVideo = blocks.some((b) => b.kind === 'video');
                if (!hasVideo) {
                  return (
                    <div key="demo-video" className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
                      {(player?.locked && player?.source === 'video_html') ? (
                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                          <div className="text-sm font-semibold text-indigo-900">This lesson is available for Ari's IMAT students</div>
                          <div className="text-[12px] text-gray-600">Purchase the IMAT course to access this video and materials.</div>
                          <div className="mt-1 flex items-center justify-center gap-2">
                            <a href="/imat-course" className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Go to IMAT course</a>
                            <button onClick={() => window.dispatchEvent(new CustomEvent('auth:open'))} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100">Log in</button>
                          </div>
                        </div>
                      ) : (player?.iframeSrc && player?.source === 'video_html') ? (
                        <VideoPanel
                          iframeSrc={player.iframeSrc || undefined}
                          locked={!!player?.locked}
                          lockReason={player?.lockReason || (isAuthed ? undefined : "Login or enroll to watch")}
                          onUnlock={() => window.dispatchEvent(new CustomEvent('auth:open'))}
                          subtitles={[{ lang: 'en', label: 'English' }]}
                          prev={nav?.prev ? { href: `/lesson/${nav.prev.slug}`, title: `Prev: ${nav.prev.title}` } : null}
                          next={nav?.next ? { href: `/lesson/${nav.next.slug}`, title: `Next: ${nav.next.title}` } : null}
                          anchors={[{ pos: 15, id: 'note-1', label: 'Key idea' }, { pos: 45, id: 'note-2', label: 'Labs' }, { pos: 80, id: 'note-3', label: 'Management' }]}
                        />
                      ) : (
                        <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900 ring-1 ring-inset ring-indigo-100">
                          No video available for this lesson/chapter.
                        </div>
                      )}
                      <ObjectivesStrip chapter={chapter} />
                    </div>
                  );
                }
                return null;
              })()}
              {(() => {
                let navShown = false;
                let objShown = false;
                const blurLocked = !!(player?.locked && player?.source === 'video_html');
                return (
                  <div className={blurLocked ? 'filter blur-[2px] select-none pointer-events-none' : ''}>
                  {blocks.map((b, i) => {
                  const isVideo = b.kind === 'video';
                  return (
                    <div key={`wrap-${b.id}`}>
                      <motion.div
                        className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5"
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.03 }}
                      >
                        {isVideo && !player?.iframeSrc ? (
                          <VideoPanel
                            src={JSON.parse(b.content || "{}")?.src || ""}
                            poster={JSON.parse(b.content || "{}")?.poster || ""}
                            locked={!isAuthed && !unlockDemoVideo}
                            lockReason={!isAuthed ? "Login or enroll to watch" : undefined}
                            onUnlock={() => window.dispatchEvent(new CustomEvent('auth:open'))}
                            subtitles={[{ lang: 'en', label: 'English' }]}
                            prev={nav?.prev ? { href: `/lesson/${nav.prev.slug}`, title: `Prev: ${nav.prev.title}` } : null}
                            next={nav?.next ? { href: `/lesson/${nav.next.slug}`, title: `Next: ${nav.next.title}` } : null}
                            anchors={[{ pos: 20, id: 'note-1', label: 'Key idea' }, { pos: 55, id: 'note-2', label: 'Labs' }, { pos: 85, id: 'note-3', label: 'Management' }]}
                          />
                        ) : isVideo && player?.iframeSrc && player?.source === 'video_html' ? (
                          <VideoPanel
                            iframeSrc={player.iframeSrc || undefined}
                            locked={!!player?.locked}
                            lockReason={player?.lockReason || (isAuthed ? undefined : "Login or enroll to watch")}
                            onUnlock={() => window.dispatchEvent(new CustomEvent('auth:open'))}
                            subtitles={[{ lang: 'en', label: 'English' }]}
                            prev={nav?.prev ? { href: `/lesson/${nav.prev.slug}`, title: `Prev: ${nav.prev.title}` } : null}
                            next={nav?.next ? { href: `/lesson/${nav.next.slug}`, title: `Next: ${nav.next.title}` } : null}
                            anchors={[{ pos: 20, id: 'note-1', label: 'Key idea' }, { pos: 55, id: 'note-2', label: 'Labs' }, { pos: 85, id: 'note-3', label: 'Management' }]}
                          />
                        ) : b.kind === 'note' ? (
                          <article className="prose prose-indigo max-w-none text-sm" data-lesson-anchor={`note-${i+1}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.content}</ReactMarkdown>
                          </article>
                        ) : (
                          <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">{b.content}</div>
                        )}
                      </motion.div>
                      {isVideo && !objShown && (objShown = true) && (<ObjectivesStrip chapter={chapter} />)}
                      {isVideo && !navShown && (navShown = true) && (<div />)}
                    </div>
                  )})}
                  </div>
                );
              })()}
              })()}

              {!focusMode && (
                <>
                  {/* Background knowledge */}
                  <BackgroundMap comingSoon />
                  {/* Comments placeholder */}
                  <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <div className="mb-1 text-sm font-semibold text-indigo-900">Comments</div>
                    <div className="text-[12px] text-gray-600">Discussion, highlights and Q&A — coming soon.</div>
                    <div className="mt-3 grid gap-2">
                      {[0,1].map((i)=>(<div key={i} className="rounded-xl bg-gray-50 p-3 text-[12px] text-gray-500 ring-1 ring-inset ring-gray-200">Sign in to leave a comment…</div>))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "practice" && (
            <div className="space-y-4">
              {/* question nav bubbles only (progress bar removed) */}
              {qs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {qs.map((qq, i) => {
                    const state = ansState[Number(qq.id)];
                    const cls = i === idx
                      ? 'bg-indigo-600 text-white ring-indigo-300'
                      : state === 'correct'
                        ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                        : state === 'wrong'
                          ? 'bg-rose-100 text-rose-700 ring-rose-200'
                          : 'bg-white text-gray-700 hover:bg-gray-50 ring-gray-200';
                    return (
                      <button
                        key={qq.id}
                        onClick={() => { setIdx(i); setPicked(null); setTab('practice'); }}
                        className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ring-1 ring-inset ${cls}`}
                        title={state ? (state==='correct'?'Solved':'Wrong') : 'Unanswered'}
                      >
                        {i+1}
                      </button>
                    );
                  })}
                </div>
              )}
              {q ? (
                <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
                  <div className="mb-3 text-sm font-semibold text-gray-900">Question {idx + 1} of {qs.length}</div>
                  <div className="mb-3 font-medium">{q.prompt}</div>
                  <QuestionChoices
                    key={q.id}
                    q={q}
                    isAuthed={isAuthed}
                    onChoice={async (choiceId: number, isCorrect: boolean, from?: { x: number; y: number }) => {
                      setPicked(choiceId);
                      try {
                        // Persist answer (correct or wrong). XP awarded only when first correct.
                        const r = await fetch(`/api/questions/${q.id}/answer`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ choiceId }),
                          credentials: 'include',
                        });
                        const j = await r.json();
                        if (isCorrect) {
                          setAnsState((s)=>({ ...s, [Number(q.id)]: 'correct' }));
                        } else {
                          setAnsState((s)=>({ ...s, [Number(q.id)]: 'wrong' }));
                        }
                        if (j?.awardedXp && Number(j.awardedXp) > 0) {
                          const detail: any = { amount: Number(j.awardedXp) };
                          if (from) detail.from = from;
                          if (j?.newLevel != null) detail.newLevel = Number(j.newLevel);
                          if (j?.pct != null) detail.newPct = Number(j.pct);
                          if (j?.inLevel != null) detail.newInLevel = Number(j.inLevel);
                          if (j?.span != null) detail.newSpan = Number(j.span);
                          window.dispatchEvent(new CustomEvent('xp:awarded', { detail }));
                        }
                        if (Array.isArray(j?.rewards)) { for (const rwd of j.rewards) { try { window.dispatchEvent(new CustomEvent('reward:earned', { detail: rwd })); } catch {} try { if (rwd?.type === 'chest' && typeof rwd?.key === 'string') localStorage.setItem('ems:chest:flash:', '1'); } catch {} } }
                        if (isAuthed) {
                          const r2 = await fetch(`/api/lesson/${slug}/progress`, { credentials: 'include' });
                          const k = await r2.json();
                          if (k && ('lessonPct' in k)) setLessonProg(k);
                        }
                      } catch {}
                    }}
                  />
                  {picked != null && (
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-gray-600">{q.explanation}</div>
                      <button onClick={() => { next(); setTab('practice'); }} className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">
                        {idx < qs.length - 1 ? "Next" : "Finish"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border bg-white p-4 text-sm text-gray-700 ring-1 ring-black/5">No questions yet.</div>
              )}
            </div>
          )}

          {/* notes tab removed */}

          {/* Lesson meta moved to header; no bottom prev/next */}
        </section>
        {!focusMode && (
          <aside className="hidden lg:block space-y-4">
            <Glossary />
            <UniResources enabled={uniSynced} comingSoon />
            <AnkiDownload comingSoon />
            <ConceptChecklist items={["Why D-dimer increases", "Consumption coagulopathy vs. primary fibrinolysis", "Triggers in sepsis", "Management priorities"]} comingSoon />
            <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="text-sm font-semibold text-indigo-900">Credits & resources</div>
              <div className="mt-1 text-[12px] text-gray-600">Images, icons, references • coming soon</div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function estimateLabel(ch: Chapter | null) {
  if (!ch) return '';
  const m: any = (ch as any)?.meta || {};
  const v = m.readMin ?? m.read_min ?? m.read ?? null;
  if (!v) return 'Intro · 3–5 min read';
  if (typeof v === 'number') return `Intro · ${v} min read`;
  if (typeof v === 'string') return String(v);
  return '';
}

function TeaserCard({ courseSlug, chapter }: { courseSlug: string; chapter: NonNullable<Chapter> }) {
  const [open, setOpen] = useState(false);
  const desc = ((chapter as any)?.meta?.teaser || (chapter as any)?.description || '') as string;
  if (!desc) return null;
  const estimate = estimateLabel(chapter);
  return (
    <div className="mt-3 rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm font-semibold text-indigo-900">Chapter introduction</div>
        {estimate ? <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">{estimate}</span> : null}
      </div>
      <div className={`text-sm text-slate-700 ${open ? '' : 'line-clamp-3'}`}>{desc}</div>
      <div className="mt-2 flex items-center gap-2">
        <Link href={`/course/${courseSlug}/guidebook/${chapter.slug}`} className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">Open guidebook</Link>
        <button onClick={() => setOpen(v=>!v)} className="text-[12px] font-semibold text-indigo-700 hover:underline">{open ? 'Show less' : 'Read more'}</button>
      </div>
    </div>
  );
}

function ObjectivesStrip({ chapter }: { chapter: Chapter | null }) {
  const items: string[] = Array.isArray((chapter as any)?.meta?.objectives)
    ? (chapter as any).meta.objectives
    : Array.isArray((chapter as any)?.meta?.goals)
      ? (chapter as any).meta.goals
      : [];
  if (!items.length) return null;
  return (
    <div className="mt-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 text-[12px] text-indigo-900">
      <div className="mb-1 font-semibold">Learning objectives</div>
      <ul className="grid gap-1">
        {items.slice(0,3).map((t, i) => (
          <li key={i} className="flex items-start gap-2"><span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-indigo-500"/><span>{t}</span></li>
        ))}
      </ul>
      <div className="mt-2 text-[11px] text-indigo-700">See all in the chapter guidebook</div>
    </div>
  );
}

function QuestionChoices({ q, onChoice, isAuthed }: { q: any; onChoice: (choiceId: number, isCorrect: boolean, from?: { x: number; y: number }) => void; isAuthed?: boolean }) {
  const [picked, setPicked] = useState<number | null>(q.selectedChoiceId ?? null);
  const [solved, setSolved] = useState<boolean>(!!q.answeredCorrect);
  const gated = (q.access === 'auth' && !isAuthed) || (q.access === 'premium' && !isAuthed);
  const locked = solved; // lock after correct answer or when previously solved
  const onPick = (e: any, cid: number) => {
    if (locked || gated) return;
    setPicked(cid);
    const isCorrect = !!q.choices.find((x: any) => Number(x.id) === Number(cid))?.correct;
    if (isCorrect) setSolved(true);
    try {
      const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect?.();
      const from = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
      onChoice(cid, isCorrect, from);
    } catch {
      onChoice(cid, isCorrect);
    }
  };
  return (
    <div className="relative">
      {gated && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-white/60 backdrop-blur-sm">
          <button onClick={() => window.dispatchEvent(new CustomEvent('auth:open'))} className="pointer-events-auto rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow">Log in to access this question</button>
        </div>
      )}
      {(!isAuthed && (q.access === 'public' || q.access === 'guest')) && (
        <div className="mb-1 text-[11px] text-indigo-700/90">Login to save your progress <button onClick={() => window.dispatchEvent(new CustomEvent('auth:open'))} className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700 hover:bg-indigo-100">Sign in</button></div>
      )}
      <div className="grid gap-2">
        {q.choices.map((c: any, i: number) => {
          const isPicked = picked === c.id;
          const state = picked == null ? 'idle' : (solved && c.correct) ? 'correct' : isPicked && !c.correct ? 'wrong' : isPicked && c.correct ? 'correct' : 'idle';
          const cls = state === "correct" ? "border-green-600 bg-green-50" : state === "wrong" ? "border-rose-600 bg-rose-50" : "hover:bg-gray-50";
          return (
            <button
              key={c.id}
              onClick={(e) => onPick(e, c.id)}
              disabled={locked || gated}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-left transition ${cls}`}
            >
              <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ring-1 ring-inset ${state==='correct' ? 'bg-emerald-600 text-white ring-emerald-300' : state==='wrong' ? 'bg-rose-600 text-white ring-rose-300' : 'bg-white text-gray-700 ring-gray-200'}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm text-gray-900">{c.text}</span>
            </button>
          );
        })}
      </div>
      {picked != null && !solved && (
        <div className="mt-1 text-[11px] font-semibold text-rose-600">Not quite — try again!</div>
      )}
    </div>
  );
}














