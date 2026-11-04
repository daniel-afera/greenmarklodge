import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import ParallaxImage from "@/components/ui/ParallaxImage";
import Reveal from "@/components/ui/Reveal";
import MaskText from "@/components/ui/MaskText";
import CtaBand from "@/components/ui/CtaBand";
import ButtonLink from "@/components/ui/ButtonLink";
import { getSpaPage, getTreatments } from "@/content";
import { titleInline, titleLines, titlePlain } from "@/lib/title";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getSpaPage();
  return { title: p.hero.eyebrow, description: p.hero.text ?? titlePlain(p.hero.title) };
}

export default async function SpaPage() {
  const [page, treatments] = await Promise.all([getSpaPage(), getTreatments()]);
  return (
    <>
      <PageHero hero={page.hero} />

      <section className="container-luxe grid items-center gap-[clamp(40px,6vw,96px)] py-[clamp(96px,11vw,160px)] lg:grid-cols-2">
        <div>
          <div className="eyebrow mb-5 text-bronze-deep">{page.philosophyEyebrow}</div>
          <MaskText className="display mb-8 text-[clamp(40px,4.6vw,72px)]" lines={titleLines(page.philosophyTitle)} />
          <Reveal>
            <p className="max-w-[520px] text-[15px] leading-[1.9] text-muted">{page.philosophyText}</p>
          </Reveal>
        </div>
        <ParallaxImage image={page.philosophyImage} sizes="(min-width:1024px) 50vw, 100vw" className="h-[clamp(380px,44vw,640px)]" />
      </section>

      {treatments.length > 0 && (
        <section className="bg-ink px-[clamp(20px,4vw,56px)] py-[clamp(96px,11vw,160px)] text-ivory">
          <div className="mx-auto max-w-[1100px]">
            <div className="eyebrow mb-5 text-bronze-light">{page.menuEyebrow}</div>
            <h2 className="display mb-14 text-[clamp(40px,4.6vw,72px)]">{titleInline(page.menuTitle)}</h2>
            <ul>
              {treatments.map((t, i) => (
                <Reveal
                  as="li"
                  key={`${t.name}-${i}`}
                  delay={i * 0.06}
                  className="group grid grid-cols-[1fr_auto] items-baseline gap-x-8 gap-y-2 border-t border-ivory/15 py-8 transition-[padding] duration-700 ease-[cubic-bezier(.19,1,.22,1)] last:border-b hover:pl-4 md:grid-cols-[1fr_2fr_auto]"
                >
                  <h3 className="font-serif text-[30px] transition-colors duration-500 group-hover:text-bronze-light">{t.name}</h3>
                  <p className="order-3 col-span-2 text-sm leading-[1.8] text-ivory/65 md:order-none md:col-span-1">{t.text}</p>
                  <span className="eyebrow text-bronze-light">{t.duration}</span>
                </Reveal>
              ))}
            </ul>
            <div className="mt-14">
              <ButtonLink href="/contact" variant="light">
                Book a treatment
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      <CtaBand cta={page.cta} />
    </>
  );
}
