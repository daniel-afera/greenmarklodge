"use client";

import CmsImage from "@/components/ui/CmsImage";
import { titleLines } from "@/lib/title";
import type { Experience, HomePage } from "@/content/types";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import MaskText from "@/components/ui/MaskText";
import Reveal from "@/components/ui/Reveal";

const SHADES = ["#232C27", "#26302A", "#29342D", "#2C3730"];

function Card({ e, i, total, progress }: { e: Experience; i: number; total: number; progress: MotionValue<number> }) {
  const start = i / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - 1 - i) * 0.04]);
  const brightness = useTransform(progress, [start, 1], [1, 1 - (total - 1 - i) * 0.12]);
  const filter = useTransform(brightness, (b) => `brightness(${b})`);

  return (
    <div className="sticky h-[min(78svh,620px)]" style={{ top: `calc(110px + ${i * 22}px)` }}>
      <motion.article
        style={{ scale, filter, background: SHADES[i % SHADES.length] }}
        className="grid h-full origin-top overflow-hidden border border-ivory/10 md:grid-cols-[1.3fr_1fr]"
      >
        <div className="zoom-img relative min-h-[220px]">
          <CmsImage image={e.image} alt="" fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-between gap-6 p-[clamp(24px,4vw,64px)]">
          <span className="font-serif text-lg text-bronze-light">
            {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <div>
            <h3 className="display mb-5 text-[clamp(32px,3.4vw,52px)] leading-[1.05]">
              {e.title} <em>{e.italic}</em>
            </h3>
            <p className="text-[15px] leading-[1.9] text-ivory/70">{e.text}</p>
          </div>
          <Link href="/experiences" className="hlink eyebrow self-start text-ivory">
            {e.cta}
          </Link>
        </div>
      </motion.article>
    </div>
  );
}

export default function Experiences({ section: head, items }: { section: HomePage["experiencesSection"]; items: Experience[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section id="experiences" className="bg-ink px-[clamp(20px,4vw,56px)] py-[clamp(96px,11vw,160px)] text-ivory">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-[clamp(56px,7vw,96px)] grid items-end gap-12 md:grid-cols-2">
          <div>
            <div className="eyebrow mb-5 text-bronze-light">{head.eyebrow}</div>
            <MaskText
              className="display text-[clamp(42px,5.4vw,84px)] leading-none"
              lines={titleLines(head.title)}
            />
          </div>
          <Reveal>
            <p className="max-w-[460px] text-[15px] leading-[1.9] text-ivory/70">
              {head.text}
            </p>
          </Reveal>
        </div>

        <div ref={ref} className="flex flex-col gap-[12svh]">
          {items.map((e, i) => (
            <Card key={i} e={e} i={i} total={items.length} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}
