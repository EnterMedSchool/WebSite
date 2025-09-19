"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number | string; // e.g. "70vh"
  showBackdrop?: boolean;
  backdropClassName?: string;
};

export default function BottomSheet({ open, onClose, title, children, height = "70vh", showBackdrop = true, backdropClassName = "bg-black/30" }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const sheet = (
    <AnimatePresence>
      {open && (
        <>
          {showBackdrop && (
            <motion.div
              className={`fixed inset-0 z-40 ${backdropClassName}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
          )}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            style={{ height }}
          >
            <div className="flex items-center justify-between px-4 pt-3">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" />
            </div>
            {title && <div className="px-4 pb-2 text-base font-semibold text-gray-900">{title}</div>}
            <div className="h-[calc(100%-28px)] overflow-auto px-3 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(sheet, document.body);
}
