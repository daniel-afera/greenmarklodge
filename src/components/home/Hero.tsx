"use client";

import CmsImage from "@/components/ui/CmsImage";
import { titleLines } from "@/lib/title";
import type { HomePage, RoomOption } from "@/content/types";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import MaskText from "@/components/ui/MaskText";
import BookingBar from "@/components/booking/BookingBar";
import { cms } from "@/cms/mark";

export default function Hero({ hero, rooms }: { hero: HomePage["hero"]; rooms: RoomOption[] }) {
  const ref = useRef<HTMLElement>(null);
  // Entrance timing is CSS (.rise-* in globals.css): it waits for the preloader
  // only when that plays, and doesn't wait for JavaScript at all.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative flex h-svh min-h-[760px] flex-col justify-end overflow-hidden text-ivory">
      <motion.div className="absolute inset-0" style={{ y: imgY }}>
        <CmsImage
          image={hero.image}
          cms={cms("homePage", "hero.image")}
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
            <div className="rise-fade eyebrow mb-6 text-champagne" style={{ "--d": "0.15s" } as React.CSSProperties} {...cms("homePage", "hero.eyebrow")}>
              {hero.eyebrow}
            </div>
            <MaskText
              as="h1"
              immediate
              stagger={0.14}
              className="display text-[clamp(54px,8.4vw,136px)] leading-[0.94]"
              lines={titleLines(hero.title)}
              cms={cms("homePage", "hero.title")}
            />
          </div>
          <div className="fade-in hidden flex-col items-center gap-3.5 md:flex" style={{ "--d": "0.7s" } as React.CSSProperties}>
            <span className="eyebrow text-[10px] [writing-mode:vertical-rl]">Scroll</span>
            <span className="scroll-cue" />
          </div>
        </div>
        <div className="rise-fade" style={{ "--d": "0.45s", "--rise": "30px" } as React.CSSProperties}>
          <BookingBar rooms={rooms} />
        </div>
      </motion.div>
    </section>
  );
}
