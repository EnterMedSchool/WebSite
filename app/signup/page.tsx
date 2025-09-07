"use client";

import { useState } from "react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setLoading(true); setMsg(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, username, password })
    });
    const json = await res.json();
    if (!res.ok) setMsg(json?.error ?? "Failed");
    else setMsg("Account created. You can sign in now.");
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Create account</h1>
      <div className="mt-4 grid gap-3">
        <label className="text-sm font-medium">Full name</label>
        <input className="rounded border px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
        <label className="text-sm font-medium">Email</label>
        <input className="rounded border px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <label className="text-sm font-medium">Username</label>
        <input className="rounded border px-3 py-2" value={username} onChange={(e)=>setUsername(e.target.value)} />
        <label className="text-sm font-medium">Password</label>
        <input className="rounded border px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {msg && <div className="text-sm text-indigo-700">{msg}</div>}
        <button onClick={submit} disabled={loading} className="rounded-md bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-black disabled:opacity-50">
          {loading ? "Creating..." : "Create account"}
        </button>
        <a href="/signin" className="text-sm text-indigo-600 underline">Sign in</a>
      </div>
    </div>
  );
}

