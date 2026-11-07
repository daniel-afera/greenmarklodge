import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/ui/PageHero";
import ParallaxImage from "@/components/ui/ParallaxImage";
import Reveal from "@/components/ui/Reveal";
import WordHighlight from "@/components/ui/WordHighlight";
import CmsImage from "@/components/ui/CmsImage";
import CtaBand from "@/components/ui/CtaBand";
import { getGardensPage, getSettings } from "@/content";
import type { PhotoCard } from "@/content/types";
import { pageMeta } from "@/lib/seo";
import { titleInline, titlePlain } from "@/lib/title";
import { cms } from "@/cms/mark";

export async function generateMetadata(): Promise<Metadata> {
  const [p, s] = await Promise.all([getGardensPage(), getSettings()]);
  return pageMeta(s, { title: p.hero.eyebrow, description: p.hero.text ?? titlePlain(p.hero.title), path: "/gardens", image: p.hero.image });
}

function Card({ card, field, delay = 0, children }: { card: PhotoCard; field: string; delay?: number; children?: React.ReactNode }) {
  const m = (f: string) => cms("gardensPage", `${field}.${f}`);
  return (
    <Reveal delay={delay} className="flex flex-col">
      <div className="zoom-img relative h-[clamp(300px,34vw,500px)] overflow-hidden">
        <CmsImage image={card.image} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" cms={m("image")} />
      </div>
      <h2 className="display mt-8 text-[clamp(34px,3.2vw,48px)] leading-none" {...m("title")}>
        {titleInline(card.title)}
      </h2>
      <p className="mt-4 max-w-[460px] text-[15px] leading-[1.9] text-muted" {...m("text")}>
        {card.text}
      </p>
      {children}
    </Reveal>
  );
}

export default async function GardensPage() {
  const page = await getGardensPage();
  const intro = page.intro;
  return (
    <>
      <PageHero hero={page.hero} doc="gardensPage" />

      <section className="container-luxe pb-[clamp(72px,8vw,120px)] pt-[clamp(80px,9vw,130px)]">
        <div className="grid items-start gap-10 lg:grid-cols-3">
          <Reveal className="eyebrow flex items-center gap-4 text-bronze-deep">
            <span className="h-px w-12 bg-bronze-deep" />
            <span {...cms("gardensPage", "intro.eyebrow")}>{intro.eyebrow}</span>
          </Reveal>
          <WordHighlight
            className="font-serif text-[clamp(30px,3.6vw,54px)] font-light leading-[1.22] lg:col-span-2"
            text={intro.statement}
            cms={cms("gardensPage", "intro.statement")}
          />
        </div>

        <div className="mt-[clamp(56px,7vw,100px)] grid grid-cols-12 items-center gap-y-12 md:gap-x-6">
          <ParallaxImage
            image={intro.image}
            cms={cms("gardensPage", "intro.image")}
            sizes="(min-width:768px) 58vw, 100vw"
            className="col-span-12 h-[clamp(360px,44vw,620px)] md:col-span-7"
          />
          {intro.highlights.length > 0 && (
            <ul className="col-span-12 md:col-span-4 md:col-start-9" {...cms("gardensPage", "intro.highlights")}>
              {intro.highlights.map((h, i) => (
                <Reveal as="li" key={`${h}-${i}`} delay={i * 0.06} className="flex items-baseline gap-5 border-t border-ink/10 py-5 last:border-b">
                  <span className="eyebrow w-6 shrink-0 text-[10px] text-bronze-deep">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-serif text-[clamp(20px,1.8vw,24px)] leading-snug">{h}</span>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-sand py-[clamp(72px,8vw,120px)]">
        <div className="container-luxe grid gap-x-8 gap-y-16 md:grid-cols-2">
          <Card card={page.moments} field="moments" />
          <Card card={page.surroundings} field="surroundings" delay={0.1}>
            <Link href="/contact" className="hlink eyebrow mt-6 self-start text-ink">
              Ask our team
            </Link>
          </Card>
        </div>
      </section>

      <CtaBand cta={page.cta} doc="gardensPage" />
    </>
  );
}
