import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";
import ButtonLink from "./ButtonLink";
import { titleInline } from "@/lib/title";
import type { Cta } from "@/content/types";

export default function CtaBand({ cta }: { cta: Cta }) {
  return (
    <section className="relative flex min-h-[720px] items-center justify-center overflow-hidden text-center text-ivory">
      <ParallaxImage image={cta.image} alt="" reveal={false} amount={12} className="!absolute inset-0" />
      <div aria-hidden="true" className="absolute inset-0 bg-night/55" />
      <Reveal className="container-luxe relative max-w-[1000px] py-24">
        <div className="eyebrow mb-7 text-champagne">{cta.eyebrow}</div>
        <h2 className="display mb-12 text-[clamp(44px,6.4vw,104px)]">{titleInline(cta.title)}</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <ButtonLink href="/book" variant="gold" arrow>
            Request a booking
          </ButtonLink>
          <ButtonLink href="/contact" variant="light">
            Speak with us
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
