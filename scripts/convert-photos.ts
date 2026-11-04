/**
 * Converts the client's original photos (client-assets/photos, not in git)
 * into web-ready WebP: EXIF orientation applied, longest side ≤ 2400px,
 * quality 80, metadata (incl. GPS) stripped. iPhone HEIC/HEIF is decoded
 * with heic-convert (sharp's prebuilt libheif only reads AVIF).
 *
 *   npm run photos              → client-assets/converted/*.webp + contact sheets
 *   npm run photos -- --logo    → public/logo.webp, src/app/icon.png, src/app/apple-icon.png
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import convertHeic from "heic-convert";

const ROOT = path.join(process.cwd(), "client-assets");
const SRC = path.join(ROOT, "photos");
const OUT = path.join(ROOT, "converted");
const MAX_SIDE = 2400;

async function decode(file: string): Promise<Buffer> {
  const input = await readFile(file);
  if (!/\.hei[cf]$/i.test(file)) return input;
  return Buffer.from(await convertHeic({ buffer: input, format: "JPEG", quality: 0.95 }));
}

async function photos() {
  await mkdir(OUT, { recursive: true });
  const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png|webp|hei[cf])$/i.test(f)).sort();
  const thumbs: { name: string; buf: Buffer }[] = [];
  let total = 0;

  for (const name of files) {
    const base = sharp(await decode(path.join(SRC, name))).rotate();
    const { data, info } = await base
      .clone()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    const out = name.replace(/\.\w+$/, ".webp");
    await writeFile(path.join(OUT, out), data);
    total += data.length;
    thumbs.push({ name: out.replace(/\.webp$/, ""), buf: await sharp(data).resize(320, 240, { fit: "cover" }).jpeg({ quality: 70 }).toBuffer() });
    console.log(`  ${name} → ${out} (${info.width}×${info.height}, ${Math.round(data.length / 1024)} KB)`);
  }
  console.log(`${files.length} photos, ${(total / 1024 / 1024).toFixed(1)} MB total.`);

  // Contact sheets: 6×4 numbered thumbnails each.
  const COLS = 6, ROWS = 4, W = 320, H = 240, LABEL = 28;
  for (let s = 0; s * COLS * ROWS < thumbs.length; s++) {
    const page = thumbs.slice(s * COLS * ROWS, (s + 1) * COLS * ROWS);
    const composite = page.flatMap((t, i) => {
      const left = (i % COLS) * W, top = Math.floor(i / COLS) * (H + LABEL);
      const label = Buffer.from(`<svg width="${W}" height="${LABEL}"><rect width="100%" height="100%" fill="#111"/><text x="8" y="20" font-family="sans-serif" font-size="18" fill="#fff">${t.name}</text></svg>`);
      return [{ input: t.buf, left, top }, { input: label, left, top: top + H }];
    });
    await sharp({ create: { width: COLS * W, height: ROWS * (H + LABEL), channels: 3, background: "#111" } })
      .composite(composite)
      .jpeg({ quality: 75 })
      .toFile(path.join(OUT, `_sheet-${s + 1}.jpg`));
  }
}

async function logo() {
  const file = (await readdir(path.join(ROOT, "logo")))[0];
  const src = sharp(path.join(ROOT, "logo", file));
  const { width = 1080 } = await src.metadata();
  // The badge is a circle on black: cut the circle out (1px inset hides the dark edge).
  const r = width / 2 - 1;
  const mask = Buffer.from(`<svg width="${width}" height="${width}"><circle cx="${width / 2}" cy="${width / 2}" r="${r}" fill="#fff"/></svg>`);
  const round = await src.clone().ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();

  await sharp(round).resize(512).webp({ quality: 90 }).toFile("public/logo.webp");
  await sharp(round).resize(512).png().toFile("src/app/icon.png");
  // iOS fills transparency with black: put the badge on its own dark grey instead.
  await sharp(round).flatten({ background: "#383d39" }).resize(180).png().toFile("src/app/apple-icon.png");
  console.log("public/logo.webp, src/app/icon.png, src/app/apple-icon.png written.");
}

(process.argv.includes("--logo") ? logo() : photos()).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
