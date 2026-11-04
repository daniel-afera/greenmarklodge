import Link from "next/link";
import type { SiteSettings } from "@/content/types";
import { fullName, telHref, waHref } from "@/lib/site";
import NewsletterForm from "./NewsletterForm";

const cols = [
  { label: "Stay", links: [["Rooms & Suites", "/rooms"], ["Book a stay", "/book"], ["Gallery", "/gallery"]] },
  { label: "Discover", links: [["Dining", "/dining"], ["Spa & Wellness", "/spa"], ["Experiences", "/experiences"]] },
  { label: "Lodge", links: [["Contact", "/contact"], ["Weddings & events", "/contact"], ["Careers", "/contact"]] },
] as const;

export default function Footer({ settings: s }: { settings: SiteSettings }) {
  return (
    <footer className="bg-night text-ivory">
      <div className="container-luxe pb-10 pt-[clamp(80px,9vw,120px)]">
        <div className="grid gap-12 border-b border-ivory/10 pb-16 md:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-[520px] lg:col-span-2">
            <p className="mb-7 font-serif text-[clamp(30px,3vw,44px)] font-light leading-[1.15]">
              Letters from <em>the lake</em> — seasonal offers, quietly delivered.
            </p>
            <NewsletterForm />
          </div>
          <div>
            <div className="eyebrow mb-5 text-bronze-light">Visit</div>
            <address className="text-sm not-italic leading-8 text-ivory/70">
              {s.address.line1}
              <br />
              {s.address.line2}
              <br />
              {s.address.country}
            </address>
          </div>
          <div>
            <div className="eyebrow mb-5 text-bronze-light">Contact</div>
            <div className="flex flex-col text-sm leading-8 text-ivory/70">
              <a className="hover:text-bronze-light" href={telHref(s.phone)}>
                {s.phone}
              </a>
              <a className="hover:text-bronze-light" href={`mailto:${s.email}`}>
                {s.email}
              </a>
              {s.whatsapp && (
                <a className="hover:text-bronze-light" href={waHref(s.whatsapp)}>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-14 md:grid-cols-4">
          {cols.map((c) => (
            <nav key={c.label} aria-label={`Footer ${c.label}`} className="flex flex-col">
              <span className="eyebrow mb-4 text-ivory/40">{c.label}</span>
              {c.links.map(([label, href]) => (
                <Link key={label} href={href} className="text-sm leading-[2.2] text-ivory/70 transition-colors hover:text-bronze-light">
                  {label}
                </Link>
              ))}
            </nav>
          ))}
          {s.social.length > 0 && (
            <nav aria-label="Social" className="flex flex-col">
              <span className="eyebrow mb-4 text-ivory/40">Follow</span>
              {s.social.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="text-sm leading-[2.2] text-ivory/70 transition-colors hover:text-bronze-light">
                  {l.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        <div aria-hidden="true" className="select-none text-center font-serif text-[clamp(64px,17vw,260px)] font-light uppercase leading-[0.8] tracking-[0.08em] text-ivory/[0.06]">
          {s.name}
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-4 text-xs text-ivory/60">
          <span>
            © {new Date().getFullYear()} {fullName(s)}
          </span>
          <span>
            {s.address.line1} · {s.address.country}
          </span>
        </div>
      </div>
    </footer>
  );
}
