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
import LessonMeta from "@/components/lesson/LessonMeta";

type Block = { id: number; kind: string; content: string };
type Lesson = { id: number; slug: string; title: string };

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
  const [tab, setTab] = useState<"learn" | "practice" | "notes">("learn");
  const [qs, setQs] = useState<any[]>([]);
  const [ansState, setAnsState] = useState<Record<number, "correct" | "wrong">>({});
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isSavingComplete, setIsSavingComplete] = useState(false);
  const completeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [nav, setNav] = useState<NavInfo>(null);
  const [courseProg, setCourseProg] = useState<CourseProg>(null);
  const [lessonProg, setLessonProg] = useState<LessonProg>(null);
  const [timeline, setTimeline] = useState<Timeline>(null);
  const [uniSynced, setUniSynced] = useState<boolean>(false);
  const [unlockDemoVideo, setUnlockDemoVideo] = useState<boolean>(false);

  const q = qs[idx];

  // URL router + search params
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize tab and question index from URL on slug change
  useEffect(() => {
    const t = (searchParams.get('tab') || '').toLowerCase();
    if (t === 'learn' || t === 'practice' || t === 'notes') setTab(t as any);
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
      const j = await res.json();
      setLesson(j.lesson);
      setBlocks(j.blocks);
      setNav(j.nav || null);
      setCourseProg(j.courseProgress || null);
      setTimeline(j.timeline || null);
    })();
  }, [slug]);

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
      body: JSON.stringify({ progress: tab === "learn" ? 40 : tab === "practice" ? 70 : 30 }),
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
    <div className="mx-auto max-w-7xl p-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-[0_14px_42px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{lesson?.title}</h1>
            <div className="mt-2 flex gap-2">
              {["learn", "practice", "notes"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t as any)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${tab === t ? "bg-white text-indigo-700" : "bg-white/15 text-white hover:bg-white/25"}`}
                >
                  {t}
                </button>
              ))}
            </div>
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
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Lesson</div>
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
        </div>
      </div>

      {/* Chapter navigator (UI-only) */}
      <div className="mt-3 rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-indigo-900">Chapter progress</div>
          <div className="flex flex-1 items-center gap-3 sm:pl-4">
            {(() => {
              const lessons = timeline?.lessons || [];
              const pos = Math.max(0, lessons.findIndex((l) => l.slug === slug));
              const max = Math.max(1, lessons.length);
              const val = Math.max(1, pos + 1);
              return (
                <>
                  <input type="range" min={1} max={max} defaultValue={val} className="w-full accent-indigo-600" onChange={() => {}} />
                  <a href={lessons[pos]?.slug ? `/lesson/${lessons[pos].slug}` : '#'} className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Study this chapter</a>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[280px,1fr,320px]">
        {/* Timeline sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm ring-1 ring-black/5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">Chapter Progress</div>
            {/* Removed sidebar progress bar to reduce duplication */}
            <ul className="relative mt-2">
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
                      {i + 1}
                    </span>
                    <Link
                      href={`/lesson/${t.slug}${isCurr && (tab==='practice' || tab==='notes') ? `?tab=${tab}${tab==='practice' ? `&q=${idx+1}`:''}` : ''}`}
                      className={`block rounded-lg px-2 py-1.5 text-sm transition ${isCurr ? "bg-indigo-50 text-indigo-800" : "hover:bg-gray-50 text-gray-800"}`}
                    >
                      <div className="line-clamp-2 pr-6">{t.title}</div>
                    </Link>
                    {t.qCount && t.qCount > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 pl-1 lg:hidden">
                        {Array.from({ length: t.qCount }).map((_, qi) => {
                          const active = isCurr && tab === 'practice' && idx === qi;
                          const href = `/lesson/${t.slug}?tab=practice&q=${qi + 1}`;
                          return (
                            <Link
                              key={qi}
                              href={href}
                              className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ring-1 ring-inset ${active? 'bg-indigo-600 text-white ring-indigo-300' : 'bg-white text-gray-700 hover:bg-gray-50 ring-gray-200'}`}
                              title={`Question ${qi+1}`}
                              onClick={(e)=>{ if (isCurr) { e.preventDefault(); setTab('practice'); setIdx(qi); setPicked(null); } }}
                            >
                              {qi+1}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <section>
          {tab === "learn" && (
            <div className="space-y-4">
              {/* Ensure a video appears for demo even if lesson lacks one */}
              {(() => {
                const hasVideo = blocks.some((b) => b.kind === 'video');
                if (!hasVideo) {
                  return (
                    <div key="demo-video" className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
                      <VideoPanel
                        src="https://www.youtube.com/watch?v=yO9oj2ScR-g"
                        locked={!isAuthed && !unlockDemoVideo}
                        lockReason={!isAuthed ? "Login or enroll to watch" : undefined}
                        onUnlock={() => window.dispatchEvent(new CustomEvent('auth:open'))}
                        subtitles={[{ lang: 'en', label: 'English' }]}
                      />
                    </div>
                  );
                }
                return null;
              })()}
              {blocks.map((b, i) => (
                <motion.div
                  key={b.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                >
                  {b.kind === "video" ? (
                    <VideoPanel
                      src={JSON.parse(b.content || "{}")?.src || ""}
                      poster={JSON.parse(b.content || "{}")?.poster || ""}
                      locked={!isAuthed && !unlockDemoVideo}
                      lockReason={!isAuthed ? "Login or enroll to watch" : undefined}
                      onUnlock={() => window.dispatchEvent(new CustomEvent('auth:open'))}
                      subtitles={[{ lang: 'en', label: 'English' }, { lang: 'it', label: 'Italiano' }]}
                    />
                  ) : b.kind === "note" ? (
                    <article className="prose prose-indigo max-w-none text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.content}</ReactMarkdown>
                    </article>
                  ) : (
                    <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">{b.content}</div>
                  )}
                </motion.div>
              ))}
              <UniResources enabled={uniSynced} />
              <AnkiDownload />
              <ConceptChecklist items={["Why D-dimer increases", "Consumption coagulopathy vs. primary fibrinolysis", "Triggers in sepsis", "Management priorities"]} />
              <BackgroundMap />
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

          {tab === "notes" && (
            <div className="space-y-3">
              {blocks
                .filter((b) => b.kind === "note")
                .map((b, i) => (
                  <motion.article
                    key={b.id}
                    className="prose prose-indigo max-w-none rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.content}</ReactMarkdown>
                  </motion.article>
                ))}
            </div>
          )}

          <LessonMeta />
          {/* Prev/Next navigation */}
          <div className="mt-8 flex items-center justify-between">
            <div>
              {nav?.prev ? (
                <Link
                  href={`/lesson/${nav.prev.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50"
                >
                  Prev: {nav.prev.title}
                </Link>
              ) : (
                <span />
              )}
            </div>
            <div>
              {nav?.next ? (
                <Link
                  href={`/lesson/${nav.next.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50"
                >
                  Next: {nav.next.title}
                </Link>
              ) : (
                <span />
              )}
            </div>
          </div>
        </section>
        {tab === 'learn' ? <Glossary /> : <div className="hidden lg:block" />}
      </div>
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














