"use client";

import { signIn, signOut } from "next-auth/react";

export default function AuthButtons({ isAuthed, name }: { isAuthed: boolean; name?: string }) {
  return (
    <div className="flex items-center gap-3">
      {isAuthed ? (
        <>
          <span className="hidden text-sm text-gray-600 sm:inline">Hi, {name ?? "Learner"}</span>
          <button
            onClick={() => signOut()}
            className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black"
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          onClick={() => signIn()}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Sign in
        </button>
      )}
    </div>
  );
}

