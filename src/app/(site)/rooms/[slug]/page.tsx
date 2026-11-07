import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoom, getRooms, getSettings } from "@/content";
import { pageMeta } from "@/lib/seo";
import PageHero from "@/components/ui/PageHero";
import ParallaxImage from "@/components/ui/ParallaxImage";
import Reveal from "@/components/ui/Reveal";
import ButtonLink from "@/components/ui/ButtonLink";
import MaskText from "@/components/ui/MaskText";
import CmsImage from "@/components/ui/CmsImage";
import { titleLines } from "@/lib/title";
import { cms } from "@/cms/mark";

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getRooms()).map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/rooms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [room, s] = await Promise.all([getRoom(slug), getSettings()]);
  return room ? pageMeta(s, { title: room.name, description: room.short || room.description, path: `/rooms/${room.slug}`, image: room.images[0] }) : {};
}

export default async function RoomPage({ params }: PageProps<"/rooms/[slug]">) {
  const { slug } = await params;
  const [room, rooms] = await Promise.all([getRoom(slug), getRooms()]);
  if (!room) notFound();
  const others = rooms.filter((r) => r.slug !== room.slug).slice(0, 3);
  const extra = room.images.slice(1, 3);

  return (
    <>
      <PageHero hero={{ image: room.images[0], eyebrow: `${room.tag} · ${room.view}`, title: room.name }} tall />

      <section className="container-luxe grid gap-16 py-[clamp(80px,10vw,150px)] lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Reveal>
            <p className="font-serif text-[clamp(28px,3vw,44px)] font-light leading-[1.3]" {...cms(room._id, "description")}>
              {room.description}
            </p>
          </Reveal>
          {room.amenities.length > 0 && (
            <Reveal delay={0.1}>
              <h2 className="eyebrow mb-6 mt-16 text-bronze-deep">Layout & features</h2>
              <ul className="grid gap-x-10 sm:grid-cols-2" {...cms(room._id, "amenities")}>
                {room.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-4 border-b border-ink/10 py-4 text-[15px]">
                    <span className="h-1.5 w-1.5 rotate-45 bg-bronze" aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Reveal className="border border-ink/15 bg-sand/60 p-[clamp(28px,3vw,44px)]">
            <div className="eyebrow mb-1 text-[10px] text-muted">From</div>
            <div className="mb-8 font-serif text-[44px] leading-none" {...cms(room._id, "priceFrom")}>
              {room.priceFrom} <span className="text-base text-muted">/ night</span>
            </div>
            <dl className="mb-10 grid grid-cols-2 gap-5 text-sm">
              {[
                ["Bed", room.bed, "bed"],
                ["View", room.view, "view"],
                ["Size", room.size, "size"],
                ["Guests", `Up to ${room.maxGuests}`, "maxGuests"],
              ].map(([k, v, f]) => (
                <div key={k}>
                  <dt className="eyebrow mb-1 text-[9px] text-bronze-deep">{k}</dt>
                  <dd {...cms(room._id, f)}>{v}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href={`/book?room=${room.slug}`} variant="ink" arrow magnetic={false} className="w-full">
              Request this residence
            </ButtonLink>
            <p className="mt-4 text-center text-xs text-muted">No payment online — reception confirms within 24 hours.</p>
          </Reveal>
        </aside>
      </section>

      {extra.length > 0 && (
        <section className="container-luxe grid grid-cols-12 gap-6 pb-[clamp(80px,10vw,150px)]">
          <ParallaxImage image={extra[0]} cms={cms(room._id, "images")} sizes="60vw" className={`col-span-12 h-[clamp(320px,40vw,600px)] ${extra[1] ? "md:col-span-7" : ""}`} />
          {extra[1] && <ParallaxImage image={extra[1]} cms={cms(room._id, "images")} sizes="40vw" className="col-span-12 h-[clamp(320px,40vw,600px)] md:col-span-5 md:mt-24" />}
        </section>
      )}

      {others.length > 0 && (
        <section className="bg-sand py-[clamp(80px,10vw,140px)]">
          <div className="container-luxe">
            <MaskText className="display mb-14 text-[clamp(38px,4.4vw,68px)]" lines={titleLines("Other *residences*")} />
            <div className="grid gap-8 md:grid-cols-3">
              {others.map((r, i) => (
                <Reveal key={r.slug} delay={i * 0.08}>
                  <Link href={`/rooms/${r.slug}`} data-cursor="View" className="group block">
                    <div className="zoom-img relative h-[380px]">
                      <CmsImage image={r.images[0]} fill sizes="33vw" className="object-cover" />
                    </div>
                    <h3 className="mt-5 font-serif text-[28px]">{r.name}</h3>
                    <p className="mt-1 text-[13px] text-muted">{r.short}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
