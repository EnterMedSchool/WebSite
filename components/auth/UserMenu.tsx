"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";

type Props = {
  isAuthed: boolean;
  name?: string | null;
  imageUrl?: string | null;
  level?: number | null;
  xpPct?: number | null; // 0..100 within current level
  xpInLevel?: number | null;
  xpSpan?: number | null;
  isMax?: boolean | null;
};

export default function UserMenu({ isAuthed, name, imageUrl, level, xpPct, xpInLevel, xpSpan, isMax }: Props) {
  const [open, setOpen] = useState(false);
  const [xpOpen, setXpOpen] = useState(false);
  const [dispLevel, setDispLevel] = useState<number>(level ?? 1);
  const [dispPct, setDispPct] = useState<number>(Math.max(0, Math.min(100, xpPct ?? 0)));
  const [dispIn, setDispIn] = useState<number>(xpInLevel ?? 0);
  const [dispSpan, setDispSpan] = useState<number>(xpSpan ?? 0);
  const [burst, setBurst] = useState<number>(0);
  const [lvPulse, setLvPulse] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const xpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Close XP popup on outside click/ESC
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

  // Keep display in sync when props change (e.g., on navigation)
  useEffect(() => {
    const prev = dispLevel;
    const next = level ?? 1;
    setDispLevel(next);
    setDispPct(Math.max(0, Math.min(100, xpPct ?? 0)));
    setDispIn(xpInLevel ?? 0);
    setDispSpan(xpSpan ?? 0);
    if (next > prev) { setLvPulse((n)=>n+1); setTimeout(()=> setLvPulse((n)=>n-1), 800); }
  }, [level, xpPct, xpInLevel, xpSpan]);

  // XP award animation listener
  useEffect(() => {
    function onAward(e: any) {
      const detail = e?.detail ?? {};
      const amount: number = Number(detail.amount || 0);
      const from = detail.from as { x: number; y: number } | undefined;
      const newLevel: number | undefined = detail.newLevel;
      const newPct: number | undefined = detail.newPct;
      const newIn: number | undefined = detail.newInLevel;
      const newSpan: number | undefined = detail.newSpan;
      const levelUp: boolean = typeof detail.levelUp === 'boolean' ? detail.levelUp : (typeof newLevel === 'number' && newLevel > dispLevel);

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
          { transform: `translate(${target.left + target.width/2 - from.x}px, ${target.top + target.height/2 - from.y}px) scale(.6)`, opacity: 0.1 }
        ], { duration: 800, easing: 'cubic-bezier(.22,1,.36,1)' });
        anim.onfinish = () => bubble.remove();
      }

      if (typeof newPct === 'number') setDispPct(Math.max(0, Math.min(100, newPct)));
      if (typeof newIn === 'number') setDispIn(newIn);
      if (typeof newSpan === 'number') setDispSpan(newSpan);
      if (typeof newLevel === 'number') setDispLevel(newLevel);
      if (levelUp) {
        setBurst((b) => b + 1);
        setTimeout(() => setBurst((b) => b - 1), 1400);
      }
    }
    window.addEventListener('xp:awarded' as any, onAward as any);
    return () => window.removeEventListener('xp:awarded' as any, onAward as any);
  }, [dispLevel]);

  if (!isAuthed) {
    return (
      <div className="flex items-center gap-3">
        {/* Ghosted XP pill */}
        <div className="hidden items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white/70 shadow-sm backdrop-blur sm:flex">
          <span className="inline-flex h-7 min-w-[42px] items-center justify-center rounded-full bg-white/20 px-2 text-[11px] font-semibold">Lv –</span>
          <div className="relative h-2 w-32 overflow-hidden rounded-full bg-white/15">
            <div className="absolute inset-y-0 left-0 w-0 bg-white/40" />
          </div>
          <span className="text-[10px] text-white/70">0/0 XP</span>
        </div>
        <button
          onClick={() => signIn()}
          className="rounded-full border border-white/70 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-white/90"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      {/* Compact XP strip (clickable for popup) */}
      <div ref={xpRef} className="relative hidden sm:flex">
        <button
          type="button"
          onClick={() => setXpOpen(v=>!v)}
          aria-expanded={xpOpen}
          className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur transition hover:shadow-[0_6px_22px_rgba(0,0,0,0.18)] hover:border-white/30 hover:bg-white/15 active:scale-[0.99]"
          title="View XP details"
        >
          <span className={`inline-flex h-7 min-w-[42px] items-center justify-center rounded-full bg-white/80 px-2 text-[11px] font-bold text-indigo-700 shadow-sm ${lvPulse>0? 'animate-[pulse_0.8s_ease-out_1] scale-105' : ''}`}>
            Lv {dispLevel}
          </span>
          <div ref={barRef} className="relative h-2 w-36 overflow-hidden rounded-full bg-white/20 sm:w-40">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 transition-[width] duration-700 ease-out"
              style={{ width: `${dispPct}%` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(255,255,255,0.22)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0.22)_75%,transparent_75%)] bg-[length:16px_8px] mix-blend-overlay opacity-50" />
          </div>
          <span className="ml-1 whitespace-nowrap text-[10px] font-semibold text-white/85">
            {isMax ? 'MAX' : dispSpan && dispSpan > 0 ? `${dispIn}/${dispSpan} XP` : ''}
          </span>
          <svg className={`ml-1 h-3 w-3 text-white/80 transition-transform ${xpOpen? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
          {/* Glow on hover */}
          <span className="pointer-events-none absolute -inset-1 rounded-full opacity-0 blur-md transition group-hover:opacity-40" style={{ background: 'radial-gradient(40px 20px at 50% 50%, rgba(255,255,255,0.45), rgba(255,255,255,0))' }} />
          {/* Tooltip */}
          <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 opacity-0 shadow group-hover:opacity-100">View details</span>
        </button>
      </div>

      {/* lightweight confetti burst */}
      {burst > 0 && (
        <div className="pointer-events-none absolute -top-2 right-28 z-[60] h-0 w-0">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="absolute h-1 w-2 rounded-sm" style={{
              left: `${(i%8)*6}px`,
              top: `${Math.floor(i/8)*-4}px`,
              background: ['#fde047','#34d399','#60a5fa','#fca5a5'][i%4],
              transform: `rotate(${(i*37)%360}deg)`,
              animation: `fall ${600 + (i%5)*80}ms ease-out forwards`
            }} />
          ))}
          <style jsx>{`
            @keyframes fall { from { opacity: 1; transform: translateY(0) rotate(0deg); } to { opacity: 0; transform: translateY(18px) rotate(60deg); } }
          `}</style>
        </div>
      )}

      {/* Avatar trigger */}
      <button
        className="flex items-center gap-2 rounded-full bg-white/10 p-1 pr-2 text-white/90 hover:bg-white/20"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white">
          {imageUrl ? (
            <Image src={imageUrl} alt="User" width={32} height={32} className="h-8 w-8 object-cover" />
          ) : (
            <span className="text-indigo-600">{(name ?? "U").slice(0, 1).toUpperCase()}</span>
          )}
        </span>
        <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-indigo-100 bg-white/95 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3 p-4">
            <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
              {imageUrl ? (
                <Image src={imageUrl} alt="User" width={40} height={40} className="h-10 w-10 object-cover" />
              ) : (
                <span className="text-base font-semibold text-indigo-700">{(name ?? "U").slice(0, 1).toUpperCase()}</span>
              )}
            </span>
            <div>
              <div className="font-semibold text-gray-900">{name ?? "Your Name"}</div>
              <div className="text-sm text-indigo-600 underline">View profile</div>
            </div>
          </div>
          <div className="border-t" />
          <ul className="p-1">
            {[
              { label: "Dashboard" },
              { label: "Calendar" },
              { label: "Settings" },
            ].map((item) => (
              <li key={item.label}>
                <button className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t" />
          <div className="p-1">
            <button
              onClick={() => signOut()}
              className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* XP popup */}
      {xpOpen && (
        <div className="absolute right-16 top-[calc(100%+10px)] z-50 w-[380px] rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur">
          {/* Arrow */}
          <div className="absolute -top-2 right-24 h-4 w-4 rotate-45 rounded-sm border border-white/20 bg-white/95" />
          <div className="p-4">
            <div className="mb-1 text-sm font-bold text-indigo-700">Your Progress</div>
            <div className="mb-3 text-xs text-gray-700">Level {dispLevel}{isMax? ' (MAX)' : ''} • {dispSpan>0? `${dispIn}/${dispSpan} XP to next` : ''}</div>
            <div className="mb-2 text-sm font-semibold text-gray-900">Recent XP</div>
            <RecentXpList />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border p-3 hover:bg-indigo-50/40 transition">
                <div className="font-semibold text-gray-900">Achievements</div>
                <div className="mt-1 text-gray-600">• First Steps (soon)</div>
                <div className="text-gray-600">• Quiz Whiz (soon)</div>
              </div>
              <div className="rounded-xl border p-3 hover:bg-indigo-50/40 transition">
                <div className="font-semibold text-gray-900">Daily Streak</div>
                <div className="mt-1 text-gray-600">Streak: <span id="streak-days">—</span> days (soon)</div>
              </div>
            </div>
          </div>
        </div>
      )}
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
