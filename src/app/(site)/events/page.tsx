import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/ui/PageHero";
import ParallaxImage from "@/components/ui/ParallaxImage";
import Reveal from "@/components/ui/Reveal";
import MaskText from "@/components/ui/MaskText";
import WordHighlight from "@/components/ui/WordHighlight";
import CmsImage from "@/components/ui/CmsImage";
import CtaBand from "@/components/ui/CtaBand";
import { getEventsPage, getSettings } from "@/content";
import { pageMeta } from "@/lib/seo";
import { titleInline, titleLines, titlePlain } from "@/lib/title";
import { cms } from "@/cms/mark";

export async function generateMetadata(): Promise<Metadata> {
  const [p, s] = await Promise.all([getEventsPage(), getSettings()]);
  return pageMeta(s, { title: p.hero.eyebrow, description: p.hero.text ?? titlePlain(p.hero.title), path: "/events", image: p.hero.image });
}

const m = (f: string) => cms("eventsPage", f);

export default async function EventsPage() {
  const page = await getEventsPage();
  const { intro, celebrations, meetings } = page;
  return (
    <>
      <PageHero hero={page.hero} doc="eventsPage" />

      <section className="container-luxe py-[clamp(80px,9vw,130px)]">
        <div className="grid items-start gap-10 lg:grid-cols-3">
          <Reveal className="eyebrow flex items-center gap-4 text-bronze-deep">
            <span className="h-px w-12 bg-bronze-deep" />
            <span {...m("intro.eyebrow")}>{intro.eyebrow}</span>
          </Reveal>
          <WordHighlight className="font-serif text-[clamp(30px,3.6vw,54px)] font-light leading-[1.22] lg:col-span-2" text={intro.statement} cms={m("intro.statement")} />
        </div>
      </section>

      <section className="bg-sand py-[clamp(72px,8vw,120px)]">
        <div className="container-luxe">
          <div className="eyebrow mb-5 text-bronze-deep" {...m("celebrations.eyebrow")}>
            {celebrations.eyebrow}
          </div>
          <MaskText className="display mb-[clamp(48px,6vw,80px)] text-[clamp(42px,5.4vw,84px)] leading-none" lines={titleLines(celebrations.title)} cms={m("celebrations.title")} />
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-3" {...m("celebrations.items")}>
            {celebrations.items.map((c, i) => (
              <Reveal key={`${c.title}-${i}`} delay={i * 0.08} className="flex flex-col">
                <div className="zoom-img relative aspect-[4/5] overflow-hidden">
                  <CmsImage image={c.image} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" cms={m(`celebrations.items.${i}.image`)} />
                </div>
                <div className="mt-7 flex items-baseline justify-between gap-4">
                  <h3 className="display text-[clamp(30px,2.6vw,40px)] leading-none" {...m(`celebrations.items.${i}.title`)}>
                    {titleInline(c.title)}
                  </h3>
                  {c.local && (
                    <span lang="am" className="text-lg text-bronze-deep" {...m(`celebrations.items.${i}.local`)}>
                      {c.local}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-[15px] leading-[1.9] text-muted" {...m(`celebrations.items.${i}.text`)}>
                  {c.text}
                </p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-14">
            <Link href={`/contact?subject=${encodeURIComponent("Weddings & events")}`} className="hlink eyebrow text-ink">
              Plan a celebration
            </Link>
          </Reveal>
        </div>
      </section>

      <section id="meeting-hall" className="container-luxe scroll-mt-28 py-[clamp(96px,11vw,170px)]">
        <div className="grid grid-cols-12 items-center gap-y-12 md:gap-x-6">
          <ParallaxImage image={meetings.image} cms={m("meetings.image")} sizes="(min-width:768px) 58vw, 100vw" className="col-span-12 h-[clamp(340px,42vw,600px)] md:col-span-7" />
          <Reveal className="col-span-12 md:col-span-4 md:col-start-9">
            <div className="eyebrow mb-5 text-bronze-deep" {...m("meetings.eyebrow")}>
              {meetings.eyebrow}
            </div>
            <h2 className="display mb-6 text-[clamp(38px,3.8vw,60px)] leading-[1.02]" {...m("meetings.title")}>
              {titleInline(meetings.title)}
            </h2>
            <p className="text-[15px] leading-[1.9] text-muted" {...m("meetings.text")}>
              {meetings.text}
            </p>
            {meetings.highlights.length > 0 && (
              <ul className="mt-8" {...m("meetings.highlights")}>
                {meetings.highlights.map((h, i) => (
                  <li key={`${h}-${i}`} className="flex items-baseline gap-5 border-t border-ink/10 py-4 last:border-b">
                    <span className="eyebrow w-6 shrink-0 text-[10px] text-bronze-deep">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-serif text-[clamp(19px,1.6vw,22px)] leading-snug">{h}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/contact?subject=${encodeURIComponent("Meeting hall")}`} className="hlink eyebrow mt-8 inline-block text-ink" {...m("meetings.linkLabel")}>
              {meetings.linkLabel}
            </Link>
          </Reveal>
        </div>
      </section>

      <CtaBand cta={page.cta} doc="eventsPage" />
    </>
  );
}
