import { collections, isCollection, isSingleton, singletons } from "./fields";
import type { ContentRow } from "./store";

/** Human label for a content row ("Home", "Garden Villa", "New review"). */
export function rowLabel(row: Pick<ContentRow, "id" | "type" | "draft" | "published">) {
  if (isSingleton(row.id)) return singletons[row.id].label;
  if (!isCollection(row.type)) return row.id;
  const c = collections[row.type];
  const v = (row.draft ?? row.published ?? {}) as Record<string, unknown>;
  const t = String(v[c.titleKey] ?? "").trim();
  return t ? (t.length > 60 ? `${t.slice(0, 57)}…` : t) : `New ${c.singular}`;
}

/** Public page where a row's content appears (for Preview / edit-on-site). */
export function rowHref(row: Pick<ContentRow, "id" | "type" | "draft" | "published">) {
  const map: Record<string, string> = {
    siteSettings: "/",
    homePage: "/",
    roomsPage: "/rooms",
    diningPage: "/dining",
    spaPage: "/spa",
    experiencesPage: "/experiences",
    galleryPage: "/gallery",
    contactPage: "/contact",
  };
  if (map[row.id]) return map[row.id];
  if (row.type === "room") {
    const slug = ((row.draft ?? row.published ?? {}) as { slug?: string }).slug;
    return slug ? `/rooms/${slug}` : "/rooms";
  }
  return { experience: "/experiences", venue: "/dining", treatment: "/spa", testimonial: "/" }[row.type] ?? "/";
}
