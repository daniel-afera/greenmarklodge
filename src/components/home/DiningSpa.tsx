import Link from "next/link";
import ParallaxImage from "@/components/ui/ParallaxImage";
import { titleInline } from "@/lib/title";
import type { SplitCard } from "@/content/types";

export default function DiningSpa({ cards }: { cards: SplitCard[] }) {
  return (
    <section className="grid gap-1 md:grid-cols-2">
      {cards.map((it) => (
        <Link key={it.href} href={it.href} data-cursor="Explore" className="group relative block h-[clamp(520px,62vw,860px)] overflow-hidden text-ivory">
          <ParallaxImage
            image={it.image}
            sizes="(min-width:768px) 50vw, 100vw"
            reveal={false}
            className="!absolute inset-0 transition-transform duration-[1.6s] ease-[cubic-bezier(.19,1,.22,1)] group-hover:scale-[1.04]"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-night/85" />
          <div className="absolute inset-x-0 bottom-0 p-[clamp(28px,4vw,56px)]">
            <div className="eyebrow mb-4 text-champagne">{it.eyebrow}</div>
            <h2 className="display text-[clamp(40px,4.4vw,68px)] leading-none">{titleInline(it.title)}</h2>
            <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-700 ease-[cubic-bezier(.19,1,.22,1)] group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-visible:grid-rows-[1fr] group-focus-visible:opacity-100">
              <p className="overflow-hidden">
                <span className="mt-5 block max-w-[440px] text-[15px] leading-[1.9] text-ivory/85">{it.text}</span>
              </p>
            </div>
            <span className="eyebrow mt-6 inline-block border-b border-current pb-1.5">{it.cta}</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
