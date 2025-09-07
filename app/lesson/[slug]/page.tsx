"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Block = { id:number; kind:string; content:string };
type Lesson = { id:number; slug:string; title:string };

export default function LessonPage() {
  const params = useParams();
  const slug = String(params?.slug || '');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [tab, setTab] = useState<'learn'|'practice'|'notes'>('learn');
  const [qs, setQs] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const q = qs[idx];

  useEffect(() => { (async () => {
    const res = await fetch(`/api/lesson/${slug}`); const j = await res.json();
    setLesson(j.lesson); setBlocks(j.blocks);
  })(); }, [slug]);

  useEffect(() => { if (tab==='practice') (async () => { const r=await fetch(`/api/lesson/${slug}/questions`); const j=await r.json(); setQs(j.questions || []); setIdx(0); })(); }, [slug, tab]);

  useEffect(() => { fetch(`/api/lesson/${slug}/progress`, { method:'POST', body: JSON.stringify({ progress: tab==='learn'? 50: (tab==='practice'? 75: 25) }), headers:{'Content-Type':'application/json'} }); }, [slug, tab]);

  function onAnswer(choiceId:number) { if (idx < qs.length-1) setIdx(idx+1); else fetch(`/api/lesson/${slug}/progress`, { method:'POST', body: JSON.stringify({ progress: 100, completed: true }), headers:{'Content-Type':'application/json'} }); }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{lesson?.title}</h1>
        <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Lesson</div>
      </div>
      <div className="mb-4 flex gap-2">
        {(['learn','practice','notes'] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`rounded-full px-3 py-1 text-sm font-semibold ${tab===t? 'bg-indigo-600 text-white':'bg-gray-100 text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {tab==='learn' && (
        <div className="space-y-4">
          {blocks.map(b => (
            <div key={b.id} className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
              {b.kind==='video' ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={JSON.parse(b.content||'{}').src || ''} poster={JSON.parse(b.content||'{}').poster || ''} className="w-full rounded-lg" controls/>
              ) : b.kind==='note' ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{b.content}</pre>
              ) : (
                <div className="text-sm text-gray-800">{b.content}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==='practice' && (
        <div className="space-y-3">
          {q ? (
            <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="mb-2 font-semibold">Q{idx+1}. {q.prompt}</div>
              <div className="grid gap-2">
                {q.choices.map((c:any) => (
                  <button key={c.id} onClick={()=>onAnswer(c.id)} className="rounded-lg border px-3 py-2 text-left hover:bg-gray-50">{c.text}</button>
                ))}
              </div>
            </div>
          ) : <div>No questions yet.</div>}
          <div className="text-xs text-gray-500">{idx+1}/{qs.length}</div>
        </div>
      )}

      {tab==='notes' && (
        <div className="space-y-2">
          {blocks.filter(b=>b.kind==='note').map(b=> (
            <div key={b.id} className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{b.content}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

