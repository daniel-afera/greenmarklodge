import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import Reveal from "@/components/ui/Reveal";
import { getContactPage, getSettings } from "@/content";
import { telHref } from "@/lib/site";
import { titleInline } from "@/lib/title";
import EnquiryForm from "./EnquiryForm";
import { cms } from "@/cms/mark";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with our reservations team.",
};

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
          {s.mapEmbed && (
            <div className="h-[320px] overflow-hidden border border-ink/10 grayscale-[0.6] transition-[filter] duration-700 hover:grayscale-0">
              <iframe title="Map" src={s.mapEmbed} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          )}
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
