import type { Metadata } from "next";
import type { Img, RoomOption, SiteSettings } from "@/content/types";
import { fullName } from "./site";

/** The public site address (set NEXT_PUBLIC_SITE_URL in production). */
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/** A share-sized (1200px) copy of a content photo, served by Next's image optimiser. */
export function shareImageUrl(img?: Img) {
  if (!img?.src) return undefined;
  return `/_next/image?url=${encodeURIComponent(img.src)}&w=1200&q=75`;
}

/**
 * Per-page metadata: title, description, canonical URL, and Open Graph /
 * Twitter cards with that page's own photo (the layout's are only defaults).
 */
export function pageMeta(
  site: SiteSettings,
  { title, description, path, image }: { title?: string; description?: string; path: string; image?: Img },
): Metadata {
  const name = fullName(site);
  const desc = description || site.description;
  const shareTitle = title ? `${title} · ${name}` : name;
  const img = shareImageUrl(image ?? site.shareImage);
  const images = img ? [{ url: img, width: 1200, alt: image?.alt || name }] : undefined;
  return {
    ...(title ? { title } : {}),
    description: desc,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: name, locale: "en_GB", url: path, title: shareTitle, description: desc, images },
    twitter: { card: images ? "summary_large_image" : "summary", title: shareTitle, description: desc, images: img ? [img] : undefined },
  };
}

/** Latitude/longitude from a Google Maps embed URL, when it contains them. */
function coordsFrom(mapEmbed: string): { latitude: number; longitude: number } | undefined {
  const m = mapEmbed.match(/[@=!](-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/) ?? mapEmbed.match(/!3d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
  if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };
  const pb = mapEmbed.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/); // embed "pb" format is lng, lat
  return pb ? { latitude: Number(pb[2]), longitude: Number(pb[1]) } : undefined;
}

/** Only real-looking values: content placeholders like "[RATE]" or "000 0000" are left out. */
const real = (v?: string) => !!v && !/\[|\]|0{3}\s?0{4}/.test(v);

/** schema.org Hotel data for search engines (rendered as JSON-LD in the site layout). */
export function hotelJsonLd(site: SiteSettings, rooms: RoomOption[]) {
  const url = siteUrl();
  const prices = rooms.map((r) => r.priceFrom).filter(real);
  const geo = coordsFrom(site.mapEmbed);
  const image = shareImageUrl(site.shareImage);
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "@id": `${url}/#hotel`,
    name: fullName(site),
    description: site.description,
    url,
    logo: `${url}/logo.svg`,
    ...(image ? { image: `${url}${image}` } : {}),
    ...(real(site.phone) ? { telephone: site.phone } : {}),
    ...(real(site.email) ? { email: site.email } : {}),
    address: { "@type": "PostalAddress", streetAddress: site.address.line1, addressLocality: site.address.line2, addressCountry: site.address.country },
    ...(geo ? { geo: { "@type": "GeoCoordinates", ...geo } } : {}),
    ...(prices.length ? { priceRange: prices.length > 1 ? `${prices[0]} – ${prices[prices.length - 1]}` : prices[0] } : {}),
    sameAs: site.social.map((s) => s.href).filter((h) => /^https:\/\/[^/]+\/.+/.test(h)),
    containsPlace: rooms.map((r) => ({
      "@type": "HotelRoom",
      name: r.name,
      url: `${url}/rooms/${r.slug}`,
      bed: r.bed,
      occupancy: { "@type": "QuantitativeValue", maxValue: r.maxGuests },
    })),
  };
}

/** Serialises JSON-LD for a <script> tag without letting "</script>" break out. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
