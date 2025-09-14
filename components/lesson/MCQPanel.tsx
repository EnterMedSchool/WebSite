"use client";

import { useEffect, useMemo, useState } from "react";

export type MCQChoice = { id: number; text: string; correct?: boolean };
export type MCQ = { id: number; prompt: string; choices: MCQChoice[] };

type Status = "correct" | "incorrect" | undefined;

type Props = {
  courseId: number;
  questions: MCQ[];
  initialStatus?: Record<number, Status>;
  openAll?: boolean;
  openOnlyId?: number | null;
  disabled?: boolean; // when not authed
  onAnswer?: (qid: number, status: "correct" | "incorrect", choiceId: number) => void;
};

export default function MCQPanel({ courseId, questions, initialStatus, openAll, openOnlyId, disabled, onAnswer }: Props) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [selected, setSelected] = useState<Record<number, number | undefined>>({});
  const [status, setStatus] = useState<Record<number, Status>>(() => initialStatus || {});

  useEffect(() => { if (initialStatus) setStatus(initialStatus); }, [initialStatus]);
  useEffect(() => {
    const map: Record<number, boolean> = {};
    if (openAll) { for (const q of questions) map[q.id] = true; }
    else if (openOnlyId) { for (const q of questions) map[q.id] = q.id === openOnlyId; }
    setOpen(map);
  }, [openAll, openOnlyId, questions]);

  function handlePick(qid: number, choice: MCQChoice) {
    if (disabled) return;
    setSelected((s) => ({ ...s, [qid]: choice.id }));
    const st: Status = choice.correct ? "correct" : "incorrect";
    if (st) setStatus((m) => ({ ...m, [qid]: st }));
    if (st) onAnswer?.(qid, st, choice.id);
  }

  const correctCount = useMemo(() => Object.values(status).filter((s) => s === "correct").length, [status]);

  return (
    <div className="space-y-3">
      {questions.map((q, idx) => {
        const isOpen = open[q.id] || Boolean(openAll) || (openOnlyId ? q.id === openOnlyId : false);
        const st = status[q.id];
        const selectedId = selected[q.id];
        const border = st === "correct" ? "border-emerald-300" : st === "incorrect" ? "border-rose-300" : "border-gray-200";
        const ring = st === "correct" ? "ring-emerald-200" : st === "incorrect" ? "ring-rose-200" : "ring-black/5";
        const chip = st === "correct" ? { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Correct" }
                   : st === "incorrect" ? { cls: "bg-rose-50 text-rose-700 ring-rose-200", label: "Review" }
                   : { cls: "bg-gray-100 text-gray-700 ring-gray-300", label: "To do" };
        return (
          <div key={q.id} className={`rounded-2xl border ${border} bg-white p-3 shadow-sm transition-all duration-200 ${st ? 'translate-y-[-1px]' : ''} ${st==='correct' ? 'shadow-[0_6px_18px_rgba(16,185,129,0.20)]' : st==='incorrect' ? 'shadow-[0_6px_18px_rgba(244,63,94,0.18)]' : 'shadow-[0_6px_18px_rgba(0,0,0,0.06)]'} ring-1 ${ring}`}>
            <button type="button" onClick={() => setOpen((m) => ({ ...m, [q.id]: !isOpen }))} className="flex w-full items-center justify-between gap-2 text-left">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gray-100 text-[12px] font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">{idx+1}</span>
                <div className="truncate text-sm font-medium text-gray-900" title={q.prompt}>{q.prompt}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${chip.cls}`}>{chip.label}</span>
            </button>
            {isOpen && (
              <div className="mt-2 space-y-2">
                {q.choices.map((c) => {
                  const picked = selectedId === c.id;
                  const correct = st === "correct" && picked;
                  const wrong = st === "incorrect" && picked;
                  const base = "w-full rounded-xl border px-3 py-2 text-left transition";
                  const cls = correct ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : wrong ? "border-rose-300 bg-rose-50 text-rose-900"
                    : picked ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                    : "border-gray-200 hover:bg-gray-50 text-gray-800";
                  return (
                    <button key={c.id} type="button" disabled={disabled} onClick={() => handlePick(q.id, c)} className={`${base} ${cls}`}>
                      <div className="flex items-center gap-2">
                        <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold ${picked ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{picked ? '✓' : ''}</span>
                        <div className="text-sm">{c.text}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

