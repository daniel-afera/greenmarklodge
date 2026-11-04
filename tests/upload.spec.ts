import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { admin, signIn } from "./support";

test("photo upload: shrunk to 2400px WebP in the browser, stored in the media bucket", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Run once.");
  const db = admin();
  const id = "experience-1";
  const { data: before } = await db.from("content").select("draft").eq("id", id).single();
  let uploaded: string | null = null;

  try {
    // A 3000×2000 JPEG, larger than the 2400px limit.
    const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#7a5a2e" } }).jpeg({ quality: 90 }).toBuffer();
    await signIn(page);
    await page.goto(`/admin/edit/${id}`);
    await page.locator('input[type="file"]').first().setInputFiles({ name: "big.jpg", mimeType: "image/jpeg", buffer: big });
    await expect(page.getByRole("status").filter({ hasText: /^Saved/ })).toBeVisible({ timeout: 30_000 });

    const { data } = await db.from("content").select("draft").eq("id", id).single();
    const img = (data?.draft as { image: { src: string; width: number; height: number; blur?: string } }).image;
    uploaded = img.src.split("/storage/v1/object/public/media/")[1] ?? null;
    expect(img.src).toContain("/storage/v1/object/public/media/uploads/");
    expect([img.width, img.height]).toEqual([2400, 1600]);
    expect(img.blur).toMatch(/^data:image\/(webp|jpeg);base64,/);

    const file = await fetch(img.src);
    expect(file.ok).toBe(true);
    expect(file.headers.get("content-type")).toMatch(/image\/(webp|jpeg)/);
  } finally {
    await db.from("content").update({ draft: before?.draft ?? null }).eq("id", id);
    if (uploaded) await db.storage.from("media").remove([uploaded]);
  }
});
