"use client";

import { useMemo } from "react";
import { useStudyStore } from "@/lib/study/store";

export default function OthersTasks() {
  const myUserId = useStudyStore((s) => s.myUserId);
  const taskLists = useStudyStore((s) => s.taskLists);

  const groups = useMemo(() => {
    const byUser: Record<number, { userId: number; lists: any[] }> = {} as any;
    for (const l of taskLists) {
      if (l.userId === myUserId) continue;
      if (!byUser[l.userId]) byUser[l.userId] = { userId: l.userId, lists: [] };
      byUser[l.userId].lists.push(l);
    }
    return Object.values(byUser);
  }, [taskLists, myUserId]);

  if (!groups.length) return null;

  return (
    <div className="border rounded p-4">
      <h2 className="font-semibold mb-3">Others’ Tasks</h2>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.userId} className="border rounded p-3">
            <div className="font-medium mb-2">User #{g.userId}</div>
            {g.lists.map((l) => (
              <div key={l.id} className="mb-2">
                <div className="text-sm font-semibold">{l.title}</div>
                <ul className="list-disc pl-5 text-sm">
                  {l.items?.map((it: any, i: number) => (
                    <li key={`${it.name}-${i}`} className={it.isCompleted ? "line-through" : ""}>{it.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

