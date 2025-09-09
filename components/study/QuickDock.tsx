"use client";

import { useEffect, useMemo, useState } from "react";

type Message = { id: number; userId: number; content: string; createdAt: string; user?: { name?: string | null; username?: string | null } };
type TaskItem = { id: number; name: string; isCompleted: boolean; xpAwarded?: boolean };

export default function QuickDock() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"tasks" | "timer" | "chat">("tasks");
  const [slug, setSlug] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [vanish, setVanish] = useState<Record<number, boolean>>({});
  const [newTask, setNewTask] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sharedEndAt, setSharedEndAt] = useState<string | null>(null);
  const tick = useTick(open ? 1000 : null);

  // When opening, resolve last session and join it (so lists are visible)
  useEffect(() => {
    if (!open) return;
    (async () => {
      if (sessionId) return; // already loaded
      setLoading(true);
      try {
        const meta = await fetch('/api/study/user/meta', { credentials: 'include' });
        if (!meta.ok) { setLoading(false); return; }
        const mj = await meta.json();
        const slug = mj?.data?.lastSessionSlug;
        if (!slug) { setLoading(false); return; }
        setSlug(slug);
        // Join to become a participant
        await fetch(`/api/study/sessions/${encodeURIComponent(slug)}/join`, { method: 'PATCH', credentials: 'include' });
        const rs = await fetch(`/api/study/sessions/${encodeURIComponent(slug)}`);
        if (!rs.ok) { setLoading(false); return; }
        const rj = await rs.json();
        const id = Number(rj?.data?.id);
        setSessionId(id);
        setSharedEndAt(rj?.data?.sharedEndAt ?? null);
        // Load tasks & messages
        await Promise.all([reloadTasks(id), reloadMessages(id)]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  async function reloadTasks(id: number) {
    // Ask server to return/create my global list for this session context
    const r = await fetch('/api/study/tasks', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: id, isGlobal: true }) });
    if (!r.ok) return;
    const j = await r.json();
    const items = (j?.data?.items || []) as any[];
    setTasks(items.map((it: any) => ({ id: it.id, name: it.name, isCompleted: !!it.isCompleted, xpAwarded: !!it.xpAwarded })));
  }

  async function reloadMessages(id: number) {
    const r = await fetch(`/api/study/messages?sessionId=${id}`);
    if (!r.ok) return;
    const j = await r.json();
    setMessages((j?.data || []) as Message[]);
  }

  const remaining = useMemo(() => {
    if (!sharedEndAt) return 0;
    const target = new Date(sharedEndAt).getTime();
    return Math.max(0, target - Date.now());
  }, [sharedEndAt, tick]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTask.trim();
    if (!name || !sessionId) return;
    setNewTask("");
    const listId = await ensureListId();
    if (!listId) return;
    setTasks([...tasks, { id: -Math.floor(Math.random()*1e9), name, isCompleted: false }]);
    await fetch('/api/study/items', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId, name, sessionId }) });
    await reloadTasks(sessionId);
  };

  async function ensureListId(): Promise<number | null> {
    if (!sessionId) return null;
    // Ask server to return/create my global list
    const r = await fetch('/api/study/tasks', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, isGlobal: true }) });
    if (!r.ok) return null;
    const j = await r.json();
    return Number(j?.data?.id || null);
  }

  const toggle = async (i: number, ev?: React.MouseEvent) => {
    const t = tasks[i];
    if (!t || !sessionId) return;
    setTasks(tasks.map((x, idx) => idx === i ? { ...x, isCompleted: !x.isCompleted } : x));
    if (!t.isCompleted && !t.xpAwarded && typeof window !== 'undefined') {
      const pt = ev ? { x: (ev.clientX||0), y: (ev.clientY||0) } : undefined;
      window.dispatchEvent(new CustomEvent('xp:awarded' as any, { detail: { amount: 2, from: pt } }));
    }
    const r = await fetch(`/api/study/items/${t.id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, isCompleted: !t.isCompleted }) });
    if (r.ok) {
      try {
        const j = await r.json();
        const awarded = Number(j?.xpAwarded || 0);
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
          setVanish((m) => ({ ...m, [t.id]: true }));
          setTimeout(() => setVanish((m) => { const c = { ...m }; delete c[t.id]; return c; }), 5000);
        }
      } catch {}
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !sessionId) return;
    const content = text.trim();
    setText("");
    await fetch('/api/study/messages', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, content }) });
    await reloadMessages(sessionId);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="group rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 p-0.5 shadow-xl"
        aria-expanded={open}
        title="Virtual Library Quick Dock"
      >
        <span className="block rounded-full bg-white px-4 py-3 text-sm font-bold text-indigo-700 transition group-hover:bg-white/95">VL</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute bottom-14 right-0 w-[340px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 px-3 py-2 text-white">
            <div className="text-sm font-semibold">Virtual Library</div>
            <div className="flex gap-1">
              <button className={`rounded px-2 py-1 text-xs ${tab==='tasks'?'bg-white/20':''}`} onClick={()=>setTab('tasks')}>Tasks</button>
              <button className={`rounded px-2 py-1 text-xs ${tab==='timer'?'bg-white/20':''}`} onClick={()=>setTab('timer')}>Timer</button>
              <button className={`rounded px-2 py-1 text-xs ${tab==='chat'?'bg-white/20':''}`} onClick={()=>setTab('chat')}>Chat</button>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-3">
            {loading && <div className="text-sm text-gray-600">Loading…</div>}
            {!loading && !slug && (
              <div className="text-sm text-gray-600">
                No active room. <a href="/study-rooms/new" className="text-indigo-600 underline">Open my room</a>
              </div>
            )}
            {!loading && slug && tab === 'tasks' && (
              <div>
                <ul className="mb-2 space-y-1">
                  {tasks.filter((t)=> !t.isCompleted || vanish[t.id]).map((t, i) => (
                    <li key={t.id} className={`flex items-center gap-2 ${vanish[t.id] ? 'animate-[popout_450ms_ease-in_forwards]' : ''}`}>
                      <input type="checkbox" checked={!!t.isCompleted} onChange={(e)=>toggle(i, e as any)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                      <span className={`text-sm ${t.isCompleted? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.name}</span>
                    </li>
                  ))}
                </ul>
                <form onSubmit={addTask} className="flex gap-2">
                  <input className="flex-1 rounded border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task" />
                  <button className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Add</button>
                </form>
              </div>
            )}
            {!loading && slug && tab === 'timer' && (
              <div className="text-center text-2xl font-mono">
                {formatMS(remaining)}
                <div className="mt-2 text-xs text-gray-500">Shared timer (view-only)</div>
                <a className="mt-2 inline-block text-xs font-semibold text-indigo-700 underline" href={`/study-rooms/${slug}`}>Open room</a>
              </div>
            )}
            {!loading && slug && tab === 'chat' && (
              <div>
                <div className="mb-2 max-h-[38vh] overflow-y-auto rounded border p-2 text-sm">
                  {messages.map((m)=> (
                    <div key={m.id} className="mb-1"><span className="opacity-60 mr-1">[{new Date(m.createdAt).toLocaleTimeString()}]</span><span className="font-medium mr-1">{m.user?.name || m.user?.username || `User #${m.userId}`}:</span>{m.content}</div>
                  ))}
                </div>
                <form onSubmit={send} className="flex gap-2">
                  <input className="flex-1 rounded border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={text} onChange={(e)=>setText(e.target.value)} placeholder="Message" />
                  <button className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Send</button>
                </form>
              </div>
            )}
          </div>
          <style>{`@keyframes popout { 0% { transform: scale(1); opacity: 1; } 70% { transform: scale(1.06); opacity: .9; } 100% { transform: scale(0.85); opacity: 0; height: 0; margin: 0; padding: 0; } }`}</style>
        </div>
      )}
    </div>
  );
}

function useTick(ms: number | null) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!ms) return;
    const id = setInterval(() => setN((v) => v + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return n;
}

function formatMS(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
