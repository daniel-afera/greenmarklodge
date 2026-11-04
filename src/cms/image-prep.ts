/**
 * Browser-side photo preparation before upload:
 * decode (keeping phone orientation) → resize to max 2400px → WebP 0.8
 * (JPEG 0.85 where the browser can't encode WebP, e.g. Safari) → 16px
 * blur preview. Re-encoding strips EXIF, including GPS location.
 * iPhone HEIC/HEIF is converted first with a lazily-loaded decoder.
 */

const MAX_SIDE = 2400;
const MAX_OUTPUT = 3 * 1024 * 1024;
const MAX_INPUT = 40 * 1024 * 1024;

export type PreparedImage = { file: Blob; type: string; width: number; height: number; blur: string };

export class ImagePrepError extends Error {}

const isHeic = (f: File) => /image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);

async function decode(file: File): Promise<ImageBitmap> {
  let blob: Blob = file;
  if (isHeic(file)) {
    try {
      const { default: heic2any } = await import("heic2any");
      const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
      blob = Array.isArray(out) ? out[0] : out;
    } catch {
      throw new ImagePrepError("Couldn't read this iPhone photo. Try exporting it as JPG.");
    }
  }
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    throw new ImagePrepError("This file couldn't be opened as a photo.");
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function draw(bitmap: ImageBitmap, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImagePrepError("Your browser couldn't process this photo.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

/** Size + blur preview of a photo already in storage (picked from the library). */
export async function describeStored(url: string): Promise<{ width: number; height: number; blur?: string }> {
  const img = new Image();
  img.crossOrigin = "anonymous"; // storage sends CORS headers; needed to read pixels for the blur
  img.src = url;
  await img.decode().catch(() => {
    throw new ImagePrepError("This photo couldn't be loaded.");
  });
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  try {
    const bs = 16 / Math.max(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * bs));
    canvas.height = Math.max(1, Math.round(height * bs));
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blur = canvas.toDataURL("image/webp", 0.5);
    return { width, height, ...(blur.startsWith("data:image/") ? { blur } : {}) };
  } catch {
    return { width, height }; // blur is optional
  }
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/") && !isHeic(file)) throw new ImagePrepError("Please choose a photo (JPG, PNG, WebP or HEIC).");
  if (file.size > MAX_INPUT) throw new ImagePrepError("This photo is too large (over 40 MB).");

  const bitmap = await decode(file);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = draw(bitmap, width, height);

    let out = await toBlob(canvas, "image/webp", 0.8);
    if (!out || out.type !== "image/webp") out = await toBlob(canvas, "image/jpeg", 0.85);
    if (!out) throw new ImagePrepError("Your browser couldn't process this photo.");
    if (out.size > MAX_OUTPUT) throw new ImagePrepError("This photo is still over 3 MB after resizing. Try a smaller one.");

    const bs = 16 / Math.max(width, height);
    const tiny = draw(bitmap, Math.max(1, Math.round(width * bs)), Math.max(1, Math.round(height * bs)));
    const tinyBlob = (await toBlob(tiny, "image/webp", 0.5)) ?? (await toBlob(tiny, "image/jpeg", 0.5));
    const blur = tinyBlob ? await blobToDataUrl(tinyBlob) : "";

    return { file: out, type: out.type, width, height, blur };
  } finally {
    bitmap.close();
  }
}
