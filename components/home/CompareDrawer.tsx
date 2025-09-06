"use client";

import { motion, AnimatePresence } from "framer-motion";

type Item = {
  uni: string;
  country?: string;
  city: string;
  kind?: string;
  language?: string;
  exam?: string;
  rating?: number;
  lastScore?: number;
  logo?: string;
};

function insights(items: Item[]): string {
  if (items.length === 0) return "Add universities to compare.";
  const bestRating = [...items].filter(i => typeof i.rating === 'number').sort((a,b)=> (b.rating||0)-(a.rating||0))[0];
  const topScore = [...items].filter(i => typeof i.lastScore === 'number').sort((a,b)=> (b.lastScore||0)-(a.lastScore||0))[0];
  const langs = Array.from(new Set(items.map(i=>i.language).filter(Boolean))) as string[];
  const exams = Array.from(new Set(items.map(i=>i.exam).filter(Boolean))) as string[];
  const parts: string[] = [];
  if (bestRating) parts.push(`${bestRating.uni} has the highest rating${bestRating.rating ? ` (${bestRating.rating.toFixed(1)})` : ''}.`);
  if (topScore && topScore.uni !== bestRating?.uni) parts.push(`${topScore.uni} shows the highest last admission score${topScore.lastScore ? ` (${topScore.lastScore}/100)` : ''}.`);
  if (langs.length) parts.push(`Languages across your picks: ${langs.join(', ')}.`);
  if (exams.length) parts.push(`Admissions covered: ${exams.join(', ')}.`);
  return parts.join(' ');
}

export default function CompareDrawer({ open, items, onClose, onRemove, onClear }: { open: boolean; items: Item[]; onClose: () => void; onRemove: (uni: string) => void; onClear: () => void; }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            className="absolute right-0 top-0 h-full w-[min(720px,96vw)] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-4">
              <div className="text-lg font-semibold">Compare Universities</div>
              <div className="flex items-center gap-2">
                <button onClick={onClear} className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200">Clear</button>
                <button onClick={onClose} className="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Close</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
              {items.map((it) => (
                <div key={it.uni} className="rounded-xl border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-indigo-100">
                      {it.logo ? <img src={it.logo} alt="logo" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{it.uni}</div>
                      <div className="text-xs text-gray-500">{it.city}{it.country ? ` • ${it.country}` : ''}</div>
                    </div>
                    <button onClick={() => onRemove(it.uni)} className="ml-auto text-xs text-gray-500 hover:underline">Remove</button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-gray-50 p-2">Rating: {typeof it.rating === 'number' ? it.rating.toFixed(1) : '—'}</div>
                    <div className="rounded bg-gray-50 p-2">Last Score: {it.lastScore != null ? `${it.lastScore}/100` : '—'}</div>
                    <div className="rounded bg-gray-50 p-2">Language: {it.language ?? '—'}</div>
                    <div className="rounded bg-gray-50 p-2">Exam: {it.exam ?? '—'}</div>
                    <div className="rounded bg-gray-50 p-2">Type: {it.kind ? (it.kind === 'private' ? 'Private' : 'Public') : '—'}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <div className="text-sm font-semibold text-indigo-700">Smart insights</div>
              <div className="mt-1 text-sm text-gray-700">{insights(items)}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

