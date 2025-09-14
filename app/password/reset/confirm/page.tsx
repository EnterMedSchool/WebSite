"use client";

import { useEffect, useMemo, useState } from "react";

function useQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export default function PasswordResetConfirmPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URL(window.location.href).searchParams.get("token");
  }, []);

  async function submit() {
    setLoading(true); setMsg(null);
    try {
      const res = await fetch("/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      if (res.ok) {
        setMsg("Password updated. You can sign in now.");
      } else {
        const json = await res.json().catch(()=>({}));
        setMsg(json?.error || json?.message || "Failed to reset password.");
      }
    } catch (e: any) {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <div className="mt-4 grid gap-3">
        <label className="text-sm font-medium">New password</label>
        <input className="rounded border px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {msg && <div className="text-sm text-indigo-700">{msg}</div>}
        <button onClick={submit} disabled={loading || !token} className="rounded-md bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black disabled:opacity-50">
          {loading ? "Updating..." : "Update password"}
        </button>
        <a href="/signin" className="text-sm text-indigo-600 underline">Back to sign in</a>
      </div>
    </div>
  );
}

