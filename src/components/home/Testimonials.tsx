"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Testimonial } from "@/content/types";
import { EASE_LUXE } from "@/lib/motion";
import { cms } from "@/cms/mark";

export default function Testimonials({ items: testimonials }: { items: Testimonial[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const count = testimonials.length;
    if (paused || count < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % count), 6500);
    return () => clearInterval(t);
  }, [paused, testimonials.length]);

  const q = testimonials[i % testimonials.length];
  if (!testimonials.length) return null;

  return (
    <section
      className="bg-ink px-[clamp(20px,4vw,56px)] py-[clamp(96px,11vw,160px)] text-center text-ivory"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Guest reviews"
    >
      <div className="mx-auto max-w-[980px]">
        <svg width="44" height="34" viewBox="0 0 44 34" fill="none" stroke="#C9A46A" aria-hidden="true" className="mx-auto mb-10">
          <path d="M2 32 V18 C2 8 8 2 18 2 M26 32 V18 C26 8 32 2 42 2" />
        </svg>
        <div className="grid min-h-[260px] items-center md:min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
              transition={{ duration: 0.9, ease: EASE_LUXE }}
            >
              <blockquote className="font-serif text-[clamp(28px,3.2vw,46px)] font-light italic leading-[1.3]" {...cms(q._id, "text")}>“{q.text}”</blockquote>
              <figcaption className="eyebrow mt-9 text-bronze-light" {...cms(q._id, "who")}>
                {q.who}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-12 flex justify-center gap-1">
          {testimonials.map((_, n) => (
            <button key={n} type="button" onClick={() => setI(n)} aria-label={`Show review ${n + 1}`} aria-current={n === i} className="flex h-11 w-12 items-center justify-center">
              <span className={`block h-px transition-all duration-500 ${n === i ? "w-12 bg-bronze-light" : "w-7 bg-ivory/30"}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
