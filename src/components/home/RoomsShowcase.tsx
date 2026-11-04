"use client";

import CmsImage from "@/components/ui/CmsImage";
import { titleLines } from "@/lib/title";
import type { HomePage, Room } from "@/content/types";
import Link from "next/link";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import ButtonLink from "@/components/ui/ButtonLink";
import MaskText from "@/components/ui/MaskText";
import { cms } from "@/cms/mark";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Desktop: the section pins and the room cards travel sideways as you scroll.
 * Mobile / reduced motion: a native swipeable row with snap points.
 */
export default function RoomsShowcase({ section: head, rooms }: { section: HomePage["roomsSection"]; rooms: Room[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(bar.current, { scaleX: self.progress }),
          },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section ref={section} id="rooms" className="flex flex-col justify-center overflow-hidden bg-sand py-[clamp(96px,11vw,160px)] lg:h-svh lg:py-0">
      <div className="container-luxe flex flex-wrap items-end justify-between gap-8">
        <div>
          <div className="eyebrow mb-5 text-bronze-deep" {...cms("homePage", "roomsSection.eyebrow")}>
            {head.eyebrow}
          </div>
          <MaskText
            className="display text-[clamp(42px,5.4vw,84px)] leading-none"
            lines={titleLines(head.title)}
            cms={cms("homePage", "roomsSection.title")}
          />
        </div>
        <div className="flex items-center gap-8">
          <span className="relative hidden h-px w-40 bg-ink/15 lg:block" aria-hidden="true">
            <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-ink" />
          </span>
          <ButtonLink href="/rooms" variant="dark">
            All residences
          </ButtonLink>
        </div>
      </div>

      <div
        ref={track}
        data-cursor="Drag"
        className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-7 overflow-x-auto px-[clamp(20px,4vw,56px)] lg:mt-16 lg:w-max lg:snap-none lg:overflow-visible"
      >
        {rooms.map((r, i) => (
          <Link
            key={r.slug}
            href={`/rooms/${r.slug}`}
            data-cursor="View"
            className="group w-[clamp(290px,34vw,500px)] shrink-0 snap-start text-ink"
          >
            <div className="zoom-img relative h-[clamp(380px,40vw,560px)] lg:h-[min(56svh,560px)]">
              <CmsImage image={r.images[0]} fill sizes="(min-width:1024px) 34vw, 85vw" className="object-cover" cms={cms(r._id, "images")} />
              <span className="eyebrow absolute left-5 top-5 bg-ivory/90 px-3.5 py-2 text-[10px]" {...cms(r._id, "tag")}>
                {r.tag}
              </span>
              <span className="absolute bottom-5 right-5 font-serif text-5xl font-light text-ivory/90">0{i + 1}</span>
            </div>
            <div className="mt-6 flex items-baseline justify-between gap-4">
              <h3 className="font-serif text-[32px]" {...cms(r._id, "name")}>
                {r.name}
              </h3>
              <span className="whitespace-nowrap text-xs text-muted" {...cms(r._id, "view")}>
                {r.view}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[13px] text-muted">
              <span {...cms(r._id, "short")}>{r.short}</span>
              <span className="eyebrow translate-y-2 text-[10px] text-bronze-deep opacity-0 transition-all duration-700 ease-[cubic-bezier(.19,1,.22,1)] group-hover:translate-y-0 group-hover:opacity-100">
                Explore →
              </span>
            </div>
          </Link>
        ))}
        <div className="w-px shrink-0 lg:w-[clamp(20px,4vw,56px)]" />
      </div>
    </section>
  );
}
