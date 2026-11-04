import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import { admin, signIn, staff } from "./support";

test.describe.configure({ mode: "serial" });
test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "Writes to storage; run once."));

/** Put an unused test photo straight into storage; returns its path and public URL. */
async function seedPhoto(colour: string) {
  const db = admin();
  const path = `uploads/e2e/${Date.now()}-${colour.slice(1)}.webp`;
  const body = await sharp({ create: { width: 640, height: 480, channels: 3, background: colour } }).webp().toBuffer();
  const { error } = await db.storage.from("media").upload(path, body, { contentType: "image/webp" });
  if (error) throw error;
  return { path, url: db.storage.from("media").getPublicUrl(path).data.publicUrl };
}

const tile = (page: Page, path: string) => page.locator("li").filter({ has: page.locator(`a[href$="${path}"]`) });
const exists = async (path: string) => {
  const [dir, name] = [path.slice(0, path.lastIndexOf("/")), path.slice(path.lastIndexOf("/") + 1)];
  const { data } = await admin().storage.from("media").list(dir, { search: name });
  return (data ?? []).some((f) => f.name === name);
};

test("photos page: storage meter, unused filter, owner deletes an unused photo", async ({ page }) => {
  const photo = await seedPhoto("#3a7a3a");
  try {
    await signIn(page);
    await page.getByRole("link", { name: "Photos" }).click();
    await expect(page.getByRole("heading", { name: "Photos" })).toBeVisible();
    await expect(page.getByText(/of 1\.00 GB used/)).toBeVisible();

    await page.getByRole("tab", { name: /Not used/ }).click();
    const t = tile(page, photo.path);
    await expect(t).toContainText("Not used");

    await t.getByRole("button", { name: "Delete" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Delete this photo?" });
    await expect(confirm).toBeVisible();
    // Escape cancels; nothing is deleted.
    await page.keyboard.press("Escape");
    await expect(confirm).toBeHidden();
    expect(await exists(photo.path)).toBe(true);
    await t.getByRole("button", { name: "Delete" }).click();
    await confirm.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Deleted 1 photo" })).toBeVisible();

    await expect(tile(page, photo.path)).toHaveCount(0);
    expect(await exists(photo.path)).toBe(false);
  } finally {
    await admin().storage.from("media").remove([photo.path]);
  }
});

test("choose from library: the photo goes into the draft and becomes protected", async ({ page }) => {
  const db = admin();
  const id = "experience-1";
  const { data: before } = await db.from("content").select("draft").eq("id", id).single();
  const photo = await seedPhoto("#7a3a3a");
  try {
    await signIn(page);
    await page.goto(`/admin/edit/${id}`);
    await page.getByRole("button", { name: "Choose from library" }).first().click();
    const picker = page.getByRole("dialog", { name: "Choose from library" });
    await expect(picker).toBeVisible();
    // Photos without a description are labelled by file name.
    await picker.getByRole("button", { name: photo.path.split("/").pop(), exact: true }).click();
    await expect(picker).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: /^Saved/ })).toBeVisible();

    const { data } = await db.from("content").select("draft").eq("id", id).single();
    const img = (data?.draft as { image: { src: string; width: number; height: number; blur?: string } }).image;
    expect(img.src).toBe(photo.url);
    expect([img.width, img.height]).toEqual([640, 480]);
    expect(img.blur).toMatch(/^data:image\//);

    // Now in use (by a draft): no delete button, and it says where.
    await page.goto("/admin/media");
    const t = tile(page, photo.path);
    await expect(t).toContainText("In use");
    await expect(t).toContainText("unpublished");
    await expect(t.getByRole("button", { name: "Delete" })).toHaveCount(0);
  } finally {
    await db.from("content").update({ draft: before?.draft ?? null }).eq("id", id);
    await db.storage.from("media").remove([photo.path]);
  }
});

test("editors can see photos but not delete them", async ({ page }) => {
  const db = admin();
  const photo = await seedPhoto("#3a3a7a");
  await db.from("profiles").update({ role: "editor" }).eq("id", staff().id);
  try {
    await signIn(page);
    await page.goto("/admin/media");
    await expect(tile(page, photo.path)).toContainText("Not used");
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Delete all unused/ })).toHaveCount(0);
  } finally {
    await db.from("profiles").update({ role: "owner" }).eq("id", staff().id);
    await db.storage.from("media").remove([photo.path]);
  }
});
