"use client";

import { useState } from "react";

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);

  async function submit() {
    setLoading(true); setMsg(null); setDevUrl(null);
    try {
      const res = await fetch("/api/auth/verify/request", { method: "POST" });
      if (res.status === 401) {
        setMsg("Please sign in to request a verification link.");
      } else {
        if (res.headers.get("content-type")?.includes("application/json")) {
          const json = await res.json().catch(() => ({}));
          if (json?.url) setDevUrl(json.url);
        }
        setMsg("If your email needs verification, we sent a link.");
      }
    } catch (e: any) {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Verify your email</h1>
      <div className="mt-4 grid gap-3">
        <button onClick={submit} disabled={loading} className="rounded-md bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black disabled:opacity-50">
          {loading ? "Sending..." : "Send verification link"}
        </button>
        <a href="/" className="text-sm text-indigo-600 underline">Back to home</a>
        {msg && <div className="text-sm text-indigo-700">{msg}</div>}
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

