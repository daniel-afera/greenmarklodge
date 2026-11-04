"use client";

import { AnimatePresence, motion } from "motion/react";

export default function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  tone = "light",
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  tone?: "light" | "dark";
}) {
  const ring = tone === "dark" ? "border-ivory/30 hover:bg-ivory hover:text-ink" : "border-ink/30 hover:bg-ink hover:text-ivory";
  const btn = `flex h-11 w-11 items-center justify-center rounded-full border text-lg transition-colors disabled:pointer-events-none disabled:opacity-30 ${ring}`;
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <div className="font-serif text-2xl leading-tight">{label}</div>
        <div className="text-xs opacity-70">{hint}</div>
      </div>
      <div className="flex items-center gap-4" role="group" aria-label={label}>
        <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label.toLowerCase()}`}>
          −
        </button>
        <span className="relative h-8 w-6 overflow-hidden text-center font-serif text-[26px] leading-8" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              className="absolute inset-0"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </span>
        <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </div>
  );
}
