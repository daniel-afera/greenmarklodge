"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
      <path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" />
    </svg>
  );
}

export function FieldMessage({ id, error, hint }: { id?: string; error?: string; hint?: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {error ? (
        <motion.em
          key="e"
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-start gap-1.5 text-[12px] not-italic leading-snug text-error"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" className="mt-px shrink-0" aria-hidden="true">
            <circle cx="7" cy="7" r="6" />
            <path d="M7 3.8 V7.6 M7 9.6 V10.2" />
          </svg>
          {error}
        </motion.em>
      ) : hint ? (
        <motion.span key="h" id={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[12px] leading-snug text-muted">
          {hint}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Label + control + message. Pass `htmlFor` when the control is a native
 * input; custom controls are labelled with aria-labelledby={`${id}-label`}.
 */
export default function Field({
  id,
  label,
  error,
  hint,
  valid,
  counter,
  children,
  className = "",
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  valid?: boolean;
  counter?: { value: number; max: number };
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field relative ${className}`} data-invalid={!!error}>
      <span className="flex items-center justify-between gap-3">
        <label id={`${id}-label`} htmlFor={id}>
          {label}
        </label>
        {counter && (
          <span className={`tabular-nums tracking-normal ${counter.value > counter.max ? "text-error" : "text-muted/70"}`}>
            {counter.value}/{counter.max}
          </span>
        )}
      </span>
      <div className="relative">
        {children}
        <AnimatePresence>
          {valid && !error && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-bronze-deep"
            >
              <CheckIcon />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </div>
  );
}
