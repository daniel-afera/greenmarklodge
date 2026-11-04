"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_LUXE } from "@/lib/motion";

/**
 * Each line rises out of an invisible mask. `immediate` plays on mount
 * (heroes); otherwise it plays when scrolled into view.
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
  const Tag = motion[as];
  const trigger = immediate ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } };
  return (
    <Tag className={className} initial="hidden" {...trigger} {...cms}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
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
