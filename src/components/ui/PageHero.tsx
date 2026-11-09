"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import MaskText from "./MaskText";
import CmsImage from "./CmsImage";
import { titleLines } from "@/lib/title";
import type { Hero, Img } from "@/content/types";
import { cms } from "@/cms/mark";

/** Full-bleed hero for inner pages: Ken Burns image, masked title, scroll fade. Only the heading sits on the photo; `hero.text` is the page description for search engines and link previews. */
/** `doc` (e.g. "gardensPage") marks the hero for on-site editing; overrides (eyebrow/title props) aren't editable here. */
/** `slides` (extra photos) turn the header into a slow crossfading slideshow after hero.image. */
export default function PageHero({ hero, doc, eyebrow, title, tall = false, slides = [] }: { hero: Hero; doc?: string; eyebrow?: string; title?: string; tall?: boolean; slides?: Img[] }) {
  const m = (f: string) => cms(doc, `hero.${f}`);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className={`relative flex items-end overflow-hidden text-ivory ${tall ? "h-svh min-h-[680px]" : "h-[80svh] min-h-[560px]"}`}>
      <motion.div className="absolute inset-0" style={{ y }}>
        {slides.length ? (
          <Slideshow images={[hero.image, ...slides]} cms={m("image")} />
        ) : (
          <CmsImage image={hero.image} fill priority sizes="100vw" className="animate-kenburns object-cover" cms={m("image")} />
        )}
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-night/45 via-night/10 to-night/80" />
      <motion.div style={{ opacity: fade }} className="container-luxe relative flex flex-wrap items-end justify-between gap-8 pb-[clamp(48px,6vw,88px)]">
        <div>
          <div className="rise-fade eyebrow mb-6 text-champagne" style={{ "--d": "0.1s" } as React.CSSProperties} {...(eyebrow ? {} : m("eyebrow"))}>
            {eyebrow ?? hero.eyebrow}
          </div>
          <MaskText as="h1" immediate lines={titleLines(title ?? hero.title)} className="display text-[clamp(52px,8vw,128px)] leading-[0.94]" cms={title ? undefined : m("title")} />
        </div>
      </motion.div>
    </section>
  );
}

const SLIDE_MS = 6500;

function Slideshow({ images, cms: mark }: { images: Img[]; cms: { "data-cms"?: string } }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % images.length);
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [images.length, reduce]);

  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.6, ease: "easeInOut" }}>
          <CmsImage image={images[i]} fill priority={i === 0} sizes="100vw" className="animate-kenburns object-cover" {...(i === 0 ? { cms: mark } : {})} />
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-[clamp(20px,3vw,36px)] right-[clamp(20px,4vw,56px)] z-10 flex gap-1">
        {images.map((_, n) => (
          <button key={n} type="button" onClick={() => setI(n)} aria-label={`Show photo ${n + 1}`} aria-current={n === i} className="flex h-11 w-10 items-center justify-center">
            <span className={`block h-px transition-all duration-500 ${n === i ? "w-10 bg-champagne" : "w-6 bg-ivory/40"}`} />
          </button>
        ))}
      </div>
    </>
  );
}
