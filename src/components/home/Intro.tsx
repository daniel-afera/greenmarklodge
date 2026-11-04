import Link from "next/link";
import WordHighlight from "@/components/ui/WordHighlight";
import ParallaxImage from "@/components/ui/ParallaxImage";
import Reveal from "@/components/ui/Reveal";
import type { HomePage } from "@/content/types";

export default function Intro({ intro }: { intro: HomePage["intro"] }) {
  return (
    <section id="lodge" className="container-luxe pb-[clamp(80px,10vw,140px)] pt-[clamp(96px,12vw,180px)]">
      <div className="grid items-start gap-12 lg:grid-cols-3">
        <Reveal className="eyebrow flex items-center gap-4 text-bronze-deep">
          <span className="h-px w-12 bg-bronze-deep" />
          {intro.label}
        </Reveal>
        <WordHighlight className="font-serif text-[clamp(30px,3.6vw,54px)] font-light leading-[1.22] lg:col-span-2" text={intro.statement} />
      </div>

      <div className="mt-[clamp(64px,9vw,130px)] grid grid-cols-12 items-end gap-6">
        <ParallaxImage image={intro.imageLarge} sizes="(min-width:1024px) 58vw, 100vw" className="col-span-12 h-[clamp(360px,46vw,680px)] md:col-span-7" />
        <div className="col-span-12 flex flex-col gap-8 pb-6 md:col-span-4 md:col-start-9">
          <ParallaxImage image={intro.imageSmall} sizes="(min-width:1024px) 30vw, 100vw" className="h-[clamp(240px,26vw,400px)]" />
          <Reveal>
            <p className="text-[15px] leading-[1.9] text-muted">{intro.body}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link href="/experiences" className="hlink eyebrow text-ink">
              {intro.linkLabel}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
