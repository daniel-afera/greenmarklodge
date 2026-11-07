import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/home/Hero";
import Intro from "@/components/home/Intro";
import RoomsShowcase from "@/components/home/RoomsShowcase";
import Experiences from "@/components/home/Experiences";
import SplitCards from "@/components/home/SplitCards";
import Testimonials from "@/components/home/Testimonials";
import Marquee from "@/components/ui/Marquee";
import Counter from "@/components/ui/Counter";
import Reveal from "@/components/ui/Reveal";
import MaskText from "@/components/ui/MaskText";
import CtaBand from "@/components/ui/CtaBand";
import CmsImage from "@/components/ui/CmsImage";
import { titleLines } from "@/lib/title";
import { cms } from "@/cms/mark";
import { getExperiences, getGalleryPage, getHome, getRoomOptions, getRooms, getSettings, getTestimonials } from "@/content";
import { pageMeta } from "@/lib/seo";

function Star() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#B08D57" aria-hidden="true">
      <path d="M9 0 V18 M0 9 H18 M2.6 2.6 L15.4 15.4 M15.4 2.6 L2.6 15.4" />
    </svg>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const [home, s] = await Promise.all([getHome(), getSettings()]);
  return pageMeta(s, { path: "/", image: s.shareImage ?? home.hero.image });
}

export default async function Home() {
  const [home, rooms, roomOptions, experiences, testimonials, gallery] = await Promise.all([
    getHome(),
    getRooms(),
    getRoomOptions(),
    getExperiences(),
    getTestimonials(),
    getGalleryPage(),
  ]);

  return (
    <>
      <Hero hero={home.hero} rooms={roomOptions} />
      <Intro intro={home.intro} />

      <div className="border-y border-ink/10 py-7" aria-hidden="true" {...cms("homePage", "marquee")}>
        <Marquee duration={38}>
          {home.marquee.map((w, i) => (
            <span key={i} className="flex items-center gap-12 whitespace-nowrap pr-12 font-serif text-[clamp(36px,5vw,72px)] font-light italic">
              {w}
              <Star />
            </span>
          ))}
        </Marquee>
      </div>

      {rooms.length > 0 && <RoomsShowcase section={home.roomsSection} rooms={rooms} />}
      {experiences.length > 0 && <Experiences section={home.experiencesSection} items={experiences} />}

      {home.stats.length > 0 && (
        <section className={`container-luxe grid gap-12 py-[clamp(80px,9vw,130px)] text-center ${home.stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {home.stats.map((s, i) => {
            const n = Number(s.value.replace(/[^\d.]/g, ""));
            const numeric = /^[\d.,\s]+$/.test(s.value) && Number.isFinite(n);
            return (
              <Reveal key={i} delay={i * 0.1}>
                <div className="font-serif text-[clamp(64px,7vw,108px)] font-light leading-none" {...cms("homePage", `stats.${i}.value`)}>
                  {numeric ? <Counter to={n} /> : s.value}
                  {s.unit && <span className="ml-1.5 text-[0.4em]">{s.unit}</span>}
                </div>
                <div className="eyebrow mt-4 text-muted" {...cms("homePage", `stats.${i}.label`)}>
                  {s.label}
                </div>
              </Reveal>
            );
          })}
        </section>
      )}

      <SplitCards
        cards={[
          { key: "dining", card: home.dining },
          { key: "gardens", card: home.gardens },
        ]}
      />
      <Testimonials items={testimonials} />

      <section id="gallery" className="overflow-hidden pb-[clamp(64px,8vw,120px)] pt-[clamp(96px,11vw,160px)]">
        <div className="container-luxe mb-14 flex flex-wrap items-end justify-between gap-6">
          <MaskText className="display text-[clamp(42px,5.4vw,84px)] leading-none" lines={titleLines(home.gallerySection.title)} cms={cms("homePage", "gallerySection.title")} />
          <Reveal>
            <Link href="/gallery" className="hlink eyebrow text-ink" {...cms("homePage", "gallerySection.linkLabel")}>
              {home.gallerySection.linkLabel}
            </Link>
          </Reveal>
        </div>
        <Marquee duration={70}>
          {gallery.images.slice(0, 9).map((g, i) => (
            <Link
              key={`${g.src}-${i}`}
              href="/gallery"
              data-cursor="View"
              className="zoom-img relative mr-5 block h-[clamp(280px,30vw,420px)] shrink-0"
              style={{ width: `clamp(220px, ${i % 3 === 1 ? 38 : 24}vw, ${i % 3 === 1 ? 560 : 340}px)` }}
            >
              <CmsImage image={g} fill sizes="40vw" className="object-cover" cms={cms("galleryPage", "images")} />
            </Link>
          ))}
        </Marquee>
      </section>

      <CtaBand cta={home.cta} doc="homePage" />
    </>
  );
}
