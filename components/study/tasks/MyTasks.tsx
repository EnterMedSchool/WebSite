"use client";

import { useMemo, useState } from "react";
import { useStudyStore } from "@/lib/study/store";

export default function MyTasks() {
  const sessionId = useStudyStore((s) => s.sessionId);
  const myUserId = useStudyStore((s) => s.myUserId);
  const taskLists = useStudyStore((s) => s.taskLists);
  const setTaskLists = useStudyStore((s) => s.setTaskLists);
  const upsertTaskList = useStudyStore((s) => s.upsertTaskList);

  const myList = useMemo(() => taskLists.find((l) => l.userId === myUserId) || null, [taskLists, myUserId]);
  const [title] = useState(myList?.title || "My Tasks");
  const [item, setItem] = useState("");
  const [vanish, setVanish] = useState<Record<number, boolean>>({});

  const ensureList = async () => {
    if (myList || !sessionId) return myList;
    const res = await fetch("/api/study/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId, title, isGlobal: true }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    upsertTaskList({ id: json.data.id, title: json.data.title, userId: myUserId!, items: json.data.items || [] });
    return json.data;
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = item.trim();
    if (!name || !myUserId) return;
    const list = await ensureList();
    if (!list) return;
    setItem("");
    // Optimistic: add a temp item id (negative) for instant feedback
    const tempId = -Math.floor(Math.random() * 1e9);
    setTaskLists(taskLists.map((l) => l.id === list.id ? { ...l, items: [...l.items, { id: tempId, name, isCompleted: false }] } : l));
    const res = await fetch(`/api/study/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ listId: list.id, name, parentItemId: null, sessionId }),
    });
    if (!res.ok) return;
    // Server will broadcast the real list; for safety, remove temp when payload returns via pusher
  };

  const toggleItem = async (idx: number, ev?: React.MouseEvent) => {
    if (!myList) return;
    const target = (myList.items as any[])[idx];
    if (!target?.id) return;
    // Optimistic local toggle
    setTaskLists(taskLists.map((l) => l.id === (myList as any).id ? { ...l, items: l.items.map((it:any) => it.id === target.id ? { ...it, isCompleted: !target.isCompleted } : it) } : l));
    // XP bubble optimistic when checking
    if (!target.isCompleted && !target.xpAwarded && typeof window !== 'undefined') {
      const pt = ev ? { x: (ev.clientX || 0), y: (ev.clientY || 0) } : undefined;
      const evn = new CustomEvent('xp:awarded' as any, { detail: { amount: 2, from: pt } });
      window.dispatchEvent(evn);
    }
    // Persist
    const res = await fetch(`/api/study/items/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId, isCompleted: !target.isCompleted }),
    });
    try {
      if (res.ok) {
        const j = await res.json();
        const awarded = Number(j?.xpAwarded || 0);
        // If XP really awarded now (first completion), fetch progress for smooth bar update and schedule vanish
        if (awarded > 0) {
          try {
            const pr = await fetch('/api/me/progress');
            if (pr.ok) {
              const pj = await pr.json();
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('xp:awarded' as any, { detail: { amount: awarded, newLevel: pj.level, newPct: pj.pct, newInLevel: pj.inLevel, newSpan: pj.span } }));
              }
            }
          } catch {}
          // Mark vanish for this item so it pops and disappears after 4.5s
          setVanish((m) => ({ ...m, [target.id]: true }));
          setTimeout(() => setVanish((m) => { const c = { ...m }; delete c[target.id]; return c; }), 5000);
        }
      }
    } catch {}
  };

  const removeItem = async (id: number) => {
    if (!myList) return;
    // Optimistic removal
    setTaskLists(taskLists.map((l) => l.id === (myList as any).id ? { ...l, items: l.items.filter((it:any)=> it.id !== id) } : l));
    await fetch(`/api/study/items/${id}?sessionId=${sessionId}`, { method: 'DELETE', credentials: 'include' });
  };

  const items = ((myList?.items || []) as any[]).filter((it:any) => !it.isCompleted || vanish[it.id]);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xl">
      <h2 className="mb-3 text-lg font-semibold">My Tasks</h2>
      <ul className="mb-3 space-y-2">
        {items.map((n:any, i:number) => (
          <li key={n.id} className={`${vanish[n.id] ? 'animate-[popout_450ms_ease-in_forwards]' : ''}`}>
            <div className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/80 px-3 py-2 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30">
              <input
                type="checkbox"
                checked={!!n.isCompleted}
                onChange={(e) => toggleItem(i, e as any)}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className={`text-[15px] ${n.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>{n.name}</span>
              <span className="ml-auto hidden rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 group-hover:inline">Personal</span>
              <button className="ml-2 hidden rounded-full px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 group-hover:inline" onClick={()=>removeItem(n.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      {myUserId ? (
        <form onSubmit={addItem} className="flex gap-2">
          <input className="flex-1 rounded-2xl border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={item} onChange={(e) => setItem(e.target.value)} placeholder="Add a task" />
          <button className="rounded-2xl bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700">Add</button>
        </form>
      ) : (
        <div className="text-sm text-gray-600">Sign in to create and manage your tasks.</div>
      )}
      <style>{`@keyframes popout { 0% { transform: scale(1); opacity: 1; } 70% { transform: scale(1.06); opacity: .9; } 100% { transform: scale(0.85); opacity: 0; height: 0; margin: 0; padding: 0; } }`}</style>
    </div>
  );
}
