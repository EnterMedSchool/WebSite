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
    if (!target.isCompleted && typeof window !== 'undefined') {
      const pt = ev ? { x: (ev.clientX || 0), y: (ev.clientY || 0) } : undefined;
      const evn = new CustomEvent('xp:awarded' as any, { detail: { amount: 2, from: pt } });
      window.dispatchEvent(evn);
    }
    // Persist
    await fetch(`/api/study/items/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId, isCompleted: !target.isCompleted }),
    });
  };

  const removeItem = async (id: number) => {
    if (!myList) return;
    // Optimistic removal
    setTaskLists(taskLists.map((l) => l.id === (myList as any).id ? { ...l, items: l.items.filter((it:any)=> it.id !== id) } : l));
    await fetch(`/api/study/items/${id}?sessionId=${sessionId}`, { method: 'DELETE', credentials: 'include' });
  };

  const items = (myList?.items || []) as any[];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">My Tasks</h2>
      <ul className="mb-3 space-y-1">
        {items.map((n:any, i:number) => (
          <li key={n.id} className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={!!n.isCompleted}
              onChange={(e) => toggleItem(i, e as any)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className={`text-sm ${n.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>{n.name}</span>
            <button className="ml-auto hidden rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 group-hover:inline" onClick={()=>removeItem(n.id)}>Remove</button>
          </li>
        ))}
      </ul>
      {myUserId ? (
        <form onSubmit={addItem} className="flex gap-2">
          <input className="flex-1 rounded border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={item} onChange={(e) => setItem(e.target.value)} placeholder="Add a task" />
          <button className="rounded bg-indigo-600 px-3 py-2 text-white shadow hover:bg-indigo-700">Add</button>
        </form>
      ) : (
        <div className="text-sm text-gray-600">Sign in to create and manage your tasks.</div>
      )}
    </div>
  );
}
