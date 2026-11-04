"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";

/** Close a popover on outside pointer-down or Escape. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: (reason: "outside" | "escape") => void) {
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose("outside");
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose("escape");
      }
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key, true);
    };
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
