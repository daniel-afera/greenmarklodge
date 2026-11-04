"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Calendar, { type DateRange } from "./Calendar";
import { useDismiss, useMediaQuery } from "./hooks";
import { FieldMessage } from "./Field";
import { addDaysISO, prettyDate, todayISO } from "@/lib/dates";
import { nightsBetween, MAX_DAYS_AHEAD, MAX_NIGHTS } from "@/lib/booking-schema";
import { EASE_LUXE, getLenis } from "@/lib/motion";

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" aria-hidden="true" className="shrink-0 opacity-70">
      <rect x="1.5" y="3" width="15" height="13.5" />
      <path d="M1.5 7 H16.5 M5 1 V4.5 M13 1 V4.5" />
    </svg>
  );
}

/**
 * Arrival / Departure trigger that opens the custom range calendar —
 * a floating panel on desktop, a bottom sheet on phones.
 */
export default function DateRangeField({
  value,
  onChange,
  tone = "light",
  placement = "bottom",
  errors = {},
  onClose,
  segmentClassName = "",
  className = "",
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  tone?: "light" | "dark";
  placement?: "top" | "bottom";
  errors?: { checkin?: string; checkout?: string };
  onClose?: () => void;
  segmentClassName?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const desktop = useMediaQuery("(min-width: 768px)", true);
  const nights = value.from && value.to ? nightsBetween(value.from, value.to) : 0;

  const close = useCallback(
    (reason?: "outside" | "escape") => {
      setOpen(false);
      onClose?.();
      if (reason === "escape") trigger.current?.focus();
    },
    [onClose],
  );
  useDismiss(desktop ? wrap : sheet, open, close);

  // Lock page scroll while the mobile sheet is open.
  useEffect(() => {
    if (!open || desktop) return;
    getLenis()?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => {
      getLenis()?.start();
      document.documentElement.style.overflow = "";
    };
  }, [open, desktop]);

  const handleChange = (r: DateRange) => {
    onChange(r);
    if (r.from && r.to && desktop) window.setTimeout(() => close(), 450);
  };

  const dark = tone === "dark";
  const error = errors.checkin || errors.checkout;
  const segment = (label: string, iso: string, invalid: boolean) => (
    <span className={`flex min-w-0 flex-1 flex-col gap-1.5 text-left ${segmentClassName}`}>
      <span className={`eyebrow text-[10px] ${dark ? "text-champagne" : "text-muted"} ${invalid ? "!text-error" : ""}`}>{label}</span>
      <span className="flex items-center justify-between gap-3">
        <span className={`truncate font-serif text-xl ${iso ? "" : "opacity-60"}`}>
          {iso ? prettyDate(iso, { weekday: "short", day: "numeric", month: "short" }) : "Add date"}
        </span>
        <CalendarIcon />
      </span>
    </span>
  );

  const panel = (
    <>
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <div className="eyebrow mb-1.5 text-[10px] text-bronze-deep">{!value.from ? "Select arrival" : !value.to ? "Select departure" : "Your stay"}</div>
          <div className="font-serif text-2xl leading-tight">
            {value.from ? prettyDate(value.from, { day: "numeric", month: "short" }) : "—"} <span className="text-muted">→</span>{" "}
            {value.to ? prettyDate(value.to, { day: "numeric", month: "short" }) : "—"}
          </div>
        </div>
        <span className="text-[13px] text-muted">{nights ? `${nights} night${nights > 1 ? "s" : ""}` : `Up to ${MAX_NIGHTS} nights`}</span>
      </div>
      <Calendar value={value} onChange={handleChange} months={desktop ? 2 : 1} min={todayISO()} max={addDaysISO(todayISO(), MAX_DAYS_AHEAD)} />
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink/10 pt-5">
        <button type="button" onClick={() => onChange({ from: "", to: "" })} className="hlink text-xs uppercase tracking-[0.2em] text-muted">
          Clear dates
        </button>
        <button type="button" onClick={() => close()} disabled={!value.to} className="btn btn-ink !min-h-11 !px-6">
          <span>{value.to ? "Done" : "Choose departure"}</span>
        </button>
      </div>
    </>
  );

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={error ? "dates-msg" : undefined}
        className="flex h-full w-full items-stretch"
      >
        {segment("Arrival", value.from, !!errors.checkin)}
        {segment("Departure", value.to, !!errors.checkout)}
      </button>
      {!dark && (
        <div className="mt-2">
          <FieldMessage id="dates-msg" error={error} />
        </div>
      )}

      {desktop ? (
        <AnimatePresence>
          {open && (
            <motion.div
              role="dialog"
              aria-label="Choose your dates"
              initial={{ opacity: 0, y: placement === "top" ? 12 : -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.98, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, ease: EASE_LUXE }}
              className={`absolute left-0 z-[60] w-[min(720px,calc(100vw-40px))] border border-ink/10 bg-ivory p-7 text-ink shadow-[0_30px_80px_-20px_rgba(20,26,23,.45)] ${
                placement === "top" ? "bottom-[calc(100%+12px)] origin-bottom-left" : "top-[calc(100%+12px)] origin-top-left"
              }`}
            >
              {panel}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div className="fixed inset-0 z-[110]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="absolute inset-0 bg-night/60 backdrop-blur-sm" aria-hidden="true" />
                <motion.div
                  ref={sheet}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Choose your dates"
                  data-lenis-prevent
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.55, ease: EASE_LUXE }}
                  className="absolute inset-x-0 bottom-0 max-h-[92svh] overflow-y-auto bg-ivory px-5 pb-6 pt-3 text-ink"
                >
                  <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/20" aria-hidden="true" />
                  {panel}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )
      )}
    </div>
  );
}
