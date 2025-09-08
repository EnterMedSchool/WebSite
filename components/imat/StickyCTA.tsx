"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StickyCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow((globalThis as any).scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => window.removeEventListener("scroll", onScroll as any);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className="fixed inset-x-0 bottom-4 z-40 mx-auto w-full max-w-3xl px-4"
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky-200/60 bg-gradient-to-r from-sky-50/80 via-indigo-50/80 to-purple-50/80 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/40">
            <div className="text-sm font-semibold text-slate-800">
              Ready to start? Join the IMAT course today.
            </div>
            <a href="#pricing" className="btn-primary-shine">Start Studying</a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

