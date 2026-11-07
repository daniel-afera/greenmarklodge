/**
 * Server-side content getters. Every page reads its content through these.
 *
 * Content comes from the Supabase CMS (src/cms/db.ts): published content
 * for visitors, drafts in draft mode. Anything missing or empty is filled
 * from the built-in content (src/content/fallback.ts) field by field, so
 * the site never renders a blank section — and works with no CMS at all.
 */
import { cache } from "react";
import { draftMode } from "next/headers";
import { staffOrNull } from "@/cms/auth";
import { readDoc, readList } from "@/cms/db";
import * as F from "./fallback";
import type * as T from "./types";

/**
 * Edit mode = draft mode AND a signed-in staff member (a leftover draft
 * cookie alone never shows drafts). Draft mode is only readable inside a
 * request; at build time (generateStaticParams) it's off.
 */
export const isEditing = cache(async () => {
  try {
    if (!(await draftMode()).isEnabled) return false;
  } catch {
    return false;
  }
  return (await staffOrNull()) !== null;
});
const isDraft = isEditing;

/** Load a single page/settings document (null → built-in content). */
async function fetchDoc(id: string): Promise<unknown> {
  return readDoc(id, await isDraft());
}

/** Load a collection (rooms, experiences, …) in order (null → built-in content). */
async function fetchList(type: string): Promise<unknown[] | null> {
  return readList(type, await isDraft());
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
export function merge<T>(fallback: T, data: unknown): T {
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

/** Built-in content per singleton id (the editor starts from these). */
export const fallbackDocs: Record<string, unknown> = {
  siteSettings: F.fallbackSettings,
  homePage: F.fallbackHome,
  roomsPage: F.fallbackRoomsPage,
  diningPage: F.fallbackDiningPage,
  gardensPage: F.fallbackGardensPage,
  experiencesPage: F.fallbackExperiencesPage,
  galleryPage: F.fallbackGalleryPage,
  contactPage: F.fallbackContactPage,
};

/** A stored singleton value with built-in content filled into empty fields. */
export const withFallback = (id: string, value: unknown) => (fallbackDocs[id] ? merge(fallbackDocs[id], normalize(value)) : value);

async function list<T>(type: string, fallback: T[]): Promise<T[]> {
  const data = await fetchList(type);
  return data ? (normalize(data) as T[]) : fallback;
}

export const getSettings = cache(() => single<T.SiteSettings>("siteSettings", F.fallbackSettings));
export const getHome = cache(() => single<T.HomePage>("homePage", F.fallbackHome));
export const getRoomsPage = cache(() => single<T.RoomsPage>("roomsPage", F.fallbackRoomsPage));
export const getDiningPage = cache(() => single<T.DiningPage>("diningPage", F.fallbackDiningPage));
export const getGardensPage = cache(() => single<T.GardensPage>("gardensPage", F.fallbackGardensPage));
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
export const getTestimonials = cache(() => list<T.Testimonial>("testimonial", F.fallbackTestimonials));

/** Slim room list for the booking bar, wizard and API. */
export const getRoomOptions = cache(async (): Promise<T.RoomOption[]> =>
  (await getRooms()).map((r) => ({ slug: r.slug, name: r.name, maxGuests: r.maxGuests, bed: r.bed, view: r.view, priceFrom: r.priceFrom, image: r.images[0] })),
);

/** Route → preview image for the full-screen menu (each page's header photo). */
export const getMenuPreviews = cache(async (): Promise<T.MenuPreviews> => {
  const [home, rooms, dining, gardens, exp, gallery, contact] = await Promise.all([
    getHome(),
    getRooms(),
    getDiningPage(),
    getGardensPage(),
    getExperiencesPage(),
    getGalleryPage(),
    getContactPage(),
  ]);
  return {
    "/": home.intro.imageLarge,
    "/rooms": rooms[0]?.images[0] ?? home.hero.image,
    "/dining": dining.hero.image,
    "/gardens": gardens.hero.image,
    "/experiences": exp.hero.image,
    "/gallery": gallery.hero.image,
    "/contact": contact.hero.image,
  };
});
