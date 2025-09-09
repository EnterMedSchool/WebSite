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
        if (awarded > 0) {
          const pg = j?.progress;
          if (pg && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('xp:awarded' as any, { detail: { amount: awarded, newLevel: pg.level, newPct: pg.pct, newInLevel: pg.inLevel, newSpan: pg.span } }));
          }
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
    <div className="rounded-[28px] border border-gray-200 bg-gradient-to-b from-indigo-50 to-white p-5 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M7 21a1 1 0 0 1-1-1V6h10v14a1 1 0 0 1-1 1H7Zm2-3h6V8H9v10Zm-3-14V4h12v2H6Z"/></svg>
          My Tasks
        </div>
      </div>
      <ul className="mb-3 space-y-2">
        {items.map((n:any, i:number) => (
          <li key={n.id} className={`${vanish[n.id] ? 'animate-[popout_450ms_ease-in_forwards]' : ''}`}>
            <label className="vlTaskBox">
              <input type="checkbox" checked={!!n.isCompleted} onChange={(e)=>toggleItem(i, e as any)} />
              <div className="vlCheck" />
              <span className={`vlText ${n.isCompleted ? 'vlDone' : ''}`}>{n.name}</span>
              <button className="vlRemove" onClick={(e)=>{ e.preventDefault(); removeItem(n.id); }}>Remove</button>
            </label>
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
      <style jsx>{`
        @keyframes popout { 0% { transform: scale(1); opacity: 1; } 70% { transform: scale(1.06); opacity: .9; } 100% { transform: scale(0.85); opacity: 0; height: 0; margin: 0; padding: 0; } }
        .vlTaskBox { display:flex; align-items:center; gap:12px; position:relative; cursor:pointer; user-select:none; padding:10px 12px; border-radius:16px; background:linear-gradient(180deg,#fff, #f9f9ff); border:1px solid rgba(99,102,241,0.18); box-shadow:0 2px 8px rgba(0,0,0,0.04); transition:background .2s, box-shadow .2s; }
        .vlTaskBox:hover { background:linear-gradient(180deg,#f7f7ff,#ffffff); box-shadow:0 6px 18px rgba(99,102,241,0.10); }
        .vlTaskBox input { position:absolute; opacity:0; height:0; width:0; }
        .vlCheck { position:relative; width:22px; height:22px; background:#d1d5db; border-radius:6px; box-shadow:1px 1px 0 #b7b7b7; transition:all .2s; flex:0 0 auto; }
        .vlTaskBox input:checked ~ .vlCheck { background-image:linear-gradient(45deg,#643ddb 0%, #d915ef 100%); box-shadow:3px 3px 0 #b7b7b7; }
        .vlCheck:after { content:""; position:absolute; left:8px; top:5px; width:4px; height:9px; border:solid #fff; border-width:0 2px 2px 0; transform:rotate(45deg); opacity:0; transition:opacity .2s; }
        .vlTaskBox input:checked ~ .vlCheck:after { opacity:1; }
        .vlText { font-size:15px; color:#1f2937; }
        .vlDone { color:#9ca3af; text-decoration:line-through; }
        .vlRemove { margin-left:auto; display:none; border-radius:999px; padding:2px 8px; font-size:12px; color:#b91c1c; }
        .vlTaskBox:hover .vlRemove { display:inline-block; background:#fff0f0; }
      `}</style>
    </div>
  );
}
