"use client";

import { motion } from "motion/react";
import { EASE_CURTAIN, EASE_LUXE } from "@/lib/motion";
import { useSite } from "@/components/layout/SiteContext";

/** Runs on every navigation: an ink curtain wipes up, then the page fades in. */
export default function Template({ children }: { children: React.ReactNode }) {
  const { settings: site, editing } = useSite();
  if (editing) return <>{children}</>;
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-ink"
        initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 100% 0%)" }}
        transition={{ duration: 1, ease: EASE_CURTAIN, delay: 0.2 }}
      >
        <motion.span
          className="pl-[0.42em] font-serif text-2xl uppercase tracking-[0.42em] text-ivory"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: EASE_LUXE, delay: 0.15 }}
        >
          {site.name}
        </motion.span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, ease: EASE_LUXE, delay: 0.35 }}>
        {children}
      </motion.div>
    </>
  );
}
