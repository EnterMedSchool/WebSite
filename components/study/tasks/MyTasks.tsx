"use client";

import { useMemo, useState } from "react";
import { useStudyStore } from "@/lib/study/store";

export default function MyTasks() {
  const sessionId = useStudyStore((s) => s.sessionId);
  const myUserId = useStudyStore((s) => s.myUserId);
  const taskLists = useStudyStore((s) => s.taskLists);
  const upsertTaskList = useStudyStore((s) => s.upsertTaskList);

  const myList = useMemo(() => taskLists.find((l) => l.userId === myUserId) || null, [taskLists, myUserId]);
  const [title, setTitle] = useState(myList?.title || "My Tasks");
  const [item, setItem] = useState("");

  const ensureList = async () => {
    if (myList || !sessionId) return myList;
    const res = await fetch("/api/study/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, title }),
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
    const updated = { ...myList, id: list.id, title: list.title || title, items: [...(myList?.items || []), { id: Date.now(), name, isCompleted: false }] };
    // optimistic
    upsertTaskList(updated as any);
    setItem("");
    await fetch(`/api/study/tasks/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: updated.title, items: updated.items.map((it: any) => ({ name: it.name, isCompleted: !!it.isCompleted })) }),
    });
  };

  const toggleItem = async (idx: number) => {
    if (!myList) return;
    const clone = { ...myList, items: myList.items.map((it, i) => (i === idx ? { ...it, isCompleted: !it.isCompleted } : it)) };
    upsertTaskList(clone);
    await fetch(`/api/study/tasks/${myList.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: clone.title, items: clone.items.map((it) => ({ name: it.name, isCompleted: it.isCompleted })) }),
    });
  };

  return (
    <div className="border rounded p-4">
      <h2 className="font-semibold mb-3">My Tasks</h2>
      <ul className="space-y-2 mb-3">
        {(myList?.items || []).map((it, i) => (
          <li key={`${it.name}-${i}`} className="flex items-center gap-2">
            <input type="checkbox" checked={it.isCompleted} onChange={() => toggleItem(i)} />
            <span className={it.isCompleted ? "line-through" : ""}>{it.name}</span>
          </li>
        ))}
      </ul>
      {myUserId ? (
        <form onSubmit={addItem} className="flex gap-2">
          <input className="flex-1 border rounded p-2" value={item} onChange={(e) => setItem(e.target.value)} placeholder="Add a task" />
          <button className="border rounded px-3">Add</button>
        </form>
      ) : (
        <div className="text-sm text-gray-600">Sign in to create and manage your tasks.</div>
      )}
    </div>
  );
}
