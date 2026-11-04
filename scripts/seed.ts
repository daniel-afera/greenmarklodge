/**
 * Seeds Supabase with the built-in content (src/content/fallback.ts) as
 * published, and uploads public/images/* to the "media" bucket.
 *
 * Images are resized (max 2400px), converted to WebP and given a blur
 * preview, so every Img in the stored JSON has src (public URL), width,
 * height and blur.
 *
 *   npm run seed                 insert what's missing, keep existing rows
 *   npm run seed -- --overwrite  replace existing rows (drafts are cleared)
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import * as F from "../src/content/fallback";
import type { Img } from "../src/content/types";

const MAX_SIDE = 2400;
const overwrite = process.argv.includes("--overwrite");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set (.env).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

type Uploaded = Pick<Img, "src" | "width" | "height" | "blur">;

/** Upload one local image as WebP; returns its stored details. */
async function uploadImage(file: string): Promise<Uploaded> {
  const input = await readFile(file);
  const base = sharp(input).rotate(); // apply EXIF orientation, then strip metadata
  const { data, info } = await base
    .clone()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  const blur = await base.clone().resize(16, 16, { fit: "inside" }).webp({ quality: 50 }).toBuffer();

  const objectPath = `seed/${path.basename(file).replace(/\.\w+$/, "")}.webp`;
  const { error } = await db.storage.from("media").upload(objectPath, data, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
  if (error) throw new Error(`upload ${objectPath}: ${error.message}`);
  const src = db.storage.from("media").getPublicUrl(objectPath).data.publicUrl;
  console.log(`  ${path.basename(file)} → ${objectPath} (${info.width}×${info.height}, ${Math.round(data.length / 1024)} KB)`);
  return { src, width: info.width, height: info.height, blur: `data:image/webp;base64,${blur.toString("base64")}` };
}

/** Replace every local Img (src "/images/…") in a content value with its uploaded version. */
function swapImages<T>(value: T, images: Map<string, Uploaded>): T {
  if (Array.isArray(value)) return value.map((v) => swapImages(v, images)) as T;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.src === "string") {
      const up = images.get(obj.src);
      if (!up) throw new Error(`No uploaded image for ${obj.src}`);
      return { ...obj, ...up } as T;
    }
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, swapImages(v, images)])) as T;
  }
  return value;
}

async function main() {
  console.log("Uploading images…");
  const dir = path.join(process.cwd(), "public/images");
  const images = new Map<string, Uploaded>();
  for (const name of (await readdir(dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
    images.set(`/images/${name}`, await uploadImage(path.join(dir, name)));
  }

  const singletons: [string, unknown][] = [
    ["siteSettings", F.fallbackSettings],
    ["homePage", F.fallbackHome],
    ["roomsPage", F.fallbackRoomsPage],
    ["diningPage", F.fallbackDiningPage],
    ["spaPage", F.fallbackSpaPage],
    ["experiencesPage", F.fallbackExperiencesPage],
    ["galleryPage", F.fallbackGalleryPage],
    ["contactPage", F.fallbackContactPage],
  ];
  const collections: [string, unknown[], (item: never, i: number) => string][] = [
    ["room", F.fallbackRooms, (r: { slug: string }) => `room-${r.slug}`],
    ["experience", F.fallbackExperiences, (_: never, i) => `experience-${i + 1}`],
    ["venue", F.fallbackVenues, (_: never, i) => `venue-${i + 1}`],
    ["treatment", F.fallbackTreatments, (_: never, i) => `treatment-${i + 1}`],
    ["testimonial", F.fallbackTestimonials, (_: never, i) => `testimonial-${i + 1}`],
  ];

  const rows = [
    ...singletons.map(([id, doc]) => ({ id, type: "singleton", sort: 0, published: swapImages(doc, images), draft: null })),
    ...collections.flatMap(([type, items, idFor]) =>
      items.map((item, i) => ({ id: idFor(item as never, i), type, sort: (i + 1) * 10, published: swapImages(item, images), draft: null })),
    ),
  ];

  console.log(`Writing ${rows.length} content rows (${overwrite ? "overwrite" : "keep existing"})…`);
  const { data, error } = await db
    .from("content")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: !overwrite })
    .select("id");
  if (error) throw new Error(error.message);
  console.log(`  ${data.length} written, ${rows.length - data.length} already existed.`);
  await clearSiteCache();
  console.log("Done.");
}

/**
 * The site caches published content until something publishes. Writing to
 * the database directly doesn't, so ask the running site to drop its cache.
 * SITE_URL overrides the target (e.g. the live site after a deploy).
 */
async function clearSiteCache() {
  const site = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(new URL("/api/revalidate", site), { method: "POST", headers: { authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`Site cache cleared (${site}).`);
  } catch (err) {
    console.log(`Couldn't clear the site cache at ${site} (${err instanceof Error ? err.message : err}).`);
    console.log("  If the site is running, it may show old content until something is published — or restart it after deleting .next/cache.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
