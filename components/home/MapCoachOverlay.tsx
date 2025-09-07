"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Actions = {
  zoomIn?: () => void;
  panLeft?: () => void;
  tapItaly?: () => void;
};

export default function MapCoachOverlay({ visible, onFinish, actions }: { visible: boolean; onFinish: () => void; actions: Actions }) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    async function run() {
      setStep(1); // pinch
      await new Promise((r) => setTimeout(r, 250));
      actions.zoomIn?.();
      await new Promise((r) => setTimeout(r, 1200));

      if (!alive) return;
      setStep(2); // pan
      actions.panLeft?.();
      await new Promise((r) => setTimeout(r, 900));

      if (!alive) return;
      setStep(3); // tap
      actions.tapItaly?.();
      await new Promise((r) => setTimeout(r, 1000));
    }
    run();
    return () => { alive = false; };
  }, [visible, actions]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* dim */}
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />

          {/* helper text */}
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-gray-900/80 px-3 py-1 text-xs font-semibold text-white">
            {step === 1 && "Pinch to zoom"}
            {step === 2 && "Drag to explore"}
            {step === 3 && "Tap a country"}
          </div>

          {/* gestures */}
          {step === 1 && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div className="h-6 w-6 rounded-full bg-gray-900/70" initial={{ x: -8, y: 8, scale: 0.9 }} animate={{ x: -32, y: 32, scale: 1 }} transition={{ duration: 1.2, repeat: 1, repeatType: "reverse" }} />
              <motion.div className="h-6 w-6 rounded-full bg-gray-900/70" initial={{ x: 8, y: -8, scale: 0.9 }} animate={{ x: 32, y: -32, scale: 1 }} transition={{ duration: 1.2, repeat: 1, repeatType: "reverse" }} />
            </div>
          )}

          {step === 2 && (
            <motion.div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-gray-900/70" initial={{ x: 60 }} animate={{ x: -40 }} transition={{ duration: 0.9 }} />
          )}

          {step === 3 && (
            <motion.div className="absolute left-[58%] top-[53%] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-900/70" animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.8, repeat: 1 }} />
          )}

          {/* button */}
          <div className="pointer-events-auto absolute inset-x-0 bottom-3 flex justify-center">
            <button onClick={onFinish} className="rounded-full bg-gray-900/80 px-3 py-1 text-xs font-semibold text-white shadow">Got it</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

