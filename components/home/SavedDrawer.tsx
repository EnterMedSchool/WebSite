"use client";

import { AnimatePresence, motion } from "framer-motion";

type Item = {
  uni: string;
  country?: string;
  city: string;
  kind?: string;
  logo?: string;
};

export default function SavedDrawer({ open, items, onClose, onRemove, onClear }: { open: boolean; items: Item[]; onClose: () => void; onRemove: (uni: string) => void; onClear: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="absolute right-0 top-0 h-full w-[min(520px,96vw)] bg-gradient-to-br from-white to-pink-50 shadow-2xl"
          >
            <div className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur p-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-pink-700">Saved Universities</div>
                <div className="flex items-center gap-2">
                  <button onClick={onClear} className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200">Clear</button>
                  <button onClick={onClose} className="rounded-lg bg-pink-600 px-3 py-1 text-sm font-semibold text-white hover:bg-pink-700">Close</button>
                </div>
              </div>
            </div>

            <div className="h-full overflow-hidden">
              <div className="h-full overflow-auto p-4 space-y-3">
                {items.length === 0 && (
                  <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600">No saved universities yet.</div>
                )}
                {items.map((it) => (
                  <div key={it.uni} className="flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-black/5">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-indigo-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {it.logo ? <img src={it.logo} alt="logo" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{it.uni}</div>
                      <div className="text-xs text-gray-500">{it.city}{it.country ? ` • ${it.country}` : ''}</div>
                    </div>
                    <button onClick={() => onRemove(it.uni)} className="ml-auto text-xs text-gray-500 hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

