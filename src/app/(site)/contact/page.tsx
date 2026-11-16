import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import Reveal from "@/components/ui/Reveal";
import { getContactPage, getSettings } from "@/content";
import { pageMeta } from "@/lib/seo";
import { telHref } from "@/lib/site";
import { titleInline } from "@/lib/title";
import EnquiryForm from "./EnquiryForm";
import MapEmbed from "./MapEmbed";
import { cms } from "@/cms/mark";

export async function generateMetadata(): Promise<Metadata> {
  const [p, s] = await Promise.all([getContactPage(), getSettings()]);
  return pageMeta(s, { title: "Contact", description: "Get in touch with our reservations team.", path: "/contact", image: p.hero.image });
}

export default async function ContactPage() {
  const [page, s] = await Promise.all([getContactPage(), getSettings()]);
  return (
    <>
      <PageHero hero={page.hero} doc="contactPage" />

      <section className="container-luxe grid gap-[clamp(48px,7vw,120px)] py-[clamp(96px,11vw,160px)] lg:grid-cols-[1fr_1.3fr]">
        <Reveal className="flex flex-col gap-12">
          <div>
            <div className="eyebrow mb-4 text-bronze-deep">Reservations</div>
            <a href={telHref(s.phone)} className="hlink block font-serif text-[clamp(28px,2.6vw,38px)]" {...cms("siteSettings", "phone")}>
              {s.phone}
            </a>
            {s.phone2 && (
              <a href={telHref(s.phone2)} className="hlink mt-1 block font-serif text-[clamp(28px,2.6vw,38px)]" {...cms("siteSettings", "phone2")}>
                {s.phone2}
              </a>
            )}
            <a href={`mailto:${s.email}`} className="hlink mt-2 block font-serif text-[clamp(22px,2vw,30px)] text-muted" {...cms("siteSettings", "email")}>
              {s.email}
            </a>
          </div>
          <div>
            <div className="eyebrow mb-4 text-bronze-deep">Address</div>
            <address className="font-serif text-[clamp(22px,2vw,30px)] not-italic leading-snug" {...cms("siteSettings", "address")}>
              {s.address.line1}
              <br />
              {s.address.line2}, {s.address.country}
            </address>
            {s.directions && (
              <p className="mt-4 max-w-[380px] text-sm leading-[1.8] text-muted" {...cms("siteSettings", "directions")}>
                {s.directions}
              </p>
            )}
          </div>
          {s.mapEmbed && <MapEmbed src={s.mapEmbed} address={`${s.address.line1}, ${s.address.line2}, ${s.address.country}`} cms={cms("siteSettings", "mapEmbed")} />}
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="display mb-12 text-[clamp(40px,4.4vw,68px)]" {...cms("contactPage", "formTitle")}>
            {titleInline(page.formTitle)}
          </h2>
          <EnquiryForm />
        </Reveal>
      </section>
    </>
  );
}
