import type { MetadataRoute } from "next";
import { getSettings } from "@/content";
import { fullName } from "@/lib/site";

/** Web app manifest: name, colours and icons for "Add to home screen". */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings();
  return {
    name: fullName(s),
    short_name: s.name,
    description: s.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F5F0E8",
    theme_color: "#1C2420",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
