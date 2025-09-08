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
  const [dispPct, setDispPct] = useState<number>(clampPct(xpPct));
  const [dispIn, setDispIn] = useState<number>(xpInLevel ?? 0);
  const [dispSpan, setDispSpan] = useState<number>(xpSpan ?? 0);
  const [burst, setBurst] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const xpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDispLevel(level ?? 1);
    setDispPct(clampPct(xpPct));
    setDispIn(xpInLevel ?? 0);
    setDispSpan(xpSpan ?? 0);
  }, [level, xpPct, xpInLevel, xpSpan]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { setOpen(false); setXpOpen(false); } }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
  }, []);

  // XP award animation listener (bubbles into XP pill)
  useEffect(() => {
    function onAward(e: any) {
      const amount = Number(e?.detail?.amount || 0);
      setBurst((b) => b + 1);
      setTimeout(() => setBurst((b) => b - 1), 1000);
      if (typeof e?.detail?.newPct === 'number') setDispPct(clampPct(e.detail.newPct));
      if (typeof e?.detail?.newInLevel === 'number') setDispIn(e.detail.newInLevel);
      if (typeof e?.detail?.newSpan === 'number') setDispSpan(e.detail.newSpan);
      if (typeof e?.detail?.newLevel === 'number') setDispLevel(e.detail.newLevel);
    }
    window.addEventListener('xp:awarded' as any, onAward as any);
    return () => window.removeEventListener('xp:awarded' as any, onAward as any);
  }, []);

  if (!isAuthed) {
    return (
      <div className="flex items-center gap-3">
        {/* Ghosted XP pill */}
        <div className="hidden items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white/70 shadow-sm backdrop-blur sm:flex">
          <span className="inline-flex h-7 min-w-[42px] items-center justify-center rounded-full bg-white/20 px-2 text-[11px] font-semibold">Lv --</span>
          <div className="relative h-2 w-32 overflow-hidden rounded-full bg-white/15">
            <div className="absolute inset-y-0 left-0 w-0 bg-white/40" />
          </div>
          <span className="text-[10px] text-white/70">0/0 XP</span>
        </div>
        <button onClick={() => window.dispatchEvent(new CustomEvent('auth:open'))} className="rounded-full border border-white/70 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-white/90">Sign in / Sign up</button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      {/* Compact XP strip (click to open details) */}
      <div ref={xpRef} className="relative hidden sm:flex">
        <button
          type="button"
          onClick={() => setXpOpen((v) => !v)}
          className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white/90 shadow-sm backdrop-blur"
        >
          <span className="inline-flex h-7 min-w-[42px] items-center justify-center rounded-full bg-white/80 px-2 text-[11px] font-bold text-indigo-700 shadow-sm">Lv {dispLevel}</span>
          <div className="relative h-2 w-32 overflow-hidden rounded-full bg-white/15">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/70 transition-all" style={{ width: `${dispPct}%` }} />
          </div>
          <span className="text-[10px] text-white/80">{dispIn}/{dispSpan} XP</span>
        </button>
      </div>

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
            {[{ label: "Dashboard" }, { label: "Calendar" }, { label: "Settings" }].map((item) => (
              <li key={item.label}><button className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">{item.label}</button></li>
            ))}
          </ul>
          <div className="border-t" />
          <div className="p-1">
            <button onClick={() => signOut()} className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">Sign out</button>
          </div>
        </div>
      )}

      {/* XP popup */}
      {xpOpen && (
        <div className="absolute right-16 top-[calc(100%+10px)] z-50 w-[360px] rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur">
          {/* Arrow */}
          <div className="absolute -top-2 right-24 h-4 w-4 rotate-45 rounded-sm border border-white/20 bg-white/95" />
          <div className="p-4">
            <div className="mb-1 text-sm font-bold text-indigo-700">Your Progress</div>
            <div className="mb-2 text-xs text-gray-700">Level {dispLevel}{isMax ? ' (MAX)' : ''} · {dispIn}/{dispSpan} XP</div>
            <div className="h-2 w-full rounded-full bg-gray-200"><div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" style={{ width: `${dispPct}%` }} /></div>
          </div>
        </div>
      )}

      <AuthModal />
    </div>
  );
}

function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'signin'|'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
    const onOpen = () => { setOpen(true); setMode('signup'); };
    window.addEventListener('auth:open' as any, onOpen as any);
    return () => window.removeEventListener('auth:open' as any, onOpen as any);
  },[]);

  async function doSignIn() {
    setLoading(true); setError(null);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if ((res as any)?.error) setError((res as any).error as string); else setOpen(false);
  }
  async function doSignUp() {
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, username: email.split('@')[0], password }) });
      if (!r.ok) { const j=await r.json().catch(()=>({})); throw new Error(j?.error || 'Register failed'); }
      await doSignIn();
    } catch (e:any) { setError(String(e?.message||e)); setLoading(false); }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 p-4" onClick={()=>setOpen(false)}>
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/90 p-5 text-gray-900 shadow-2xl backdrop-blur" onClick={(e)=>e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-extrabold text-indigo-700">{mode==='signup' ? 'Create your account' : 'Welcome back'}</div>
          <button onClick={()=>setOpen(false)} className="rounded-full bg-gray-100 p-1 text-gray-500 hover:bg-gray-200" aria-label="Close">×</button>
        </div>
        <div className="mb-3 flex gap-2">
          <button onClick={()=>setMode('signup')} className={`rounded-full px-3 py-1 text-sm font-semibold ${mode==='signup'?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700'}`}>Sign up</button>
          <button onClick={()=>setMode('signin')} className={`rounded-full px-3 py-1 text-sm font-semibold ${mode==='signin'?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700'}`}>Sign in</button>
        </div>
        <div className="grid gap-2">
          {mode==='signup' && (
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="rounded-md border px-3 py-2" />
          )}
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="rounded-md border px-3 py-2" />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="rounded-md border px-3 py-2" />
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <button disabled={loading} onClick={mode==='signup'? doSignUp : doSignIn} className="mt-1 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {loading? 'Please wait...' : mode==='signup' ? 'Create account' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

function clampPct(p?: number | null) { return Math.max(0, Math.min(100, Number(p ?? 0))); }

