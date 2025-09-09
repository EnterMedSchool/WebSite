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

  if (!groups.length) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">Others&apos; Tasks</h2>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.userId} className="rounded border p-3">
            <div className="mb-2 font-medium">{(participants.find(p=>p.id===g.userId)?.name) || (participants.find(p=>p.id===g.userId)?.username) || `User #${g.userId}`}</div>
            {g.lists.map((l) => {
              return (
                <div key={l.id} className="mb-2">
                  <div className="text-sm font-semibold">{l.title}</div>
                  <ul className="pl-4 text-sm">
                    {(l.items || []).map((n:any) => (
                      <li key={n.id} className={n.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}>{n.name}</li>
                    ))}
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
