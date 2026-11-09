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
  category: "villa" | "room";
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

/** `images` are extra photos shown as tiles under the main one (Experiences page). */
export type Experience = Item & { title: string; italic: string; text: string; image: Img; images?: Img[]; cta?: string };
export type Venue = Item & { name: string; kind: string; hours: string; text: string; image: Img };
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
  gardens: SplitCard;
  gallerySection: { title: Title; linkLabel: string };
  cta: Cta;
};

export type RoomsPage = { hero: Hero; comfortsEyebrow: string; comfortsTitle: Title; comforts: Feature[]; cta: Cta };
export type DiningPage = { hero: Hero; statement: string; cta: Cta };
/** Photo card with a short title and text (Gardens page). */
export type PhotoCard = { image: Img; title: Title; text: string };
export type GardensPage = {
  hero: Hero;
  intro: { eyebrow: string; statement: string; image: Img; highlights: string[] };
  moments: PhotoCard;
  surroundings: PhotoCard;
  cta: Cta;
};
/** `slides` join hero.image in the header slideshow. */
/** A celebration the lodge hosts (Events page); `local` is the Amharic name. */
export type EventCard = { image: Img; title: Title; local: string; text: string };
export type EventsPage = {
  hero: Hero;
  intro: { eyebrow: string; statement: string };
  celebrations: { eyebrow: string; title: Title; items: EventCard[] };
  meetings: { eyebrow: string; title: Title; text: string; image: Img; highlights: string[]; linkLabel: string };
  cta: Cta;
};
export type ExperiencesPage = { hero: Hero; slides: Img[]; cta: Cta };
export type GalleryPage = { hero: Hero; images: Img[] };
export type ContactPage = { hero: Hero; formTitle: Title };

/** Route → preview image for the full-screen menu. */
export type MenuPreviews = Record<string, Img>;
