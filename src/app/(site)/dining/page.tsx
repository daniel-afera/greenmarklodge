import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import ParallaxImage from "@/components/ui/ParallaxImage";
import Reveal from "@/components/ui/Reveal";
import WordHighlight from "@/components/ui/WordHighlight";
import CtaBand from "@/components/ui/CtaBand";
import ButtonLink from "@/components/ui/ButtonLink";
import { getDiningPage, getVenues } from "@/content";
import { titlePlain } from "@/lib/title";
import { cms } from "@/cms/mark";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getDiningPage();
  return { title: p.hero.eyebrow, description: p.hero.text ?? titlePlain(p.hero.title) };
}

export default async function DiningPage() {
  const [page, venues] = await Promise.all([getDiningPage(), getVenues()]);
  return (
    <>
      <PageHero hero={page.hero} doc="diningPage" />

      <section className="container-luxe py-[clamp(96px,12vw,170px)]">
        <WordHighlight className="mx-auto max-w-[1100px] text-center font-serif text-[clamp(28px,3.4vw,50px)] font-light leading-[1.25]" text={page.statement} cms={cms("diningPage", "statement")} />
      </section>

      <section className="container-luxe flex flex-col gap-[clamp(80px,10vw,150px)] pb-[clamp(96px,10vw,150px)]">
        {venues.map((v, i) => (
          <article key={`${v.name}-${i}`} className={`flex flex-wrap items-center gap-[clamp(32px,5vw,80px)] ${i % 2 ? "flex-row-reverse" : ""}`}>
            <ParallaxImage image={v.image} cms={cms(v._id, "image")} sizes="(min-width:1024px) 58vw, 100vw" className="h-[clamp(360px,42vw,620px)] min-w-0 flex-[999_1_520px]" />
            <Reveal className="flex min-w-0 flex-[1_1_360px] flex-col gap-6">
              <span className="eyebrow text-bronze-deep" {...cms(v._id, "kind")}>
                {v.kind}
              </span>
              <h2 className="display text-[clamp(40px,4vw,64px)] leading-none" {...cms(v._id, "name")}>
                {v.name}
              </h2>
              <p className="text-[15px] leading-[1.9] text-muted" {...cms(v._id, "text")}>
                {v.text}
              </p>
              <div className="flex items-center justify-between border-t border-ink/10 pt-6 text-sm">
                <span className="text-muted">Open</span>
                <span className="font-serif text-xl" {...cms(v._id, "hours")}>
                  {v.hours}
                </span>
              </div>
              <div>
                <ButtonLink href="/contact" variant="dark">
                  Reserve a table
                </ButtonLink>
              </div>
            </Reveal>
          </article>
        ))}
      </section>

      <CtaBand cta={page.cta} doc="diningPage" />
    </>
  );
}
