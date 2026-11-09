"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { EASE_LUXE } from "@/lib/motion";
import type { Img } from "@/content/types";
import CmsImage from "@/components/ui/CmsImage";

/**
 * Experience photo: the main image (parallax + clip-path unveil) with a row
 * of small tiles beneath that swap it. The first photo keeps the editor mark.
 */
export default function ExperienceGallery({
  images,
  className = "",
  frameClassName = "",
  cms,
}: {
  images: Img[];
  className?: string;
  frameClassName?: string;
  cms?: { "data-cms"?: string };
}) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const current = images[i] ?? images[0];

  return (
    <div className={className}>
      <motion.div
        ref={ref}
        className={`relative overflow-hidden bg-ink/10 ${frameClassName}`}
        initial={{ clipPath: "inset(16% 8% 16% 8%)" }}
        whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 1.6, ease: EASE_LUXE }}
      >
        <motion.div className="absolute inset-0" style={{ y, scale: 1.18 }}>
          <AnimatePresence initial={false}>
            <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: EASE_LUXE }}>
              <CmsImage image={current} fill sizes="(min-width:768px) 60vw, 100vw" className="object-cover" {...(i === 0 ? { cms } : {})} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 sm:mt-4 sm:gap-3" role="group" aria-label="More photos">
          {images.map((im, n) => (
            <button
              key={`${im.src}-${n}`}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show photo ${n + 1}: ${im.alt}`}
              aria-pressed={n === i}
              className={`relative aspect-[4/3] w-[clamp(64px,9vw,112px)] overflow-hidden outline-offset-2 transition-opacity duration-300 ${n === i ? "opacity-100 ring-1 ring-bronze ring-offset-2 ring-offset-ivory" : "opacity-55 hover:opacity-90"}`}
            >
              <CmsImage image={im} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
