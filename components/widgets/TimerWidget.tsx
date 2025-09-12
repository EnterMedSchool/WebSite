"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type GroupState = { mode: "running" | "paused"; endAt: string | null; durationMs: number | null; pausedAt: string | null; updatedAt: string };

function msToMMSS(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TimerWidget() {
  const enabled = process.env.NEXT_PUBLIC_WIDGETS_ENABLED === '1' || process.env.NEXT_PUBLIC_WIDGETS_ENABLED === 'true';
  if (!enabled) return null as any;

  const [code, setCode] = useState<string | null>(null);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(25);
  const [state, setState] = useState<GroupState | null>(null);
  const etagRef = useRef<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [open, setOpen] = useState(false);

  // Load codes from localStorage
  useEffect(() => {
    try {
      const mc = localStorage.getItem('timer:myCode');
      const c = localStorage.getItem('timer:code') || mc;
      setMyCode(mc);
      setCode(c);
    } catch {}
  }, []);

  // Poll group state when we have a code
  useEffect(() => {
    let stop = false;
    if (!code) return;
    let interval: any; // number
    // Keep membership active: heartbeat join every ~3 minutes (throttled server-side)
    const beat = async () => {
      try { await fetch(`/api/timer/groups/${encodeURIComponent(code!)}/join`, { method: 'POST', credentials: 'include' }); } catch {}
    };
    const load = async () => {
      try {
        const headers: any = {};
        if (etagRef.current) headers['If-None-Match'] = etagRef.current;
        const res = await fetch(`/api/timer/groups/${encodeURIComponent(code)}`, { headers, cache: 'no-store' });
        if (res.status === 304) return; // unchanged
        if (res.ok) {
          const tag = res.headers.get('ETag');
          if (tag) etagRef.current = tag;
          const json = await res.json();
          const st: GroupState = json?.data?.state ?? null;
          if (st) setState(st);
          // owner determination heuristic: if myCode equals current code
          setIsOwner(Boolean(myCode && code === myCode));
        }
      } catch {}
    };
    const start = () => {
      void load();
      clearInterval(interval);
      interval = setInterval(load, document.visibilityState === 'visible' ? 10000 : 30000);
    };
    start();
    // do an immediate heartbeat and schedule periodic
    void beat();
    const beatId = setInterval(beat, 180000);
    const onVis = () => start();
    document.addEventListener('visibilitychange', onVis);
    return () => { stop = true; clearInterval(interval); clearInterval(beatId); document.removeEventListener('visibilitychange', onVis); };
  }, [code, myCode]);

  const remainingMs = useMemo(() => {
    if (!state?.endAt || state.mode !== 'running') return 0;
    const end = Date.parse(state.endAt);
    return Math.max(0, end - Date.now());
  }, [state]);

  const create = useCallback(async () => {
    try {
      const res = await fetch('/api/timer/groups', { method: 'POST', credentials: 'include' });
      if (!res.ok) return;
      const j = await res.json();
      const c = j?.data?.code as string;
      if (c) {
        localStorage.setItem('timer:myCode', c);
        localStorage.setItem('timer:code', c);
        setMyCode(c); setCode(c); setIsOwner(true);
        try { await fetch(`/api/timer/groups/${encodeURIComponent(c)}/join`, { method: 'POST', credentials: 'include' }); } catch {}
      }
    } catch {}
  }, []);

  const join = useCallback(async (entered: string) => {
    const clean = (entered || '').trim().toLowerCase();
    if (!clean) return;
    try {
      const res = await fetch(`/api/timer/groups/${encodeURIComponent(clean)}/join`, { method: 'POST', credentials: 'include' });
      if (!res.ok) return;
      localStorage.setItem('timer:code', clean);
      setCode(clean);
      setIsOwner(Boolean(myCode && clean === myCode));
    } catch {}
  }, [myCode]);

  const exitShared = useCallback(() => {
    const mc = myCode || null;
    if (mc) {
      localStorage.setItem('timer:code', mc);
      setCode(mc);
      setIsOwner(true);
    } else {
      setCode(null);
      setIsOwner(false);
    }
  }, [myCode]);

  const startTimer = useCallback(async () => {
    if (!code) return;
    const ms = Math.max(1, minutes) * 60 * 1000;
    const res = await fetch(`/api/timer/groups/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'start', durationMs: ms })
    });
    if (res.ok) {
      const tag = res.headers.get('ETag');
      if (tag) etagRef.current = tag;
      try { const j = await res.json(); setState(j?.data?.state ?? null); } catch {}
    }
  }, [code, minutes]);

  const pauseTimer = useCallback(async () => {
    if (!code) return;
    const res = await fetch(`/api/timer/groups/${encodeURIComponent(code)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action: 'pause' })
    });
    if (res.ok) { const tag = res.headers.get('ETag'); if (tag) etagRef.current = tag; try { const j = await res.json(); setState(j?.data?.state ?? null); } catch {} }
  }, [code]);

  const resetTimer = useCallback(async () => {
    if (!code) return;
    const res = await fetch(`/api/timer/groups/${encodeURIComponent(code)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action: 'reset' })
    });
    if (res.ok) { const tag = res.headers.get('ETag'); if (tag) etagRef.current = tag; try { const j = await res.json(); setState(j?.data?.state ?? null); } catch {} }
  }, [code]);

  const extendTimer = useCallback(async (addMin: number) => {
    if (!code) return;
    const res = await fetch(`/api/timer/groups/${encodeURIComponent(code)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action: 'extend', durationMs: Math.max(1, addMin) * 60 * 1000 })
    });
    if (res.ok) { const tag = res.headers.get('ETag'); if (tag) etagRef.current = tag; try { const j = await res.json(); setState(j?.data?.state ?? null); } catch {} }
  }, [code]);

  return (
    <div className="fixed bottom-6 right-6 z-[40] flex flex-col items-end gap-3">
      <div className="rounded-2xl border border-gray-300 bg-white/90 shadow-md backdrop-blur px-3 py-2">
        <div className="flex items-center gap-3">
          <button className="rounded-full bg-indigo-600 px-3 py-1 text-white text-sm" onClick={() => setOpen((o)=>!o)}>
            Timer {state?.mode === 'running' ? `· ${msToMMSS(remainingMs)}` : ''}
          </button>
          {code ? (
            <span className="text-xs text-gray-600">Code: <b>{code}</b></span>
          ) : (
            <span className="text-xs text-gray-600">No group</span>
          )}
        </div>
        {open && (
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <button className="rounded bg-gray-100 px-2 py-1" onClick={create}>Create</button>
              <JoinForm onJoin={join} />
              <button className="rounded bg-gray-100 px-2 py-1" onClick={exitShared}>Exit</button>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min={1} className="w-20 rounded border px-2 py-1" value={minutes} onChange={(e)=>setMinutes(Math.max(1, Number(e.target.value)||25))} />
              {isOwner ? (
                <>
                  <button className="rounded bg-indigo-600 px-2 py-1 text-white" onClick={startTimer}>Start</button>
                  <button className="rounded bg-gray-200 px-2 py-1" onClick={pauseTimer}>Pause</button>
                  <button className="rounded bg-gray-200 px-2 py-1" onClick={resetTimer}>Reset</button>
                  <button className="rounded bg-gray-200 px-2 py-1" onClick={()=>extendTimer(5)}>+5m</button>
                </>
              ) : (
                <span className="text-xs text-gray-500">View-only</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JoinForm({ onJoin }: { onJoin: (code: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); onJoin(v); }} className="flex items-center gap-1">
      <input value={v} onChange={(e)=>setV(e.target.value)} placeholder="Join code" className="w-24 rounded border px-2 py-1" />
      <button className="rounded bg-gray-200 px-2 py-1" type="submit">Join</button>
    </form>
  );
}
