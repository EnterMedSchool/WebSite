"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCredentials() {
    setLoading(true); setError(null);
    const res = await signIn("credentials", { email, password, redirect: true, callbackUrl: "/" });
    if ((res as any)?.error) setError((res as any).error as string);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <div className="mt-4 grid gap-3">
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
        >
          Continue with Google
        </button>
        <div className="border-t" />
        <label className="text-sm font-medium">Email</label>
        <input className="rounded border px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <label className="text-sm font-medium">Password</label>
        <input className="rounded border px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button onClick={onCredentials} disabled={loading} className="rounded-md bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in with email"}
        </button>
        <a href="/signup" className="text-sm text-indigo-600 underline">Create an account</a>
      </div>
    </div>
  );
}

