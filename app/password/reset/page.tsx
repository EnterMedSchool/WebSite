"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);
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
        const el = document.getElementById("ts-reset");
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
    setLoading(true); setMsg(null); setDevUrl(null);
    try {
      const res = await fetch("/api/auth/password/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken, hp, spentMs: Date.now() - startedAtRef.current })
      });
      if (res.headers.get("content-type")?.includes("application/json")) {
        const json = await res.json().catch(() => ({}));
        if (json?.url) setDevUrl(json.url);
      }
      setMsg("If that email exists, we sent a reset link.");
    } catch (e: any) {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      {!!siteKey && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      )}
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <div className="mt-4 grid gap-3">
        {/* Honeypot */}
        <input className="hidden" tabIndex={-1} autoComplete="off" value={hp} onChange={(e)=>setHp(e.target.value)} name="website" />
        <label className="text-sm font-medium">Email</label>
        <input className="rounded border px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
        {!!siteKey && (
          <div id="ts-reset" className="cf-turnstile" data-sitekey={siteKey}></div>
        )}
        {msg && <div className="text-sm text-indigo-700">{msg}</div>}
        <button onClick={submit} disabled={loading} className="rounded-md bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black disabled:opacity-50">
          {loading ? "Sending..." : "Send reset link"}
        </button>
        <a href="/signin" className="text-sm text-indigo-600 underline">Back to sign in</a>
        {devUrl && (
          <div className="mt-3 rounded border p-3 text-sm">
            <div className="font-semibold mb-1">Dev link (EMAIL_DEV_MODE)</div>
            <a className="text-indigo-700 underline break-all" href={devUrl}>{devUrl}</a>
          </div>
        )}
      </div>
    </div>
  );
}
