"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_LUXE } from "@/lib/motion";

/** Fades + lifts its children in when scrolled into view. */
export default function Reveal({
  children,
  delay = 0,
  y = 50,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article" | "p";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1.3, ease: EASE_LUXE, delay }}
    >
      {children}
    </Tag>
  );
}
