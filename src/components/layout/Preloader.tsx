"use client";

import { animate, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EASE_CURTAIN, getLenis, intro } from "@/lib/motion";
import { useSite } from "./SiteContext";

/** Full-screen intro on first load: monogram draws, counter runs, curtain lifts. */
export default function Preloader() {
  const [gone, setGone] = useState(false);
  const { settings: site } = useSite();
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => getLenis()?.stop());
    const controls = animate(0, 100, {
      duration: 1.6,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => {
        if (countRef.current) countRef.current.textContent = String(Math.round(v)).padStart(3, "0");
      },
    });
    return () => {
      cancelAnimationFrame(raf);
      controls.stop();
    };
  }, []);

  if (gone) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-ink text-ivory"
      initial={{ y: 0 }}
      animate={{ y: "-100%" }}
      transition={{ duration: 1.05, ease: EASE_CURTAIN, delay: 1.8 }}
      onAnimationComplete={() => {
        intro.played = true;
        getLenis()?.start();
        setGone(true);
      }}
    >
      <svg width="104" height="104" viewBox="0 0 104 104" fill="none">
        <motion.circle
          cx="52"
          cy="52"
          r="48"
          stroke="#C9A46A"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1], delay: 0.1 }}
        />
        <motion.path
          d="M36 70 L52 30 L68 70 M42 56 H62"
          stroke="#C9A46A"
          strokeWidth="1.2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.65, 0, 0.35, 1], delay: 0.5 }}
        />
      </svg>
      <motion.div
        className="font-serif text-[22px] uppercase"
        initial={{ opacity: 0, letterSpacing: "0.7em" }}
        animate={{ opacity: 1, letterSpacing: "0.42em" }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.45 }}
      >
        {site.name}
      </motion.div>
      <span ref={countRef} className="absolute bottom-10 right-[clamp(20px,4vw,56px)] font-serif text-[64px] font-light leading-none text-ivory/20">
        000
      </span>
    </motion.div>
  );
}
