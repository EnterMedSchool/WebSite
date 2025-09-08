"use client";

import { useMemo } from "react";
import { useStudyStore } from "@/lib/study/store";

export default function OthersTasks() {
  const myUserId = useStudyStore((s) => s.myUserId);
  const taskLists = useStudyStore((s) => s.taskLists);
  const participants = useStudyStore((s) => s.participants);

  const groups = useMemo(() => {
    const byUser: Record<number, { userId: number; lists: any[] }> = {} as any;
    const presentIds = new Set<number>(participants.map((p) => p.id));
    for (const l of taskLists) {
      if (l.userId === myUserId) continue;
      if (!presentIds.has(l.userId)) continue; // hide lists from users not present
      if (!byUser[l.userId]) byUser[l.userId] = { userId: l.userId, lists: [] };
      byUser[l.userId].lists.push(l);
    }
    return Object.values(byUser);
  }, [taskLists, myUserId, participants]);

  const buildTree = (items:any[]) => {
    const byParent: Record<string, any[]> = {};
    items.forEach((it:any)=>{
      const k = String(it.parentItemId ?? 'root');
      (byParent[k] = byParent[k] || []).push(it);
    });
    const sortInPlace = (arr:any[]) => arr.sort((a,b)=> (a.position??0)-(b.position??0));
    Object.values(byParent).forEach(sortInPlace);
    const build = (parentId: number | null): any[] => (byParent[String(parentId ?? 'root')] || []).map((it:any)=> ({ ...it, children: build(it.id) }));
    return build(null);
  };
  if (!groups.length) return null;

  return (
    <div className="border rounded p-4">
      <h2 className="font-semibold mb-3">Others' Tasks</h2>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.userId} className="border rounded p-3">
            <div className="font-medium mb-2">User #{g.userId}</div>
            {g.lists.map((l) => {
              const tree = buildTree(l.items || []);
              const render = (n:any, depth=0) => (
                <li key={n.id} className={n.isCompleted ? 'line-through' : ''}>
                  <div style={{ paddingLeft: depth*10 }}>{n.name}</div>
                  {n.children?.length>0 && <ul className="pl-3">{n.children.map((c:any)=>render(c, depth+1))}</ul>}
                </li>
              );
              return (
                <div key={l.id} className="mb-2">
                  <div className="text-sm font-semibold">{l.title}</div>
                  <ul className="pl-4 text-sm">
                    {tree.map((n:any)=>render(n,0))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
