"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { EASE_LUXE } from "@/lib/motion";
import type { Img } from "@/content/types";
import CmsImage from "./CmsImage";

/**
 * Image that drifts against the scroll and (optionally) unveils with a
 * clip-path wipe the first time it enters the viewport.
 */
export default function ParallaxImage({
  image,
  alt,
  className = "",
  sizes = "100vw",
  amount = 10,
  reveal = true,
  priority = false,
  cms,
}: {
  image: Img;
  alt?: string;
  className?: string;
  sizes?: string;
  amount?: number;
  reveal?: boolean;
  priority?: boolean;
  cms?: { "data-cms"?: string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      initial={reveal ? { clipPath: "inset(16% 8% 16% 8%)" } : false}
      whileInView={reveal ? { clipPath: "inset(0% 0% 0% 0%)" } : undefined}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.6, ease: EASE_LUXE }}
    >
      <motion.div className="absolute inset-0" style={{ y, scale: 1 + (amount * 2.2) / 100 }}>
        <CmsImage image={image} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" cms={cms} />
      </motion.div>
    </motion.div>
  );
}
