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
  return <EnabledTimerWidget />;
}

function EnabledTimerWidget() {

  const [code, setCode] = useState<string | null>(null);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(25);
  const [state, setState] = useState<GroupState | null>(null);
  const etagRef = useRef<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [open, setOpen] = useState(false);
  const winIdRef = useRef<string>(Math.random().toString(36).slice(2));
  const [isLeader, setIsLeader] = useState(false);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Load codes from localStorage
  useEffect(() => {
    try {
      const mc = localStorage.getItem('timer:myCode');
      const c = localStorage.getItem('timer:code') || mc;
      setMyCode(mc);
      setCode(c);
    } catch {}
  }, []);

  // Leader election helpers (localStorage-based)
  const lockKey = code ? `timer:leader:${code}` : null;
  const tryAcquireLeader = useCallback(() => {
    if (!lockKey) return false;
    try {
      const now = Date.now();
      const raw = localStorage.getItem(lockKey);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj.ts === 'number' && now - obj.ts < 15000) {
          // active leader exists
          setIsLeader(obj.id === winIdRef.current);
          return obj.id === winIdRef.current;
        }
      }
      const mine = { id: winIdRef.current, ts: now };
      localStorage.setItem(lockKey, JSON.stringify(mine));
      setIsLeader(true);
      return true;
    } catch { return false; }
  }, [lockKey]);
  const refreshLeader = useCallback(() => {
    if (!lockKey) return;
    try {
      const mine = { id: winIdRef.current, ts: Date.now() };
      localStorage.setItem(lockKey, JSON.stringify(mine));
    } catch {}
  }, [lockKey]);

  useEffect(() => {
    if (!code) { setIsLeader(false); return; }
    // periodic renew / check
    const id = setInterval(() => { tryAcquireLeader(); if (isLeader) refreshLeader(); }, 5000);
    return () => clearInterval(id);
  }, [code, tryAcquireLeader, refreshLeader, isLeader]);

  // BroadcastChannel for state sharing across tabs
  useEffect(() => {
    if (!code || typeof BroadcastChannel === 'undefined') { bcRef.current = null; return; }
    const bc = new BroadcastChannel(`timer:${code}`);
    bcRef.current = bc;
    const onMsg = (ev: MessageEvent) => {
      try {
        const d = ev.data || {};
        if (d && d.type === 'state' && d.code === code) {
          if (d.etag) etagRef.current = d.etag;
          if (d.state) setState(d.state);
        }
      } catch {}
    };
    bc.addEventListener('message', onMsg as any);
    return () => { try { bc.removeEventListener('message', onMsg as any); bc.close(); } catch {} };
  }, [code]);

  // Poll group state when we have a code (leader only). Others listen to BroadcastChannel.
  useEffect(() => {
    let stop = false;
    if (!code) return;
    let interval: any; // number
    const load = async () => {
      if (!isLeader) return;
      try {
        const headers: any = {};
        if (etagRef.current) headers['If-None-Match'] = etagRef.current;
        headers['X-Join'] = '1';
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
          // Broadcast to other tabs
          try { bcRef.current?.postMessage({ type: 'state', code, etag: etagRef.current, state: st }); } catch {}
        }
      } catch {}
    };
    const start = () => {
      void load();
      clearInterval(interval);
      const fast = 10000; const slow = 30000; const idle = 60000;
      const endTs = state?.endAt ? Date.parse(state.endAt) : 0;
      const expired = (state?.mode === 'running') && endTs > 0 && endTs <= Date.now();
      const isRun = (state?.mode === 'running') && !expired;
      const base = isRun ? fast : (expired ? idle : slow);
      interval = setInterval(load, document.visibilityState === 'visible' ? base : idle);
    };
    start();
    const onVis = () => start();
    document.addEventListener('visibilitychange', onVis);
    return () => { stop = true; clearInterval(interval); document.removeEventListener('visibilitychange', onVis); };
  }, [code, myCode, isLeader, state?.mode]);

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
            <span className="text-xs text-gray-600 flex items-center gap-2">
              <span>Code: <b>{code}</b>{isOwner ? ' (owner)' : ''}</span>
              <button className="rounded bg-gray-100 px-2 py-0.5" onClick={()=>{ try { navigator.clipboard.writeText(code!); } catch {} }}>Copy</button>
            </span>
          ) : (
            <span className="text-xs text-gray-600">No group</span>
          )}
        </div>
        {open && (
          <div className="mt-2 space-y-2 text-sm">
            {(state?.mode === 'running' && remainingMs === 0) && (
              <div className="rounded border border-amber-300 bg-amber-50 p-2 text-[12px] text-amber-900">Timer finished. Start again to continue.</div>
            )}
            <div className="flex items-center gap-2">
              <button className="rounded bg-gray-100 px-2 py-1" onClick={create}>Create</button>
              <JoinForm onJoin={join} />
              <button className="rounded bg-gray-100 px-2 py-1" onClick={exitShared}>Exit</button>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={120} className="w-20 rounded border px-2 py-1" value={minutes} onChange={(e)=>setMinutes(Math.max(1, Math.min(120, Number(e.target.value)||25)))} />
              {isOwner ? (
                <>
                  <button className="rounded bg-indigo-600 px-2 py-1 text-white" onClick={startTimer}>Start</button>
                  <button className="rounded bg-gray-200 px-2 py-1" onClick={pauseTimer}>Pause</button>
                  <button className="rounded bg-gray-200 px-2 py-1" onClick={resetTimer}>Reset</button>
                  <button className="rounded bg-gray-200 px-2 py-1" onClick={()=>extendTimer(5)}>+5m</button>
                  <span className="text-[11px] text-gray-500">Max 120 min</span>
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
