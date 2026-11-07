"use client";

import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/motion";
import Logo from "@/components/ui/Logo";
import { fullName } from "@/lib/site";
import { useSite } from "./SiteContext";

/** How long the CSS intro takes (lift delay + duration in globals.css), in ms. */
const INTRO_MS = 1650;

/**
 * Full-screen intro, shown only on the first home-page visit of a tab
 * (html[data-intro], set by the inline script in src/app/layout.tsx).
 * The animation is CSS (.preloader in globals.css), so it plays and lifts
 * on time even while JavaScript is still loading. JS only runs the counter,
 * pauses smooth scrolling meanwhile, and removes the overlay afterwards.
 */
export default function Preloader() {
  const [gone, setGone] = useState(false);
  const { settings: site } = useSite();
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // No intro this visit: the overlay is display:none (CSS), nothing to do.
    if (!document.documentElement.hasAttribute("data-intro")) return;
    const raf = requestAnimationFrame(() => getLenis()?.stop());
    const controls = animate(0, 100, {
      duration: 0.9,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => {
        if (countRef.current) countRef.current.textContent = String(Math.round(v)).padStart(3, "0");
      },
    });
    const done = window.setTimeout(() => {
      getLenis()?.start();
      setGone(true);
    }, INTRO_MS);
    return () => {
      cancelAnimationFrame(raf);
      controls.stop();
      window.clearTimeout(done);
      getLenis()?.start();
    };
  }, []);

  if (gone) return null;

  return (
    <div aria-hidden="true" className="preloader fixed inset-0 z-[100] flex-col items-center justify-center gap-6 bg-ink text-ivory">
      <div className="relative grid size-33 place-items-center">
        <svg width="132" height="132" viewBox="0 0 132 132" fill="none" className="absolute inset-0">
          <circle className="preloader-ring" cx="66" cy="66" r="64" stroke="#C9A46A" strokeWidth="1" />
        </svg>
        <div className="preloader-logo">
          <Logo size={112} priority />
        </div>
      </div>
      <div className="preloader-name font-serif text-[22px] uppercase tracking-[0.42em]">{fullName(site)}</div>
      <span ref={countRef} className="absolute bottom-10 right-[clamp(20px,4vw,56px)] font-serif text-[64px] font-light leading-none text-ivory/20">
        000
      </span>
    </div>
  );
}
