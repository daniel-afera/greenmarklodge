/**
 * Server-side content getters. Every page reads its content through these.
 *
 * Today the content is built in (src/content/fallback.ts). When the custom
 * CMS is connected, `fetchDoc` / `fetchList` will read from the database;
 * anything missing or empty is filled from the built-in content field by
 * field, so the site never renders a blank section.
 */
import { cache } from "react";
import * as F from "./fallback";
import type * as T from "./types";

/** Load a single page/settings document. Returns null until a CMS is connected. */
async function fetchDoc(_id: string): Promise<unknown> {
  void _id;
  return null;
}

/** Load a collection (rooms, experiences, …). Returns null until a CMS is connected. */
async function fetchList(_type: string): Promise<unknown[] | null> {
  void _type;
  return null;
}

/** Drop null / empty-string values so the fallback fills them. */
function normalize(v: unknown): unknown {
  if (v === null || v === undefined) return undefined;
  if (Array.isArray(v)) return v.map(normalize).filter((x) => x !== undefined);
  if (typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) out[k] = normalize(val);
    return out;
  }
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Deep-merge `data` over `fallback`: missing / empty values use the fallback. Images are replaced whole. */
function merge<T>(fallback: T, data: unknown): T {
  if (data === undefined) return fallback;
  if (Array.isArray(fallback)) return (Array.isArray(data) && data.length ? data : fallback) as T;
  if (isPlainObject(fallback) && !("src" in fallback)) {
    if (!isPlainObject(data)) return fallback;
    const out: Record<string, unknown> = { ...fallback };
    for (const key of Object.keys(fallback)) out[key] = merge((fallback as Record<string, unknown>)[key], data[key]);
    return out as T;
  }
  return data as T;
}

async function single<T>(id: string, fallback: T): Promise<T> {
  return merge(fallback, normalize(await fetchDoc(id)));
}

async function list<T>(type: string, fallback: T[]): Promise<T[]> {
  const data = await fetchList(type);
  return data ? (normalize(data) as T[]) : fallback;
}

export const getSettings = cache(() => single<T.SiteSettings>("siteSettings", F.fallbackSettings));
export const getHome = cache(() => single<T.HomePage>("homePage", F.fallbackHome));
export const getRoomsPage = cache(() => single<T.RoomsPage>("roomsPage", F.fallbackRoomsPage));
export const getDiningPage = cache(() => single<T.DiningPage>("diningPage", F.fallbackDiningPage));
export const getSpaPage = cache(() => single<T.SpaPage>("spaPage", F.fallbackSpaPage));
export const getExperiencesPage = cache(() => single<T.ExperiencesPage>("experiencesPage", F.fallbackExperiencesPage));
export const getGalleryPage = cache(() => single<T.GalleryPage>("galleryPage", F.fallbackGalleryPage));
export const getContactPage = cache(() => single<T.ContactPage>("contactPage", F.fallbackContactPage));

export const getRooms = cache(async () => {
  const rooms = await list<T.Room>("room", F.fallbackRooms);
  return rooms.filter((r) => r.images?.length && r.maxGuests > 0);
});
export const getRoom = async (slug: string) => (await getRooms()).find((r) => r.slug === slug);
export const getExperiences = cache(() => list<T.Experience>("experience", F.fallbackExperiences));
export const getVenues = cache(() => list<T.Venue>("venue", F.fallbackVenues));
export const getTreatments = cache(() => list<T.Treatment>("treatment", F.fallbackTreatments));
export const getTestimonials = cache(() => list<T.Testimonial>("testimonial", F.fallbackTestimonials));

/** Slim room list for the booking bar, wizard and API. */
export const getRoomOptions = cache(async (): Promise<T.RoomOption[]> =>
  (await getRooms()).map((r) => ({ slug: r.slug, name: r.name, maxGuests: r.maxGuests, bed: r.bed, view: r.view, priceFrom: r.priceFrom, image: r.images[0] })),
);

/** Route → preview image for the full-screen menu (each page's header photo). */
export const getMenuPreviews = cache(async (): Promise<T.MenuPreviews> => {
  const [home, rooms, dining, spa, exp, gallery, contact] = await Promise.all([
    getHome(),
    getRooms(),
    getDiningPage(),
    getSpaPage(),
    getExperiencesPage(),
    getGalleryPage(),
    getContactPage(),
  ]);
  return {
    "/": home.intro.imageLarge,
    "/rooms": rooms[0]?.images[0] ?? home.hero.image,
    "/dining": dining.hero.image,
    "/spa": spa.hero.image,
    "/experiences": exp.hero.image,
    "/gallery": gallery.hero.image,
    "/contact": contact.hero.image,
  };
});
