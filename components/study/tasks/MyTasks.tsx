"use client";

import { useMemo, useState, useCallback } from "react";
import { useStudyStore } from "@/lib/study/store";

export default function MyTasks() {
  const sessionId = useStudyStore((s) => s.sessionId);
  const myUserId = useStudyStore((s) => s.myUserId);
  const taskLists = useStudyStore((s) => s.taskLists);
  const upsertTaskList = useStudyStore((s) => s.upsertTaskList);

  const myList = useMemo(() => taskLists.find((l) => l.userId === myUserId) || null, [taskLists, myUserId]);
  const [title, setTitle] = useState(myList?.title || "My Tasks");
  const [item, setItem] = useState("");
  const [dragId, setDragId] = useState<number | null>(null);

  const ensureList = async () => {
    if (myList || !sessionId) return myList;
    const res = await fetch("/api/study/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
    const nextPosition = (myList?.items?.reduce((m:any,it:any)=>Math.max(m, Number(it.position||0)), 0) ?? 0) + 1;
    const updated = { ...myList, id: list.id, title: list.title || title, items: [...(myList?.items || []), { id: Date.now(), name, isCompleted: false, parentItemId: null, position: nextPosition }] };
    // optimistic
    upsertTaskList(updated as any);
    setItem("");
    await fetch(`/api/study/tasks/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: updated.title, items: updated.items.map((it: any) => ({ id: it.id>0?it.id:undefined, name: it.name, isCompleted: !!it.isCompleted, parentItemId: it.parentItemId ?? null, position: it.position ?? 0 })) }),
    });
  };

  const toggleItem = async (idx: number) => {
    if (!myList) return;
    const clone = { ...myList, items: myList.items.map((it, i) => (i === idx ? { ...it, isCompleted: !it.isCompleted } : it)) } as any;
    upsertTaskList(clone);
    const res = await fetch(`/api/study/tasks/${myList.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: clone.title, items: clone.items.map((it:any) => ({ id: it.id, name: it.name, isCompleted: it.isCompleted, parentItemId: it.parentItemId ?? null, position: it.position ?? 0 })) }),
    });
    if (res.ok) {
      try {
        const data = await res.json();
        const awarded = Number(data?.xpAwarded || 0);
        if (awarded > 0 && typeof window !== 'undefined') {
          const ev = new CustomEvent('xp:awarded' as any, { detail: { amount: awarded } });
          window.dispatchEvent(ev);
        }
      } catch {}
    }
  };

  const removeItem = async (id: number) => {
    if (!myList) return;
    const withSubtreeRemoved = (items: any[], targetId: number): any[] => {
      const toDelete = new Set<number>();
      const mark = (pid: number) => {
        toDelete.add(pid);
        items.filter((x:any)=>x.parentItemId===pid).forEach((c:any)=>mark(c.id));
      };
      mark(targetId);
      return items.filter((x:any)=>!toDelete.has(x.id));
    };
    const nextItems = withSubtreeRemoved(myList.items as any[], id);
    const clone = { ...myList, items: nextItems } as any;
    upsertTaskList(clone);
    await fetch(`/api/study/tasks/${myList.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: clone.title, items: clone.items.map((it:any)=>({ id: it.id, name: it.name, isCompleted: it.isCompleted, parentItemId: it.parentItemId ?? null, position: it.position ?? 0 })) })
    });
  };

  const dropAsChild = async (dragItemId: number, targetId: number) => {
    if (!myList) return;
    const updatedItems = (myList.items as any[]).map((it:any)=> it.id===dragItemId ? { ...it, parentItemId: targetId } : it );
    const clone = { ...myList, items: updatedItems } as any;
    upsertTaskList(clone);
    await fetch(`/api/study/tasks/${myList.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: clone.title, items: clone.items.map((it:any)=>({ id: it.id, name: it.name, isCompleted: it.isCompleted, parentItemId: it.parentItemId ?? null, position: it.position ?? 0 })) })
    });
  };

  const tree = useMemo(() => {
    const items = myList?.items || [];
    const byParent: Record<string, any[]> = {};
    items.forEach((it:any)=>{
      const k = String(it.parentItemId ?? 'root');
      byParent[k] = byParent[k] || [];
      byParent[k].push(it);
    });
    const sortInPlace = (arr:any[]) => arr.sort((a,b)=> (a.position??0)-(b.position??0));
    Object.values(byParent).forEach(sortInPlace);
    const build = (parentId: number | null) => (byParent[String(parentId ?? 'root')] || []).map((it:any)=> ({ ...it, children: build(it.id) }));
    return build(null);
  }, [myList]);

  const onDragStart = useCallback((id:number)=> setDragId(id), []);
  const onDropOn = useCallback((targetId:number)=> { if (dragId!=null) dropAsChild(dragId, targetId); setDragId(null); }, [dragId]);

  const renderNode = (node:any, depth:number=0) => (
    <li key={node.id} className="py-1" draggable onDragStart={()=>onDragStart(node.id)} onDragOver={(e)=>e.preventDefault()} onDrop={()=>onDropOn(node.id)}>
      <div className="flex items-center gap-2" style={{ paddingLeft: depth*12 }}>
        <input type="checkbox" checked={!!node.isCompleted} onChange={() => toggleItem((myList?.items as any[]).findIndex((x:any)=>x.id===node.id))} />
        <span className={node.isCompleted ? "line-through" : ""}>{node.name}</span>
        <button className="ml-auto text-xs text-red-600" onClick={()=>removeItem(node.id)}>X</button>
      </div>
      {node.children && node.children.length>0 && (
        <ul className="ml-3">
          {node.children.map((c:any)=>renderNode(c, depth+1))}
        </ul>
      )}
    </li>
  );

  return (
    <div className="border rounded p-4">
      <h2 className="font-semibold mb-3">My Tasks</h2>
      <ul className="space-y-1 mb-3">
        {tree.map((n:any)=>renderNode(n,0))}
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
