"use client";

import CmsImage from "@/components/ui/CmsImage";
import { titleLines } from "@/lib/title";
import type { HomePage, RoomOption } from "@/content/types";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import MaskText from "@/components/ui/MaskText";
import BookingBar from "@/components/booking/BookingBar";
import { EASE_LUXE, intro } from "@/lib/motion";

export default function Hero({ hero, rooms }: { hero: HomePage["hero"]; rooms: RoomOption[] }) {
  const ref = useRef<HTMLElement>(null);
  // Wait for the preloader on first load; play quickly on client navigation.
  const [base] = useState(() => (intro.played ? 0.45 : 2.05));
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative flex h-svh min-h-[760px] flex-col justify-end overflow-hidden text-ivory">
      <motion.div className="absolute inset-0" style={{ y: imgY }}>
        <CmsImage
          image={hero.image}
          fill
          priority
          sizes="100vw"
          className="animate-kenburns object-cover"
        />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,26,23,.55)_0%,rgba(20,26,23,.08)_35%,rgba(20,26,23,.25)_60%,rgba(20,26,23,.85)_100%)]" />

      <motion.div style={{ y: contentY, opacity: fade }} className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-[clamp(20px,4vw,56px)] pb-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <motion.div
              className="eyebrow mb-6 text-champagne"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: EASE_LUXE, delay: base + 0.15 }}
            >
              {hero.eyebrow}
            </motion.div>
            <MaskText
              as="h1"
              immediate
              delay={base}
              stagger={0.14}
              className="display text-[clamp(54px,8.4vw,136px)] leading-[0.94]"
              lines={titleLines(hero.title)}
            />
          </div>
          <motion.div
            className="hidden flex-col items-center gap-3.5 md:flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: base + 0.7 }}
          >
            <span className="eyebrow text-[10px] [writing-mode:vertical-rl]">Scroll</span>
            <span className="scroll-cue" />
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.3, ease: EASE_LUXE, delay: base + 0.45 }}>
          <BookingBar rooms={rooms} />
        </motion.div>
      </motion.div>
    </section>
  );
}
