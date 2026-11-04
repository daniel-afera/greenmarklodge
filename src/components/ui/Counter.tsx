"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";

/** Counts up from 0 the first time it scrolls into view. */
export default function Counter({ to, className = "" }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });

  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, {
      duration: 2.2,
      ease: [0.19, 1, 0.22, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("en-US");
      },
    });
    return () => c.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className={className}>
      {to.toLocaleString("en-US")}
    </span>
  );
}
