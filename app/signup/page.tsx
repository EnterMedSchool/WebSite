"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [hp, setHp] = useState("");
  const startedAtRef = useRef<number>(Date.now());
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string | undefined;
  const wref = useRef<any>(null);

  useEffect(() => {
    if (!siteKey) return;
    const onReady = () => {
      try {
        if (!(window as any).turnstile) return;
        const el = document.getElementById("ts-signup");
        if (!el) return;
        wref.current = (window as any).turnstile.render(el, {
          sitekey: siteKey,
          callback: (t: string) => setCaptchaToken(t),
          "error-callback": () => setCaptchaToken(null),
          "expired-callback": () => setCaptchaToken(null),
        });
      } catch {}
    };
    const i = setInterval(onReady, 300);
    return () => clearInterval(i);
  }, [siteKey]);

  async function submit() {
    setLoading(true); setMsg(null);
    // Client-side validation to improve UX
    if (password !== confirm) {
      setMsg("Passwords do not match"); setLoading(false); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).toLowerCase())) {
      setMsg("Please enter a valid email"); setLoading(false); return;
    }
    if (!acceptTerms) {
      setMsg("Please accept the terms"); setLoading(false); return;
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, username, password, captchaToken, hp, spentMs: Date.now() - startedAtRef.current, acceptTerms })
    });
    const json = await res.json();
    if (!res.ok) setMsg(json?.error ?? "Failed");
    else setMsg("Account created. You can sign in now.");
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md p-6">
      {!!siteKey && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      )}
      <h1 className="text-2xl font-bold">Create account</h1>
      <div className="mt-4 grid gap-3">
        {/* Honeypot */}
        <input className="hidden" tabIndex={-1} autoComplete="off" value={hp} onChange={(e)=>setHp(e.target.value)} name="website" />
        <label className="text-sm font-medium">Full name</label>
        <input className="rounded border px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
        <label className="text-sm font-medium">Email</label>
        <input className="rounded border px-3 py-2" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <label className="text-sm font-medium">Username</label>
        <input className="rounded border px-3 py-2" value={username} onChange={(e)=>setUsername(e.target.value)} />
        <label className="text-sm font-medium">Password</label>
        <input className="rounded border px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="8+ chars, upper/lower/number/symbol" />
        <label className="text-sm font-medium">Confirm password</label>
        <input className="rounded border px-3 py-2" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={acceptTerms} onChange={(e)=>setAcceptTerms(e.target.checked)} />
          <span>I agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy</a></span>
        </label>
        {!!siteKey && (
          <div id="ts-signup" className="cf-turnstile" data-sitekey={siteKey}></div>
        )}
        {msg && <div className="text-sm text-indigo-700">{msg}</div>}
        <button onClick={submit} disabled={loading} className="rounded-md bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black disabled:opacity-50">
          {loading ? "Creating..." : "Create account"}
        </button>
        <a href="/signin" className="text-sm text-indigo-600 underline">Sign in</a>
      </div>
    </div>
  );
}
