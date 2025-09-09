"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import MenuXpBar from "@/components/xp/MenuXpBar";
import FloatingDashboard from "@/components/dashboard/FloatingDashboard";

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
  const ref = useRef<HTMLDivElement>(null);
  const [dashOpen, setDashOpen] = useState(false);
  const [achCount, setAchCount] = useState<number>(0);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => {
    function onOpen() { setDashOpen(true); }
    window.addEventListener("dashboard:open" as any, onOpen as any);
    return () => window.removeEventListener("dashboard:open" as any, onOpen as any);
  }, []);

  // Achievements count (inventory size) + live updates on reward events
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/me/xp', { credentials: 'include' });
        const j = await r.json();
        if (mounted) setAchCount(Array.isArray(j?.rewards) ? j.rewards.length : 0);
      } catch { /* ignore */ }
    })();
    function onReward() { setAchCount((n) => n + 1); }
    window.addEventListener('reward:earned' as any, onReward as any);
    return () => { mounted = false; window.removeEventListener('reward:earned' as any, onReward as any); };
  }, []);

  if (!isAuthed) {
    return (
      <div className="flex items-center gap-3">
        <MenuXpBar isAuthed={false} />
        <div className="flex items-center gap-2">
          <button onClick={() => window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'signin' } }))} className="rounded-full border border-white/70 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-white/90">Sign in</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'signup' } }))} className="rounded-full border border-white/70 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-white/90">Sign up</button>
        </div>
        <AuthModal />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      <MenuXpBar
        isAuthed={true}
        level={level ?? 1}
        xpPct={clampPct(xpPct)}
        xpInLevel={xpInLevel ?? 0}
        xpSpan={xpSpan ?? 0}
        isMax={!!isMax}
      />

      {/* Avatar */}
      <div className="relative">
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
        {/* Removed persistent achievement badge bubble on avatar to avoid
            notification-like dot that never clears. Counts still appear
            inside the menu next to the Achievements link. */}

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
              <li>
                <button onClick={() => { setDashOpen(true); setOpen(false); }} className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">Dashboard</button>
              </li>
              <li>
                <Link href="/achievements" onClick={() => setOpen(false)} className="relative block w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">
                  Achievements
                  {achCount > 0 && <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-indigo-600 px-2 py-[2px] text-[10px] font-bold text-white">{Math.min(99, achCount)}</span>}
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" onClick={() => setOpen(false)} className="block w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">Leaderboard</Link>
              </li>
              <li>
                <button className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">Calendar</button>
              </li>
              <li>
                <button className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">Settings</button>
              </li>
            </ul>
            <div className="border-t" />
            <div className="p-1">
              <button onClick={() => signOut()} className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">Sign out</button>
            </div>
          </div>
        )}
      </div>

      <AuthModal />
      <FloatingDashboard open={dashOpen} onClose={() => setDashOpen(false)} />
    </div>
  );
}

function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'signin'|'signup'>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onOpen = (e: any) => {
      setOpen(true);
      const m = e?.detail?.mode;
      setMode(m === 'signin' ? 'signin' : 'signup');
    };
    window.addEventListener('auth:open' as any, onOpen as any);
    return () => window.removeEventListener('auth:open' as any, onOpen as any);
  }, []);

  async function doSignIn() {
    setLoading(true); setError(null);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if ((res as any)?.error) setError((res as any).error as string); else setOpen(false);
  }
  async function doSignUp() {
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, username: email.split('@')[0], password }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j?.error || 'Register failed'); }
      await doSignIn();
    } catch (e: any) { setError(String(e?.message || e)); setLoading(false); }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 text-gray-900 shadow-[0_18px_50px_rgba(49,46,129,0.35)] ring-1 ring-white/20 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-extrabold text-indigo-700">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</div>
          <button onClick={() => setOpen(false)} className="rounded-full bg-white/70 p-1 text-gray-600 hover:bg-white" aria-label="Close">×</button>
        </div>
        <div className="mb-3 flex gap-2">
          <button onClick={() => setMode('signup')} className={`rounded-full px-3 py-1 text-sm font-semibold ${mode === 'signup' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Sign up</button>
          <button onClick={() => setMode('signin')} className={`rounded-full px-3 py-1 text-sm font-semibold ${mode === 'signin' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Sign in</button>
        </div>
        <div className="grid gap-2">
          {mode === 'signup' && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="rounded-md border px-3 py-2" />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-md border px-3 py-2" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="rounded-md border px-3 py-2" />
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <button disabled={loading} onClick={mode === 'signup' ? doSignUp : doSignIn} className="mt-1 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

function clampPct(p?: number | null) { return Math.max(0, Math.min(100, Number(p ?? 0))); }
