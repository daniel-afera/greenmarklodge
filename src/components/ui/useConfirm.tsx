"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { EASE_LUXE } from "@/lib/motion";
import { useEscape } from "@/components/forms/hooks";

/**
 * Styled replacement for window.confirm():
 *
 *   const [ask, confirmDialog] = useConfirm();
 *   if (await ask({ title: "Delete photo?", confirmLabel: "Delete", danger: true })) …
 *   return <>{…}{confirmDialog}</>;
 *
 * Rendered inline (no portal) with data-cms-ui, so it also works inside the
 * on-site edit popover. Escape / Cancel / backdrop resolve false.
 */
export type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button; focus starts on Cancel. */
  danger?: boolean;
};

export function useConfirm(): [(opts: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [req, setReq] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const ask = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => setReq({ ...opts, resolve })), []);
  const done = useCallback(
    (ok: boolean) =>
      setReq((r) => {
        r?.resolve(ok);
        return null;
      }),
    [],
  );
  return [ask, <ConfirmDialog key="confirm" req={req} onDone={done} />];
}

function ConfirmDialog({ req, onDone }: { req: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null; onDone: (ok: boolean) => void }) {
  const titleId = useId();
  const msgId = useId();
  const box = useRef<HTMLDivElement>(null);
  const cancelBtn = useRef<HTMLButtonElement>(null);
  const okBtn = useRef<HTMLButtonElement>(null);
  const open = !!req;
  useEscape(open, () => onDone(false));

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    (req?.danger ? cancelBtn : okBtn).current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        // Keep focus inside the dialog.
        const items = [cancelBtn.current, okBtn.current].filter(Boolean) as HTMLElement[];
        const i = items.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? items.length - 1 : 1)) % items.length]?.focus();
      }
    };
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("keydown", key, true);
      back?.focus?.({ preventScroll: true });
    };
  }, [open, req?.danger, onDone]);

  return (
    <AnimatePresence>
      {req && (
        <motion.div
          data-cms-ui
          className="fixed inset-0 z-[500] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onPointerDown={(e) => e.target === e.currentTarget && onDone(false)}
        >
          <motion.div
            ref={box}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={req.message ? msgId : undefined}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
            transition={{ duration: 0.4, ease: EASE_LUXE }}
            className="w-full max-w-md bg-ivory p-7 text-ink shadow-[0_30px_80px_-20px_rgba(20,26,23,.55)] sm:p-8"
          >
            <h2 id={titleId} className="font-serif text-2xl leading-tight">
              {req.title}
            </h2>
            {req.message && (
              <div id={msgId} className="mt-3 text-sm leading-relaxed text-muted">
                {req.message}
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
              <button ref={cancelBtn} type="button" onClick={() => onDone(false)} className="min-h-10 text-[11px] uppercase tracking-[0.18em] text-muted hover:text-ink">
                {req.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={okBtn}
                type="button"
                onClick={() => onDone(true)}
                className={`btn min-h-10 px-6 ${req.danger ? "border-error bg-error text-ivory [--btn-fill:var(--color-ink)]" : "btn-ink"}`}
              >
                <span>{req.confirmLabel ?? "OK"}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
