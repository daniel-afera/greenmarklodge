"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import MaskText from "./MaskText";
import CmsImage from "./CmsImage";
import { titleLines } from "@/lib/title";
import type { Hero } from "@/content/types";
import { cms } from "@/cms/mark";

/** Full-bleed hero for inner pages: Ken Burns image, masked title, scroll fade. Only the heading sits on the photo; `hero.text` is the page description for search engines and link previews. */
/** `doc` (e.g. "gardensPage") marks the hero for on-site editing; overrides (eyebrow/title props) aren't editable here. */
export default function PageHero({ hero, doc, eyebrow, title, tall = false }: { hero: Hero; doc?: string; eyebrow?: string; title?: string; tall?: boolean }) {
  const m = (f: string) => cms(doc, `hero.${f}`);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className={`relative flex items-end overflow-hidden text-ivory ${tall ? "h-svh min-h-[680px]" : "h-[80svh] min-h-[560px]"}`}>
      <motion.div className="absolute inset-0" style={{ y }}>
        <CmsImage image={hero.image} fill priority sizes="100vw" className="animate-kenburns object-cover" cms={m("image")} />
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
