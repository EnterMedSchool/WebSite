"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type MenuXpBarProps = {
  isAuthed: boolean;
  level?: number | null;
  xpPct?: number | null; // 0..100 within current level
  xpInLevel?: number | null;
  xpSpan?: number | null;
  isMax?: boolean | null;
};

export default function MenuXpBar({ isAuthed, level, xpPct, xpInLevel, xpSpan, isMax }: MenuXpBarProps) {
  const [xpOpen, setXpOpen] = useState(false);
  const [dispLevel, setDispLevel] = useState<number>(level ?? 1);
  const [dispPct, setDispPct] = useState<number>(clampPct(xpPct));
  const [dispIn, setDispIn] = useState<number>(xpInLevel ?? 0);
  const [dispSpan, setDispSpan] = useState<number>(xpSpan ?? 0);
  const [lvPulse, setLvPulse] = useState<number>(0);
  const [burst, setBurst] = useState<number>(0);
  const [capToday, setCapToday] = useState<boolean>(false);
  const barRef = useRef<HTMLDivElement>(null);
  const xpRef = useRef<HTMLDivElement>(null);
  const [miniOpenTick, setMiniOpenTick] = useState(0);

  useEffect(() => {
    const prev = dispLevel;
    const next = level ?? 1;
    setDispLevel(next);
    setDispPct(clampPct(xpPct));
    setDispIn(xpInLevel ?? 0);
    setDispSpan(xpSpan ?? 0);
    if (next > prev) { setLvPulse((n) => n + 1); setTimeout(() => setLvPulse((n) => n - 1), 800); }
  }, [level, xpPct, xpInLevel, xpSpan]);

  // Close popup on outside click / ESC
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!xpRef.current) return;
      if (!xpRef.current.contains(e.target as Node)) setXpOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setXpOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey); };
  }, []);

  // Listen for XP awards and animate bubble to the bar
  useEffect(() => {
    function onAward(e: any) {
      const detail = e?.detail ?? {};
      const amount: number = Number(detail.amount || 0);
      const from = detail.from as { x: number; y: number } | undefined;
      const newLevel: number | undefined = detail.newLevel;
      const newPct: number | undefined = detail.newPct;
      const newIn: number | undefined = detail.newInLevel;
      const newSpan: number | undefined = detail.newSpan;
      const levelUp = typeof newLevel === 'number' && newLevel > dispLevel;

      const target = barRef.current?.getBoundingClientRect();
      if (from && target) {
        const bubble = document.createElement('div');
        bubble.textContent = `+${amount} XP`;
        bubble.style.position = 'fixed';
        bubble.style.left = `${from.x - 20}px`;
        bubble.style.top = `${from.y - 10}px`;
        bubble.style.zIndex = '9999';
        bubble.style.padding = '4px 8px';
        bubble.style.borderRadius = '9999px';
        bubble.style.background = 'linear-gradient(90deg,#34d399,#67e8f9)';
        bubble.style.color = '#082f49';
        bubble.style.fontWeight = '700';
        bubble.style.fontSize = '12px';
        bubble.style.boxShadow = '0 6px 20px rgba(0,0,0,.18)';
        document.body.appendChild(bubble);
        const anim = bubble.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${target.left + target.width / 2 - from.x}px, ${target.top + target.height / 2 - from.y}px) scale(.6)`, opacity: 0.1 }
        ], { duration: 800, easing: 'cubic-bezier(.22,1,.36,1)' });
        anim.onfinish = () => bubble.remove();
      }

      if (typeof newPct === 'number') setDispPct(clampPct(newPct));
      if (typeof newIn === 'number') setDispIn(newIn);
      if (typeof newSpan === 'number') setDispSpan(newSpan);
      if (typeof newLevel === 'number') setDispLevel(newLevel);
      if (levelUp) { setBurst((b) => b + 1); setTimeout(() => setBurst((b) => b - 1), 1400); }
    }
    window.addEventListener('xp:awarded' as any, onAward as any);
    return () => window.removeEventListener('xp:awarded' as any, onAward as any);
  }, [dispLevel]);

  // Cap flag today: derive from localStorage flags and updates via event
  useEffect(() => {
    function checkCap() {
      try {
        const day = new Date().toISOString().slice(0,10);
        const hit = localStorage.getItem(`xpCap:todo:${day}`) === '1' || localStorage.getItem(`xpCap:lesson:${day}`) === '1';
        setCapToday(hit);
      } catch {}
    }
    const onCap = () => checkCap();
    checkCap();
    window.addEventListener('xp:cap' as any, onCap as any);
    return () => window.removeEventListener('xp:cap' as any, onCap as any);
  }, []);

  if (!isAuthed) {
    return (
      <div className="hidden items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white/70 shadow-sm backdrop-blur sm:flex">
        <span className="inline-flex h-7 min-w-[42px] items-center justify-center rounded-full bg-white/20 px-2 text-[11px] font-semibold">Lv --</span>
        <div className="relative h-2 w-36 overflow-hidden rounded-full bg-white/15 sm:w-40">
          <div className="absolute inset-y-0 left-0 w-0 bg-white/40" />
        </div>
        <span className="text-[10px] text-white/70">0/0 XP</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center" ref={xpRef}>
      <button
        type="button"
        onClick={() => { setXpOpen(v => { const nv = !v; if (nv) setMiniOpenTick(t=>t+1); return nv; }); }}
        aria-expanded={xpOpen}
        className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur transition hover:shadow-[0_6px_22px_rgba(0,0,0,0.18)] hover:border-white/30 hover:bg-white/15 active:scale-[0.99]"
        title="View XP details"
      >
        <span className={`inline-flex h-7 min-w-[42px] items-center justify-center rounded-full bg-white/80 px-2 text-[11px] font-bold text-indigo-700 shadow-sm ${lvPulse > 0 ? 'animate-[pulse_0.8s_ease-out_1] scale-105' : ''}`}>
          Lv {dispLevel}
        </span>
        <div ref={barRef} className="relative h-2 w-28 overflow-hidden rounded-full bg-white/20 md:w-32 lg:w-36 xl:w-40">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 transition-[width] duration-700 ease-out" style={{ width: `${dispPct}%` }} />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(255,255,255,0.22)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0.22)_75%,transparent_75%)] bg-[length:16px_8px] mix-blend-overlay opacity-50" />
        </div>
        <span className="ml-1 hidden whitespace-nowrap text-[10px] font-semibold text-white/85 xl:inline">{isMax ? 'MAX' : dispSpan && dispSpan > 0 ? `${dispIn}/${dispSpan} XP` : ''}</span>
        {capToday && (
          <span className="ml-1 inline-flex items-center rounded-full bg-amber-300/90 px-2 py-0.5 text-[10px] font-bold text-amber-900 shadow-sm" title="Daily XP cap reached">
            CAP
          </span>
        )}
        <svg className={`ml-1 h-3 w-3 text-white/80 transition-transform ${xpOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
      </button>

      {burst > 0 && (
        <div className="pointer-events-none absolute -top-2 right-12 z-[60] h-0 w-0">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="absolute h-1 w-2 rounded-sm" style={{
              left: `${(i % 8) * 6}px`,
              top: `${Math.floor(i / 8) * -4}px`,
              background: ['#fde047', '#34d399', '#60a5fa', '#fca5a5'][i % 4],
              transform: `rotate(${(i * 37) % 360}deg)`,
              animation: `fall ${600 + (i % 5) * 80}ms ease-out forwards`
            }} />
          ))}
        </div>
      )}

      {/* Global keyframes */}
      <style>{`@keyframes fall { from { opacity: 1; transform: translateY(0) rotate(0deg); } to { opacity: 0; transform: translateY(18px) rotate(60deg); } } @keyframes pop { 0% { transform: scale(1) } 30% { transform: scale(1.08) } 100% { transform: scale(1) } }`}</style>

      {xpOpen && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[380px] rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur">
          <div className="absolute -top-2 right-6 h-4 w-4 rotate-45 rounded-sm border border-white/20 bg-white/95" />
          <div className="p-4">
            <div className="mb-1 text-sm font-bold text-indigo-700">Your Progress</div>
            <div className="mb-3 text-xs text-gray-700">Level {dispLevel}{isMax ? ' (MAX)' : ''} - {dispSpan > 0 ? `${dispIn}/${dispSpan} XP to next` : ''}</div>
            {capToday && (
              <div className="mb-3 text-[11px] font-semibold text-amber-700">Daily XP cap reached. New XP won’t accumulate until tomorrow.</div>
            )}

            <Mini24hAndStreak openTick={miniOpenTick} />

            <div className="mt-4 mb-2 text-sm font-semibold text-gray-900">Recent XP</div>
            <RecentXpList />
            <PowerUpsTray />
            <div className="mt-4 flex items-center justify-between text-[11px]">
              <div className="text-gray-500">Want more insights?</div>
              <button
                className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                onClick={() => { setXpOpen(false); window.dispatchEvent(new CustomEvent('dashboard:open' as any)); }}
              >
                Open full dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Mini24hAndStreak({ openTick }: { openTick: number }) {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/me/dashboard', { credentials: 'include' });
        const j = r.ok ? await r.json() : null;
        if (!ignore) setStats(j);
        const streakEl = document.getElementById('streak-days');
        if (streakEl && j?.user?.streakDays != null) streakEl.textContent = String(j.user.streakDays);
      } catch { if (!ignore) setStats(null); } finally { if (!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, [openTick]);

  const xpToday = stats?.series?.xp7?.[stats?.series?.xp7?.length - 1] ?? 0;
  const minutesToday = stats?.learning?.minutesToday ?? 0;
  const correctToday = stats?.learning?.correctToday ?? 0;
  const streakDays = stats?.user?.streakDays ?? 0;
  const last7 = Array.isArray(stats?.series?.xp7) ? [...stats.series.xp7] : [];
  const today = new Date(); today.setHours(0,0,0,0);
  const dayAt = (cellIdx: number) => { const d = new Date(today); d.setDate(d.getDate() - (6 - cellIdx)); return d; };
  const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const intensity = Math.max(0, Math.min(1, Number(streakDays || 0) / 10)); // stronger color with longer streak

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        <AnimatedStatPill loading={loading} color="indigo" label="XP (24h)" value={`${xpToday}`} icon={<svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M12 2 15 8l6 .9-4.5 4 1 6.1L12 16l-5.5 3 1-6.1L3 8.9 9 8z"/></svg>} />
        <AnimatedStatPill loading={loading} color="emerald" label="Minutes" value={`${minutesToday}`} icon={<svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 10V7h-2v7h6v-2Z"/></svg>} />
        <AnimatedStatPill loading={loading} color="amber" label="Correct" value={`${correctToday}`} icon={<svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4Z"/></svg>} />
        <AnimatedStatPill loading={loading} color="sky" label="Tasks" value={`${stats?.learning?.tasksToday ?? 0}`} icon={<svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M3 5h18v2H3V5m0 6h18v2H3v-2m0 6h18v2H3v-2z"/></svg>} />
      </div>

      <div className="mt-3 rounded-xl border p-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow"><svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M12 3c1.5 2 2 3.5 2 5.5S12.5 12 11 13c-.5-1.5-1.5-2.5-3-3 0 3 2 4.5 2 6.5S8.5 20 7 20c-2 0-4-2-4-5 0-4.5 3-7.5 6.5-9.5C10.5 4.5 11.5 4 12 3Z"/></svg></span>
            <div className="text-xs font-semibold text-gray-900">Daily Streak</div>
          </div>
          <div className="text-[11px] font-bold text-amber-700">{streakDays ? `${streakDays} days` : '-'}</div>
        </div>
        {streakDays < 7 && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-200 to-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-300/60 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-amber-700"><path fill="currentColor" d="M5 10h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Zm2-6h10l2 3v3H5V7Z"/></svg>
            Reach 7 days for a chest!
          </div>
        )}
        <div className="relative mt-2">
          <div className="flex items-center gap-1">
            {(last7.length ? last7 : new Array(7).fill(0)).slice(-7).map((v: number, i: number) => {
              const a = v > 0 ? 0.25 + 0.6 * intensity : 0;
              const style = v > 0 ? { background: `linear-gradient(135deg, rgba(251,191,36,${a}), rgba(244,63,94,${a}))`, borderColor: `rgba(245,158,11,${0.35 + 0.45 * intensity})` } as React.CSSProperties : {};
              return (
                <div key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={style} className={`h-6 flex-1 rounded-lg border transition ${v>0 ? '' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`} />
              );
            })}
          </div>
          {hoverIdx != null && (
            <div className="pointer-events-none absolute -top-2 left-0 -translate-y-full rounded-xl border bg-white/95 px-3 py-1 text-[10px] shadow-md" style={{ left: `${(hoverIdx/6)*100}%`, transform: `translate(-${Math.round((hoverIdx/6)*100)}%, -8px)` }}>
              <div className="font-semibold text-gray-800">{fmtDay(dayAt(hoverIdx))}</div>
              <div className="mt-0.5 text-gray-600">{(last7[hoverIdx] ?? 0) > 0 ? <span className="text-amber-600">🔥 Active — keep the flame alive!</span> : <span className="text-gray-500">No XP — today is a great day to restart.</span>}</div>
            </div>
          )}
        </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-500"><span>6d ago</span><span>Today</span></div>
      </div>
    </div>
  );
}

function AnimatedStatPill({ loading, color, label, value, icon }: { loading: boolean; color: 'indigo'|'emerald'|'amber'|'sky'; label: string; value: string; icon: ReactNode }) {
  const [popKey, setPopKey] = useState(0);
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (prev.current !== null && prev.current !== value) setPopKey((k) => k + 1);
    prev.current = value;
  }, [value]);
  const theme = color === 'indigo'
    ? { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' }
    : color === 'emerald'
    ? { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' }
    : color === 'amber'
    ? { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' }
    : { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' };
  return (
    <div className={`flex items-center justify-between rounded-xl border ${theme.ring} ${theme.bg} px-2.5 py-1.5`}>
      <span className={`mr-2 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/60 ${theme.text}`}>{icon}</span>
      <div key={popKey} className={`ml-auto whitespace-nowrap text-[12px] font-bold tabular-nums ${theme.text}`} style={{ animation: loading ? undefined : 'pop 260ms cubic-bezier(.22,1,.36,1)' }}>{loading ? '…' : value}</div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function RecentXpList() {
  const [rows, setRows] = useState<{ when: string; what: string; amount: number }[] | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/me/xp');
        if (!r.ok) { setRows([]); return; }
        const j = await r.json();
        setRows((j?.recent || []).slice(0, 6));
        const streakEl = document.getElementById('streak-days');
        if (streakEl && j?.streakDays != null) streakEl.textContent = String(j.streakDays);
      } catch { setRows([]); }
    })();
  }, []);
  if (!rows) return <div className="h-10 animate-pulse rounded bg-gray-100" />;
  if (rows.length === 0) return <div className="text-xs text-gray-600">No XP yet. Complete a lesson to earn some!</div>;
  return (
    <ul className="space-y-1">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center justify-between text-xs text-gray-800">
          <span className="truncate pr-2">{r.what}</span>
          <span className="text-gray-500">{r.when}</span>
          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">+{r.amount}</span>
        </li>
      ))}
    </ul>
  );
}

