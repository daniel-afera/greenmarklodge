import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import ParallaxImage from "@/components/ui/ParallaxImage";
import Reveal from "@/components/ui/Reveal";
import CtaBand from "@/components/ui/CtaBand";
import { getExperiences, getExperiencesPage } from "@/content";
import { titlePlain } from "@/lib/title";
import { cms } from "@/cms/mark";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getExperiencesPage();
  return { title: p.hero.eyebrow, description: p.hero.text ?? titlePlain(p.hero.title) };
}

export default async function ExperiencesPage() {
  const [page, experiences] = await Promise.all([getExperiencesPage(), getExperiences()]);
  return (
    <>
      <PageHero hero={page.hero} doc="experiencesPage" />

      <section className="container-luxe flex flex-col gap-[clamp(96px,11vw,170px)] py-[clamp(96px,11vw,170px)]">
        {experiences.map((e, i) => (
          <article key={`${e.title}-${i}`} className="grid grid-cols-12 items-center gap-6">
            <ParallaxImage
              image={e.image}
              cms={cms(e._id, "image")}
              sizes="(min-width:768px) 60vw, 100vw"
              className={`col-span-12 h-[clamp(340px,44vw,660px)] md:col-span-7 ${i % 2 ? "md:order-2 md:col-start-6" : ""}`}
            />
            <Reveal className={`col-span-12 md:col-span-4 ${i % 2 ? "md:order-1 md:col-start-1" : "md:col-start-9"}`}>
              <span className="mb-6 block font-serif text-[clamp(80px,9vw,140px)] font-light leading-none text-bronze/40">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="display mb-6 text-[clamp(38px,3.8vw,60px)] leading-[1.02]">
                <span {...cms(e._id, "title")}>{e.title}</span> <em {...cms(e._id, "italic")}>{e.italic}</em>
              </h2>
              <p className="text-[15px] leading-[1.9] text-muted" {...cms(e._id, "text")}>
                {e.text}
              </p>
            </Reveal>
          </article>
        ))}
      </section>

      <CtaBand cta={page.cta} doc="experiencesPage" />
    </>
  );
}
