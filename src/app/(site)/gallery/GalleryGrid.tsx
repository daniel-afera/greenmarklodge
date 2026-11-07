"use client";

import CmsImage from "@/components/ui/CmsImage";
import type { Img } from "@/content/types";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { EASE_LUXE, getLenis } from "@/lib/motion";
import { cms } from "@/cms/mark";

export default function GalleryGrid({ images: gallery }: { images: Img[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const count = gallery.length;
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + count) % count)), [count]);

  useEffect(() => {
    if (open === null) return;
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      getLenis()?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  return (
    <>
      <div className="container-luxe columns-1 gap-5 pb-[clamp(96px,10vw,150px)] sm:columns-2 lg:columns-3">
        {gallery.map((g, i) => (
          <motion.button
            key={`${g.src}-${i}`}
            type="button"
            onClick={() => setOpen(i)}
            data-cursor="View"
            {...cms("galleryPage", "images")}
            aria-label={`Open image: ${g.alt}`}
            className="zoom-img relative mb-5 block w-full break-inside-avoid"
            initial={{ opacity: 0, y: 60, clipPath: "inset(12% 6% 12% 6%)" }}
            whileInView={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 1.3, ease: EASE_LUXE, delay: (i % 3) * 0.08 }}
          >
            <CmsImage image={g} sizes="(min-width:1440px) 430px, (min-width:1024px) calc((92vw - 40px) / 3), (min-width:640px) calc((92vw - 20px) / 2), calc(100vw - 40px)" className="h-auto w-full" />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
            className="fixed inset-0 z-[95] flex items-center justify-center bg-night/95 p-4 backdrop-blur-sm md:p-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={close}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={open}
                className="relative h-full w-full"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: EASE_LUXE }}
              >
                <CmsImage image={gallery[open]} fill sizes="100vw" className="object-contain" style={{ objectPosition: "center" }} />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-8 text-ivory" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => step(-1)} aria-label="Previous image" className="flex h-12 w-12 items-center justify-center rounded-full border border-ivory/30 transition-colors hover:bg-ivory hover:text-ink">
                ←
              </button>
              <span className="eyebrow min-w-20 text-center">
                {String(open + 1).padStart(2, "0")} / {gallery.length}
              </span>
              <button type="button" onClick={() => step(1)} aria-label="Next image" className="flex h-12 w-12 items-center justify-center rounded-full border border-ivory/30 transition-colors hover:bg-ivory hover:text-ink">
                →
              </button>
            </div>
            <button type="button" onClick={close} autoFocus className="eyebrow absolute right-6 top-6 min-h-11 text-ivory hover:text-bronze-light">
              Close ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
