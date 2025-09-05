"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";

type Props = {
  isAuthed: boolean;
  name?: string | null;
  imageUrl?: string | null;
};

// Simple inline icons (no extra deps)
const IconChat = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 3c4.97 0 9 3.582 9 8 0 4.418-4.03 8-9 8-.969 0-1.904-.123-2.785-.352-.258-.068-.526-.102-.795-.102H6.5l-2.42 1.813A.75.75 0 0 1 3 20.75v-3.527c0-.269-.034-.537-.102-.795A8.18 8.18 0 0 1 3 11c0-4.418 4.03-8 9-8z"/>
  </svg>
);

const IconCalendar = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.25A2.75 2.75 0 0 1 22 6.75v12.5A2.75 2.75 0 0 1 19.25 22H4.75A2.75 2.75 0 0 1 2 19.25V6.75A2.75 2.75 0 0 1 4.75 4H6V3a1 1 0 0 1 1-1zm12 8H5v9.25c0 .69.56 1.25 1.25 1.25h13.5c.69 0 1.25-.56 1.25-1.25V10zM6 8h12V6.75c0-.69-.56-1.25-1.25-1.25H4.75C4.06 5.5 3.5 6.06 3.5 6.75V8H6z"/>
  </svg>
);

const IconBell = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2a6 6 0 0 0-6 6v3.586l-1.707 1.707A1 1 0 0 0 5 15h14a1 1 0 0 0 .707-1.707L18 11.586V8a6 6 0 0 0-6-6zm0 20a3 3 0 0 0 2.995-2.824L15 19h-6a3 3 0 0 0 2.824 2.995L12 22z"/>
  </svg>
);

export default function UserMenu({ isAuthed, name, imageUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!isAuthed) {
    return (
      <button
        onClick={() => signIn()}
        className="rounded border border-white/60 bg-white px-3 py-1.5 text-sm text-indigo-600 hover:bg-white/90"
      >
        Sign in
      </button>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-2 sm:gap-3">
      {/* Icon buttons (non-functional for now) */}
      <button
        aria-label="Chat"
        className="rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
      >
        <IconChat className="h-5 w-5" />
      </button>
      <button
        aria-label="Study"
        className="rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
      >
        <IconCalendar className="h-5 w-5" />
      </button>
      <button
        aria-label="Notifications"
        className="relative rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
      >
        <IconBell className="h-5 w-5" />
        <span className="absolute right-1 top-1 inline-block h-2 w-2 rounded-full bg-rose-300"></span>
      </button>

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
            {[
              { label: "Dashboard" },
              { label: "Calendar" },
              { label: "Settings" },
            ].map((item) => (
              <li key={item.label}>
                <button className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50">
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t" />
          <div className="p-1">
            <button
              onClick={() => signOut()}
              className="w-full rounded-lg px-4 py-2 text-left text-gray-800 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

