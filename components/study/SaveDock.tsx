"use client";

import { useEffect, useMemo, useState } from "react";
import { StudyStore } from "@/lib/study/store";

export default function SaveDock({ courseId }: { courseId?: number }) {
  const cid = Number(courseId || 0);
  const [count, setCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [boom, setBoom] = useState(false);

  useEffect(() => {
    if (!cid) return;
    setCount(StudyStore.getPendingCount(cid));
    return StudyStore.subscribe((c, n) => { if (c === cid) setCount(n); });
  }, [cid]);

  const disabled = !cid || count === 0 || saving;

  async function saveNow() {
    if (disabled) return;
    setSaving(true);
    try {
      const p = StudyStore.getPending(cid);
      const res = await fetch('/api/study/sync', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: cid,
          lessons_completed: p.lessons_completed.map((id) => [id, Date.now()]),
          question_status: p.question_status.map(([id, st]) => [id, st, Date.now()]),
          xp_delta: { lessons: p.lessons_completed.length },
          version: 1,
        }),
      });
      if (res.ok) {
        StudyStore.clear(cid);
        setBoom(true); setTimeout(()=>setBoom(false), 1200);
        setCount(0);
      }
    } catch {}
    setSaving(false);
  }

  if (!cid) return null;
  if (count === 0 && !saving) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button onClick={saveNow} disabled={disabled} className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ring-1 ring-black/5 ${disabled ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
        <span>Save progress</span>
        {count > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[11px]">{count}</span>}
      </button>
      {boom && (
        <div className="pointer-events-none absolute -bottom-6 right-2 h-0 w-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="absolute inline-block h-2 w-2 animate-xp-bubble rounded-full bg-indigo-400" style={{ transform: `translate(${(Math.random()*80-40).toFixed(0)}px, ${(Math.random()*-60-40).toFixed(0)}px)` }} />
          ))}
          <style jsx>{`
            @keyframes xp-up { from { opacity: .9; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-60px) scale(1.2); } }
            .animate-xp-bubble { animation: xp-up 1.1s ease-out forwards; }
          `}</style>
        </div>
      )}
    </div>
  );
}

