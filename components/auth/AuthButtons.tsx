"use client";

import { signIn, signOut } from "next-auth/react";

type Props = {
  isAuthed: boolean;
  name?: string;
  variant?: "default" | "light"; // light = on blue bar
};

export default function AuthButtons({ isAuthed, name, variant = "default" }: Props) {
  const isLight = variant === "light";
  const nameClass = isLight ? "text-white/90" : "text-gray-600";
  const signOutClass = isLight
    ? "rounded bg-white/20 border border-white/40 px-3 py-1.5 text-sm text-white hover:bg-white hover:text-indigo-600"
    : "rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black";
  const signInClass = isLight
    ? "rounded border border-white/60 bg-white px-3 py-1.5 text-sm text-indigo-600 hover:bg-white/90"
    : "rounded border px-3 py-1.5 text-sm hover:bg-gray-50";

  return (
    <div className="flex items-center gap-3">
      {isAuthed ? (
        <>
          <span className={`hidden text-sm sm:inline ${nameClass}`}>Hi, {name ?? "Learner"}</span>
          <button onClick={() => signOut()} className={signOutClass}>
            Sign out
          </button>
        </>
      ) : (
        <button onClick={() => signIn()} className={signInClass}>
          Sign in
        </button>
      )}
    </div>
  );
}
