import type { SiteSettings } from "@/content/types";

/** Site structure (not editable content). Text and contact details are content (src/content). */
export const nav = [
  { label: "The Lodge", href: "/" },
  { label: "Rooms & Villas", href: "/rooms" },
  { label: "Dining", href: "/dining" },
  { label: "The Gardens", href: "/gardens" },
  { label: "Experiences", href: "/experiences" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
] as const;

/** "Green Mark" → "Green Mark Lodge" (unless the name already says Lodge). */
export const fullName = (s: Pick<SiteSettings, "name">) => (/lodge/i.test(s.name) ? s.name : `${s.name} Lodge`);

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const waHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;
