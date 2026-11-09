"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_LUXE } from "@/lib/motion";

/**
 * Each line rises out of an invisible mask. `immediate` (heroes) plays on
 * first paint as a CSS animation (.rise-mask in globals.css), so the headline
 * never waits for JavaScript; `delay` is added to the shared intro base.
 * Otherwise it plays with motion when scrolled into view.
 */
export default function MaskText({
  lines,
  delay = 0,
  stagger = 0.12,
  immediate = false,
  className = "",
  as = "h2",
  cms,
}: {
  lines: ReactNode[];
  delay?: number;
  stagger?: number;
  immediate?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  cms?: { "data-cms"?: string };
}) {
  if (immediate) {
    const Plain = as;
    return (
      <Plain className={className} {...cms}>
        {lines.map((line, i) => (
          <span key={i} className="block pb-[0.08em] [clip-path:inset(0_-100vw_-0.3em_0)]">
            <span className="rise-mask block" style={{ "--d": `${delay + i * stagger}s` } as React.CSSProperties}>
              {line}
            </span>
          </span>
        ))}
      </Plain>
    );
  }

  const Tag = motion[as];
  return (
    <Tag className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -10% 0px" }} {...cms}>
      {lines.map((line, i) => (
        <span key={i} className="block pb-[0.08em] [clip-path:inset(0_-100vw_-0.3em_0)]">
          <motion.span
            className="block"
            variants={{ hidden: { y: "110%" }, show: { y: 0 } }}
            transition={{ duration: 1.4, ease: EASE_LUXE, delay: delay + i * stagger }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