// Temporary UI-only power-ups list
function PowerUpsTray() {
  const items: { key: string; name: string; count: number; color: string; tip: string; icon: ReactNode }[] = [
    {
      key: 'recover', name: 'Streak Recover', count: 1, color: 'from-pink-200 to-rose-100', tip: 'Recover yesterday\'s missed day.',
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-rose-600"><path fill="currentColor" d="M12 2a10 10 0 1 1-7.07 2.93L3 3v6h6L6.59 5.59A8 8 0 1 0 12 4Z"/></svg>
      )
    },
    {
      key: 'booster', name: 'XP Booster', count: 2, color: 'from-indigo-200 to-blue-100', tip: 'Double XP for 30 minutes.',
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-indigo-600"><path fill="currentColor" d="M11 2h2v6h-2zM7 5h2v6H7zm8 3h2v6h-2zM4 12h16v2H4zM7 15h2v6H7zm8 0h2v6h-2zM11 16h2v6h-2z"/></svg>
      )
    },
    {
      key: 'freezer', name: 'Streak Freezer', count: 0, color: 'from-cyan-200 to-teal-100', tip: 'Freeze your streak for a day.',
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan-600"><path fill="currentColor" d="M11 2h2v4h-2zM4.22 5.64l1.41-1.41 2.83 2.83-1.41 1.41zM2 11h4v2H2zm4.64 8.14l-1.41-1.41 2.83-2.83 1.41 1.41zM11 18h2v4h-2zm8.14-4.64 1.41 1.41-2.83 2.83-1.41-1.41zM18 11h4v2h-4zm-1.41-3.54 2.83-2.83 1.41 1.41-2.83 2.83z"/></svg>
      )
    }
  ];
  return (
    <div className="mt-4">
      <div className="mb-2 text-[11px] font-semibold text-gray-800">Power‑Ups</div>
      <div className="flex items-stretch gap-2">
        {items.map((it) => (
          <div key={it.key} className={`group relative grid w-24 place-items-center rounded-2xl border bg-white p-3 ring-1 ring-black/5 hover:bg-indigo-50/40`}> 
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${it.color} shadow-inner`}>
              {it.icon}
            </div>
            <div className="mt-2 truncate text-center text-[10px] font-semibold text-gray-800">{it.name}</div>
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow">{it.count}</span>
            <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-xl border bg-white/95 px-2 py-1 text-[10px] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">{it.tip}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function clampPct(p?: number | null) { return Math.max(0, Math.min(100, Number(p ?? 0))); }
