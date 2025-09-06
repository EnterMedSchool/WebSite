"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function CompareFab({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          layout
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 180, damping: 15 }}
          onClick={onOpen}
          className="fixed bottom-6 right-6 z-40 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:bg-indigo-700"
        >
          Compare ({count})
        </motion.button>
      )}
    </AnimatePresence>
  );
}

