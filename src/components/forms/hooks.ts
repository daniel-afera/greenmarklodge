"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore, type RefObject } from "react";

/**
 * Open layers (dropdowns, popovers, dialogs) in the order they opened.
 * Escape closes only the newest, so a dropdown inside a dialog closes
 * without closing the dialog.
 */
const layers: symbol[] = [];

/** Call `onEscape` when Escape is pressed and this is the newest open layer. */
export function useEscape(open: boolean, onEscape: () => void) {
  // Latest handler in a ref: re-renders must not re-register (that would reorder the layers).
  const handler = useRef(onEscape);
  useEffect(() => {
    handler.current = onEscape;
  });
  useEffect(() => {
    if (!open) return;
    const me = Symbol();
    layers.push(me);
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || layers[layers.length - 1] !== me) return;
      e.stopPropagation();
      e.preventDefault();
      handler.current();
    };
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("keydown", key, true);
      layers.splice(layers.indexOf(me), 1);
    };
  }, [open]);
}

/** Close a popover on outside pointer-down or Escape. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: (reason: "outside" | "escape") => void) {
  useEscape(open, useCallback(() => onClose("escape"), [onClose]));
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose("outside");
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [ref, open, onClose]);
}

export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
