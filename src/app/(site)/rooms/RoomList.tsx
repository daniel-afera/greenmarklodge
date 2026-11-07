"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Room } from "@/content/types";
import ParallaxImage from "@/components/ui/ParallaxImage";
import ButtonLink from "@/components/ui/ButtonLink";
import { EASE_LUXE } from "@/lib/motion";
import { cms } from "@/cms/mark";

const allFilters: { key: "all" | Room["category"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "villa", label: "Villas" },
  { key: "room", label: "Rooms" },
];

export default function RoomList({ rooms }: { rooms: Room[] }) {
  const [filter, setFilter] = useState<(typeof allFilters)[number]["key"]>("all");
  const shown = rooms.filter((r) => filter === "all" || r.category === filter);
  // Only offer categories that have rooms; no tabs at all when there's just one kind.
  const used = allFilters.filter((f) => f.key !== "all" && rooms.some((r) => r.category === f.key));
  const filters = used.length > 1 ? allFilters.filter((f) => f.key === "all" || used.includes(f)) : [];

  return (
    <>
      <div className="container-luxe flex flex-wrap items-center justify-between gap-6 pt-12">
        <div role="group" aria-label="Filter residences" className="flex flex-wrap gap-2.5">
          {filters.map((f) => {
            const active = f.key === filter;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.key)}
                className={`relative min-h-11 rounded-full border px-5 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors duration-500 ${
                  active ? "border-ink text-ivory" : "border-ink/25 text-ink hover:border-ink"
                }`}
              >
                {active && <motion.span layoutId="pill" className="absolute inset-0 -z-0 rounded-full bg-ink" transition={{ duration: 0.6, ease: EASE_LUXE }} />}
                <span className="relative">{f.label}</span>
              </button>
            );
          })}
        </div>
        <span className="text-[13px] text-muted">
          {shown.length} {shown.length === 1 ? "residence" : "residences"}
        </span>
      </div>

      <div className="container-luxe flex flex-col gap-[clamp(80px,9vw,140px)] pb-[clamp(96px,10vw,150px)] pt-12">
        <AnimatePresence mode="popLayout">
          {shown.map((r, i) => (
            <motion.article
              key={r.slug}
              layout
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30, transition: { duration: 0.35 } }}
              transition={{ duration: 1, ease: EASE_LUXE, delay: i * 0.06 }}
              className={`flex flex-wrap items-center gap-[clamp(32px,5vw,80px)] ${i % 2 ? "flex-row-reverse" : ""}`}
            >
              <Link href={`/rooms/${r.slug}`} data-cursor="View" className="relative block min-w-0 flex-[999_1_520px]">
                <ParallaxImage image={r.images[0]} cms={cms(r._id, "images")} sizes="(min-width:1024px) 58vw, 100vw" className="h-[clamp(360px,42vw,620px)]" amount={7} />
                <span className="eyebrow absolute left-5 top-5 bg-ivory/90 px-3.5 py-2 text-[10px]" {...cms(r._id, "tag")}>
                  {r.tag}
                </span>
              </Link>
              <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-7">
                <span className="font-serif text-lg text-bronze-deep">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="display text-[clamp(40px,4vw,64px)] leading-none" {...cms(r._id, "name")}>
                  {r.name}
                </h2>
                <p className="text-[15px] leading-[1.9] text-muted" {...cms(r._id, "description")}>
                  {r.description}
                </p>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-ink/10 py-6 text-[13px] text-muted">
                  {[
                    ["Bed", r.bed, "bed"],
                    ["View", r.view, "view"],
                    ["Size", r.size, "size"],
                    ["Guests", `Up to ${r.maxGuests} guests`, "maxGuests"],
                  ].map(([k, v, f]) => (
                    <div key={k}>
                      <dt className="eyebrow mb-1 text-[9px] text-bronze-deep">{k}</dt>
                      <dd {...cms(r._id, f)}>{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <div className="eyebrow text-[10px] text-muted">From</div>
                    <div className="font-serif text-[34px]" {...cms(r._id, "priceFrom")}>
                      {r.priceFrom} <span className="text-base text-muted">/ night</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <Link href={`/rooms/${r.slug}`} className="hlink eyebrow">
                      Details
                    </Link>
                    <ButtonLink href={`/book?room=${r.slug}`} variant="dark">
                      Reserve
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
