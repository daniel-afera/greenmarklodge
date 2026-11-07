import type Lenis from "lenis";

/** Shared easing curves (match the CSS tokens in globals.css). */
export const EASE_LUXE = [0.19, 1, 0.22, 1] as const;
export const EASE_CURTAIN = [0.76, 0, 0.24, 1] as const;

/** Global Lenis instance so components can stop/start/scrollTo. */
let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  lenis = l;
};
export const getLenis = () => lenis;
