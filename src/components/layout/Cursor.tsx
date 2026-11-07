"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

/**
 * A soft trailing ring that grows into a label ("View", "Drag") over
 * elements marked with data-cursor. Hidden on touch devices via CSS.
 */
export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.5 });
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      setLabel(el?.dataset.cursor ?? null);
    };
    const leave = () => setVisible(false);
    const down = () => setLabel(null);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden="true"
      data-no-js-hide
      className="pointer-events-none fixed left-0 top-0 z-[120] hidden mix-blend-normal pointer-fine:block"
      style={{ x: sx, y: sy }}
    >
      <motion.div
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-medium uppercase tracking-[0.25em]"
        animate={{
          width: label ? 96 : 34,
          height: label ? 96 : 34,
          opacity: visible ? 1 : 0,
          backgroundColor: label ? "rgba(176,141,87,0.95)" : "rgba(176,141,87,0)",
          borderColor: label ? "rgba(176,141,87,0)" : "rgba(176,141,87,0.8)",
          color: label ? "#1C2420" : "rgba(0,0,0,0)",
        }}
        style={{ borderWidth: 1, borderStyle: "solid" }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        {label}
      </motion.div>
    </motion.div>
  );
}
