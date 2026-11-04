"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { useDismiss } from "./hooks";
import Stepper from "./Stepper";
import { EASE_LUXE } from "@/lib/motion";

export const guestLabel = (a: number, c: number) => `${a} adult${a > 1 ? "s" : ""}${c ? `, ${c} child${c > 1 ? "ren" : ""}` : ""}`;

/** Compact guests popover (used in the hero booking bar). */
export default function GuestField({
  adults,
  kids,
  onChange,
  placement = "top",
  className = "",
}: {
  adults: number;
  kids: number;
  onChange: (v: { adults: number; children: number }) => void;
  placement?: "top" | "bottom";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(wrap, open, close);

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-full w-full flex-col gap-1.5 text-left">
        <span className="eyebrow text-[10px] text-champagne">Guests</span>
        <span className="flex items-center justify-between gap-3">
          <span className="truncate font-serif text-xl">{guestLabel(adults, kids)}</span>
          <motion.svg animate={{ rotate: open ? 180 : 0 }} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" aria-hidden="true" className="shrink-0 opacity-70">
            <path d="M2 4.5 L6 8.5 L10 4.5" />
          </motion.svg>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Guests"
            initial={{ opacity: 0, y: placement === "top" ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.4, ease: EASE_LUXE }}
            className={`absolute left-0 z-[70] w-[320px] divide-y divide-ink/10 border border-ink/10 bg-ivory px-6 py-2 text-ink shadow-[0_24px_60px_-18px_rgba(20,26,23,.45)] ${
              placement === "top" ? "bottom-[calc(100%+12px)]" : "top-[calc(100%+12px)]"
            }`}
          >
            <Stepper label="Adults" hint="Ages 13+" value={adults} min={1} max={8} onChange={(n) => onChange({ adults: n, children: kids })} />
            <Stepper label="Children" hint="Ages 0–12" value={kids} min={0} max={6} onChange={(n) => onChange({ adults, children: n })} />
            <div className="flex justify-end py-4">
              <button type="button" onClick={close} className="btn btn-ink !min-h-10 !px-5">
                <span>Done</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
