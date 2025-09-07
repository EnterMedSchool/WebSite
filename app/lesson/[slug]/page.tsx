"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

type Block = { id:number; kind:string; content:string };
type Lesson = { id:number; slug:string; title:string };

export default function LessonPage() {
  const { status } = useSession();
  const isAuthed = status === 'authenticated';
  const { slug: rawSlug } = useParams();
  const slug = String(rawSlug || '');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [tab, setTab] = useState<'learn'|'practice'|'notes'>('learn');
  const [qs, setQs] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isSavingComplete, setIsSavingComplete] = useState(false);
  const q = qs[idx];

  // Load lesson
  useEffect(() => { (async () => {
    const res = await fetch(`/api/lesson/${slug}`); const j = await res.json();
    setLesson(j.lesson); setBlocks(j.blocks);
  })(); }, [slug]);

  // Load questions on opening practice
  useEffect(() => { if (tab==='practice') (async () => { const r=await fetch(`/api/lesson/${slug}/questions`); const j=await r.json(); setQs(j.questions || []); setIdx(0); setPicked(null); })(); }, [slug, tab]);

  // Track lightweight progress (only when authenticated)
  useEffect(() => {
    if (!isAuthed) return;
    fetch(`/api/lesson/${slug}/progress`, { method:'POST', body: JSON.stringify({ progress: tab==='learn'? 40: (tab==='practice'? 70: 30) }), headers:{'Content-Type':'application/json'}, credentials:'include' });
  }, [slug, tab, isAuthed]);

  // Load completion status
  useEffect(() => { (async () => {
    if (!isAuthed) { setIsComplete(false); return; }
    try { const r = await fetch(`/api/lesson/${slug}/progress`, { credentials:'include' }); const j = await r.json(); setIsComplete(!!j.completed); } catch {}
  })(); }, [slug, isAuthed]);

  const progressPct = useMemo(() => qs.length ? Math.round(((idx) / qs.length) * 100) : 0, [idx, qs.length]);

  function next() {
    if (idx < qs.length-1) { setIdx(idx+1); setPicked(null); }
    else { if (isAuthed) fetch(`/api/lesson/${slug}/progress`, { method:'POST', body: JSON.stringify({ progress: 100, completed: true }), headers:{'Content-Type':'application/json'}, credentials:'include' }); }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-[0_14px_42px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{lesson?.title}</h1>
            <div className="mt-2 flex gap-2">
              {(['learn','practice','notes'] as const).map(t => (
                <button key={t} onClick={()=>setTab(t)} className={`rounded-full px-3 py-1 text-xs font-semibold ${tab===t? 'bg-white text-indigo-700':'bg-white/15 text-white hover:bg-white/25'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Lesson</div>
            <button
              onClick={async ()=>{
                if (!isAuthed) return;
                const target = !isComplete;
                setIsSavingComplete(true);
                setIsComplete(target);
                try {
                  const res = await fetch(`/api/lesson/${slug}/progress`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ completed: target }) });
                  if (!res.ok) {
                    setIsComplete(!target);
                    // Optionally surface a toast; for now console
                    console.warn('Failed to update completion', await res.text());
                  }
                } catch (e) {
                  setIsComplete(!target);
                } finally {
                  setIsSavingComplete(false);
                }
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isComplete? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white text-indigo-700 hover:bg-indigo-50'} ${(!isAuthed || isSavingComplete)? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={!isAuthed || isSavingComplete}
              title={isAuthed ? undefined : 'Sign in to track progress'}
            >
              {isComplete? 'Mark as incomplete' : 'Mark as complete'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-5">
        {tab==='learn' && (
          <div className="space-y-4">
            {blocks.map((b, i) => (
              <motion.div key={b.id} className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5" initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.03 }}>
                {b.kind==='video' ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={JSON.parse(b.content||'{}').src || ''} poster={JSON.parse(b.content||'{}').poster || ''} className="w-full rounded-xl ring-1 ring-black/10" controls />
                ) : b.kind==='note' ? (
                  <article className="prose prose-indigo max-w-none text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.content}</ReactMarkdown>
                  </article>
                ) : (
                  <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">{b.content}</div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {tab==='practice' && (
          <div className="space-y-4">
            {/* progress */}
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" style={{ width: `${progressPct}%` }} />
            </div>
            {q ? (
              <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
                <div className="mb-3 text-sm font-semibold text-gray-900">Question {idx+1} of {qs.length}</div>
                <div className="mb-3 font-medium">{q.prompt}</div>
                <div className="grid gap-2">
                  {q.choices.map((c:any) => {
                    const state = picked==null ? 'idle' : (c.correct ? 'correct' : (picked===c.id ? 'wrong' : 'idle'));
                    const cls = state==='correct' ? 'border-green-600 bg-green-50' : state==='wrong' ? 'border-rose-600 bg-rose-50' : 'hover:bg-gray-50';
                    return (
                      <button key={c.id} onClick={()=> setPicked(c.id)} disabled={picked!=null}
                        className={`rounded-lg border px-3 py-2 text-left transition ${cls}`}>
                        {c.text}
                      </button>
                    );
                  })}
                </div>
                {picked!=null && (
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-600">{q.explanation}</div>
                    <button onClick={next} className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">{idx<qs.length-1? 'Next' : 'Finish'}</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border bg-white p-4 text-sm text-gray-700 ring-1 ring-black/5">No questions yet.</div>
            )}
          </div>
        )}

        {tab==='notes' && (
          <div className="space-y-3">
            {blocks.filter(b=>b.kind==='note').map((b,i)=> (
              <motion.article key={b.id} className="prose prose-indigo max-w-none rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5" initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i*0.03 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.content}</ReactMarkdown>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
