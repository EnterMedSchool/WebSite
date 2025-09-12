"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Todo = { id: number; label: string; done: boolean };

// Wrapper to gate the widget by env flag without violating rules-of-hooks
export default function TasksWidget() {
  const enabled = process.env.NEXT_PUBLIC_WIDGETS_ENABLED === '1' || process.env.NEXT_PUBLIC_WIDGETS_ENABLED === 'true';
  if (!enabled) return null as any;
  return <EnabledTasksWidget />;
}

function EnabledTasksWidget() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Todo[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const [group, setGroup] = useState<Array<{ userId: number; user: any; items: { id: number; label: string }[] }>>([]);
  const etagRef = useRef<string | null>(null as any);
  const [capHint, setCapHint] = useState(false);

  const code = useMemo(() => { try { return localStorage.getItem('timer:code'); } catch { return null; } }, [open, groupOpen]);

  // Load my todos when opening
  useEffect(() => {
    if (!open) return;
    (async () => {
      try { const r = await fetch('/api/todos', { cache: 'no-store' }); if (r.ok) { const j = await r.json(); setItems(j?.data || []); } } catch {}
    })();
    // Check local cap flag for today
    try {
      const key = `xpCap:todo:${new Date().toISOString().slice(0,10)}`;
      setCapHint(localStorage.getItem(key) === '1');
    } catch {}
  }, [open]);

  // Load group snapshot every 60s when panel visible
  useEffect(() => {
    if (!open || !groupOpen || !code) return;
    let t: any;
    const load = async () => {
      try {
        const headers: any = {};
        if (etagRef.current) headers['If-None-Match'] = etagRef.current;
        const r = await fetch(`/api/timer/groups/${encodeURIComponent(code)}/tasks`, { cache: 'no-store', headers });
        if (r.status === 304) return;
        if (r.ok) {
          const tag = r.headers.get('ETag'); if (tag) etagRef.current = tag;
          const j = await r.json(); setGroup(j?.data || []);
        }
      } catch {}
    };
    void load();
    t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [open, groupOpen, code]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setNewLabel("");
    try { const r = await fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label }), credentials: 'include' }); if (r.ok) { const j = await r.json(); setItems((xs)=>[...xs, j.data]); } } catch {}
  };

  const toggle = async (id: number) => {
    const cur = items.find((x)=>x.id===id); if (!cur) return;
    setItems((xs)=>xs.map((x)=>x.id===id? { ...x, done: !x.done }: x));
    try {
      const r = await fetch(`/api/todos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ done: !cur.done }) });
      if (r.ok) {
        try {
          const j = await r.json();
          const awarded = Number(j?.xpAwarded || 0);
          if (!cur.done && awarded === 0) {
            // Mark cap reached for today; no extra API calls
            const key = `xpCap:todo:${new Date().toISOString().slice(0,10)}`;
            try { localStorage.setItem(key, '1'); } catch {}
            setCapHint(true);
            try { window.dispatchEvent(new CustomEvent('xp:cap' as any, { detail: { source: 'todo' } })); } catch {}
          } else if (!cur.done && awarded > 0) {
            const detail: any = { amount: awarded };
            const pg = j?.progress;
            if (pg) { detail.newLevel = pg.level; detail.newPct = pg.pct; detail.newInLevel = pg.inLevel; detail.newSpan = pg.span; }
            try { window.dispatchEvent(new CustomEvent('xp:awarded' as any, { detail })); } catch {}
          }
        } catch {}
      }
    } catch {}
  };

  const remove = async (id: number) => {
    setItems((xs)=>xs.filter((x)=>x.id!==id));
    try { await fetch(`/api/todos/${id}`, { method: 'DELETE', credentials: 'include' }); } catch {}
  };

  return (
    <div className="fixed bottom-6 right-6 z-[39] mr-[140px]">
      <div className="rounded-2xl border border-gray-300 bg-white/90 shadow-md backdrop-blur px-3 py-2">
        <div className="flex items-center gap-2">
          <button className="rounded-full bg-indigo-600 px-3 py-1 text-white text-sm" onClick={()=>setOpen((o)=>!o)}>Tasks</button>
        </div>
        {open && (
          <div className="mt-2 w-80 text-sm">
            {capHint && (
              <div className="mb-2 rounded border border-amber-300 bg-amber-50 p-2 text-[12px] text-amber-900">
                Daily XP cap reached for tasks. New completions won’t grant XP today.
              </div>
            )}
            <form onSubmit={add} className="mb-2 flex gap-2">
              <input className="flex-1 rounded border px-2 py-1" value={newLabel} onChange={(e)=>setNewLabel(e.target.value)} placeholder="Add a task" />
              <button className="rounded bg-gray-200 px-2">Add</button>
            </form>
            <ul className="max-h-56 overflow-auto space-y-1">
              {items.map((t)=> (
                <li key={t.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!t.done} onChange={()=>toggle(t.id)} />
                  <span className={t.done? 'line-through text-gray-400':''}>{t.label}</span>
                  <button className="ml-auto text-xs text-red-600" onClick={()=>remove(t.id)}>remove</button>
                </li>
              ))}
            </ul>
            {code && (
              <div className="mt-3">
                <button className="rounded bg-gray-100 px-2 py-1" onClick={()=>setGroupOpen((x)=>!x)}>{groupOpen? 'Hide group':'Show group'}</button>
                {groupOpen && (
                  <div className="mt-2 max-h-40 overflow-auto space-y-2">
                    {group.map((g)=> (
                      <div key={g.userId} className="rounded border p-2">
                        <div className="mb-1 text-xs font-semibold">{g.user?.name || g.user?.username || `User #${g.userId}`}</div>
                        <ul className="pl-3 list-disc">
                          {g.items.map((it)=> <li key={it.id}>{it.label}</li>)}
                        </ul>
                      </div>
                    ))}
                    {!group.length && <div className="text-xs text-gray-500">No active members.</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

