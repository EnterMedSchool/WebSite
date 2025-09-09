"use client";

import { useEffect, useMemo, useState } from "react";

type Message = { id: number; userId: number; content: string; createdAt: string; user?: { name?: string | null; username?: string | null } };
type TaskItem = { id: number; name: string; isCompleted: boolean; xpAwarded?: boolean };

export default function QuickDock() {
  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
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
  const tick = useTick(panelOpen ? 1000 : null);
  const [showTimer, setShowTimer] = useState(false);

  // When opening, resolve last session and join it (so lists are visible)
  useEffect(() => {
    if (!panelOpen) return;
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
  }, [panelOpen]);

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
          const pg = j?.progress;
          if (pg && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('xp:awarded' as any, { detail: { amount: awarded, newLevel: pg.level, newPct: pg.pct, newInLevel: pg.inLevel, newSpan: pg.span } }));
          }
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
    <div className="fixed right-5 top-1/2 z-[60] -translate-y-1/2 flex items-center gap-4">
      {/* Vertical rail */}
      <div className="flex flex-col items-center gap-3 rounded-full border border-gray-200 bg-white/90 px-3 py-4 shadow-xl backdrop-blur">
        {/* Tasks */}
        <div className="group relative">
          <button onClick={() => { setTab('tasks'); setPanelOpen(true); }} className="grid h-10 w-10 place-items-center rounded-full text-gray-700 ring-1 ring-gray-200 transition hover:bg-emerald-500 hover:text-white hover:ring-emerald-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M7 21a1 1 0 0 1-1-1V6h10v14a1 1 0 0 1-1 1H7Zm2-3h6V8H9v10Zm-3-14V4h12v2H6Z"/></svg>
          </button>
          <div className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0">
            <div className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow">
              Tasks
            </div>
          </div>
        </div>
        {/* Timer */}
        <div className="group relative">
          <button onClick={() => { setShowTimer(true); }} className="grid h-10 w-10 place-items-center rounded-full text-gray-700 ring-1 ring-gray-200 transition hover:bg-rose-500 hover:text-white hover:ring-rose-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1Zm.75 5h-1.5v6l5.25 3.15.75-1.23-4.5-2.67Z"/></svg>
          </button>
          <div className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100">
            <div className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow">
              Timer
            </div>
          </div>
        </div>
        {/* Chat */}
        <div className="group relative">
          <button onClick={() => { setTab('chat'); setPanelOpen(true); }} className="grid h-10 w-10 place-items-center rounded-full text-gray-700 ring-1 ring-gray-200 transition hover:bg-indigo-500 hover:text-white hover:ring-indigo-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M2 3h20v14H6l-4 4V3Zm4 4v2h12V7H6Zm0 4v2h9v-2H6Z"/></svg>
          </button>
          <div className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100">
            <div className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white shadow">
              Chat
            </div>
          </div>
        </div>
      </div>

      {/* Panel */}
      {panelOpen && (
        <div className="w-[360px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2 text-white">
            <div className="text-sm font-semibold">Virtual Library</div>
            <div className="flex gap-1">
              <button className={`rounded px-2 py-1 text-xs ${tab==='tasks'?'bg-white/20':''}`} onClick={()=>setTab('tasks')}>Tasks</button>
              <button className={`rounded px-2 py-1 text-xs ${tab==='timer'?'bg-white/20':''}`} onClick={()=>setTab('timer')}>Timer</button>
              <button className={`rounded px-2 py-1 text-xs ${tab==='chat'?'bg-white/20':''}`} onClick={()=>setTab('chat')}>Chat</button>
              <button className="ml-1 rounded px-2 py-1 text-xs hover:bg-white/20" onClick={()=>setPanelOpen(false)} aria-label="Close">×</button>
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
                <ul className="mb-2 space-y-2">
                  {tasks.filter((t)=> !t.isCompleted || vanish[t.id]).map((t, i) => (
                    <li key={t.id} className={`${vanish[t.id] ? 'animate-[popout_450ms_ease-in_forwards]' : ''}`}>
                      <label className="vlTaskBox">
                        <input type="checkbox" checked={!!t.isCompleted} onChange={(e)=>toggle(i, e as any)} />
                        <div className="vlCheck" />
                        <span className={`vlText ${t.isCompleted ? 'vlDone' : ''}`}>{t.name}</span>
                      </label>
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
          <style jsx>{`@keyframes popout { 0% { transform: scale(1); opacity: 1; } 70% { transform: scale(1.06); opacity: .9; } 100% { transform: scale(0.85); opacity: 0; height: 0; margin: 0; padding: 0; } }
            .vlTaskBox { display:flex; align-items:center; gap:10px; position:relative; cursor:pointer; user-select:none; padding:8px 10px; border-radius:14px; background:linear-gradient(180deg,#fff, #f9f9ff); border:1px solid rgba(99,102,241,0.18); box-shadow:0 2px 8px rgba(0,0,0,0.04); transition:background .2s, box-shadow .2s; }
            .vlTaskBox:hover { background:linear-gradient(180deg,#f7f7ff,#ffffff); box-shadow:0 6px 18px rgba(99,102,241,0.10); }
            .vlTaskBox input { position:absolute; opacity:0; height:0; width:0; }
            .vlCheck { position:relative; width:20px; height:20px; background:#d1d5db; border-radius:6px; box-shadow:1px 1px 0 #b7b7b7; transition:all .2s; flex:0 0 auto; }
            .vlTaskBox input:checked ~ .vlCheck { background-image:linear-gradient(45deg,#643ddb 0%, #d915ef 100%); box-shadow:3px 3px 0 #b7b7b7; }
            .vlCheck:after { content:""; position:absolute; left:7px; top:4px; width:4px; height:8px; border:solid #fff; border-width:0 2px 2px 0; transform:rotate(45deg); opacity:0; transition:opacity .2s; }
            .vlTaskBox input:checked ~ .vlCheck:after { opacity:1; }
            .vlText { font-size:14px; color:#1f2937; }
            .vlDone { color:#9ca3af; text-decoration:line-through; }
          `}</style>
        </div>
      )}
      {showTimer && (
        <TimerOverlay onClose={() => setShowTimer(false)} />
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

function TimerOverlay({ onClose }: { onClose: () => void }) {
  // Lazy import to keep QuickDock light
  const [Comp, setComp] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    import("@/components/study/timer/FloatingTimer").then((m) => { if (mounted) setComp(() => m.default); });
    return () => { mounted = false; };
  }, []);
  if (!Comp) return null;
  return <Comp open={true} onClose={onClose} />;
}


