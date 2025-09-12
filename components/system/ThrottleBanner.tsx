"use client";

import { useEffect, useState } from "react";

export default function ThrottleBanner() {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("High load detected. Please slow down.");

  useEffect(() => {
    function onWarn(e: Event) {
      const ce = e as CustomEvent<{ path?: string; source?: string }>;
      const path = ce?.detail?.path || "/api";
      const src = ce?.detail?.source || "server";
      setText(`Requests limited on ${path} (source: ${src}). Please slow down.`);
      setVisible(true);
      // Auto-hide after ~3 seconds
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
    window.addEventListener("throttle-warning", onWarn as any);
    return () => window.removeEventListener("throttle-warning", onWarn as any);
  }, []);

  if (!visible) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-center">
      <div className="m-2 rounded bg-red-600 px-3 py-2 text-sm text-white shadow">
        {text}
      </div>
    </div>
  );
}

