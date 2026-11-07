import type { MetadataRoute } from "next";
import { getRooms } from "@/content";
import { nav } from "@/lib/site";
import { siteUrl } from "@/lib/seo";

/** Re-generated hourly, so newly published rooms show up without a deploy. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = siteUrl();
  const rooms = await getRooms();
  const pages = [...nav.map((n) => n.href), "/book"];
  return [
    ...pages.map((path) => ({
      url: `${url}${path === "/" ? "" : path}`,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : path === "/rooms" || path === "/book" ? 0.9 : 0.7,
    })),
    ...rooms.map((r) => ({ url: `${url}/rooms/${r.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
