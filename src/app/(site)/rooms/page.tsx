import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import Reveal from "@/components/ui/Reveal";
import CtaBand from "@/components/ui/CtaBand";
import { getRooms, getRoomsPage } from "@/content";
import { titleInline, titlePlain } from "@/lib/title";
import RoomList from "./RoomList";

export async function generateMetadata(): Promise<Metadata> {
  const p = await getRoomsPage();
  return { title: p.hero.eyebrow, description: p.hero.text ?? titlePlain(p.hero.title) };
}

export default async function RoomsPage() {
  const [page, rooms] = await Promise.all([getRoomsPage(), getRooms()]);
  return (
    <>
      <PageHero hero={page.hero} />
      <RoomList rooms={rooms} />
      {page.comforts.length > 0 && (
        <section className="bg-ink px-[clamp(20px,4vw,56px)] py-[clamp(80px,9vw,130px)] text-ivory">
          <div className="mx-auto max-w-[1440px]">
            <div className="eyebrow mb-5 text-bronze-light">{page.comfortsEyebrow}</div>
            <h2 className="display mb-16 text-[clamp(38px,4.4vw,68px)] leading-[1.05]">{titleInline(page.comfortsTitle)}</h2>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {page.comforts.map((c, i) => (
                <Reveal key={i} delay={i * 0.08} className="border-t border-ivory/20 pt-6">
                  <div className="mb-2.5 font-serif text-[26px]">{c.title}</div>
                  <p className="text-sm leading-[1.8] text-ivory/70">{c.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaBand cta={page.cta} />
    </>
  );
}
