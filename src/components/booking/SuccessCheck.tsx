"use client";

import { motion } from "motion/react";

export default function SuccessCheck() {
  return (
    <svg width="96" height="96" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <motion.circle
        cx="40"
        cy="40"
        r="37"
        stroke="#B08D57"
        strokeWidth="1.2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.path
        d="M25 41 L35 51 L56 30"
        stroke="#1C2420"
        strokeWidth="1.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1], delay: 0.85 }}
      />
    </svg>
  );
}
