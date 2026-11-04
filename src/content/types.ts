/**
 * Normalised content shapes used by every component. Both the CMS
 * queries and the built-in fallback content resolve to these types.
 */

export type Img = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** CSS object-position from the editor's focal point, e.g. "40% 60%". */
  position?: string;
  /** Tiny blurred preview (data URL). */
  blur?: string;
};

/** Raw title text: "/" starts a new line, *text* is italic. */
export type Title = string;

export type Hero = { image: Img; eyebrow: string; title: Title; text?: string };
export type Cta = { image: Img; eyebrow: string; title: Title };

export type SiteSettings = {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: { line1: string; line2: string; country: string };
  mapEmbed: string;
  directions: string;
  social: { label: string; href: string }[];
  shareImage?: Img;
};

/** Collection items read from the CMS carry their row id (for on-site editing). */
type Item = { _id?: string };

export type Room = Item & {
  slug: string;
  name: string;
  category: "suite" | "villa" | "room";
  tag: string;
  view: string;
  bed: string;
  maxGuests: number;
  size: string;
  priceFrom: string;
  short: string;
  description: string;
  images: Img[];
  amenities: string[];
};

/** The subset the booking form + API need. */
export type RoomOption = Pick<Room, "slug" | "name" | "maxGuests" | "bed" | "view" | "priceFrom"> & { image: Img };

export type Experience = Item & { title: string; italic: string; text: string; image: Img; cta: string };
export type Venue = Item & { name: string; kind: string; hours: string; text: string; image: Img };
export type Treatment = Item & { name: string; duration: string; text: string };
export type Testimonial = Item & { text: string; who: string };
export type Feature = { title: string; text: string };
export type Stat = { value: string; unit: string; label: string };
export type SplitCard = { href: string; image: Img; eyebrow: string; title: Title; text: string; cta: string };

export type HomePage = {
  hero: Hero;
  intro: { label: string; statement: string; imageLarge: Img; imageSmall: Img; body: string; linkLabel: string };
  marquee: string[];
  roomsSection: { eyebrow: string; title: Title };
  experiencesSection: { eyebrow: string; title: Title; text: string };
  stats: Stat[];
  dining: SplitCard;
  spa: SplitCard;
  gallerySection: { title: Title; linkLabel: string };
  cta: Cta;
};

export type RoomsPage = { hero: Hero; comfortsEyebrow: string; comfortsTitle: Title; comforts: Feature[]; cta: Cta };
export type DiningPage = { hero: Hero; statement: string; cta: Cta };
export type SpaPage = {
  hero: Hero;
  philosophyEyebrow: string;
  philosophyTitle: Title;
  philosophyText: string;
  philosophyImage: Img;
  menuEyebrow: string;
  menuTitle: Title;
  cta: Cta;
};
export type ExperiencesPage = { hero: Hero; cta: Cta };
export type GalleryPage = { hero: Hero; images: Img[] };
export type ContactPage = { hero: Hero; formTitle: Title };

/** Route → preview image for the full-screen menu. */
export type MenuPreviews = Record<string, Img>;
