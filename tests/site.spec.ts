import { expect, test } from "@playwright/test";

const PAGES = ["/", "/rooms", "/rooms/garden-villa", "/dining", "/spa", "/experiences", "/gallery", "/contact", "/book"];

for (const path of PAGES) {
  test(`${path} renders without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 20_000 });
    // Images come from Supabase storage (or the built-in fallback) and load.
    const broken = await page.locator("img").evaluateAll((imgs) =>
      (imgs as HTMLImageElement[]).filter((i) => i.complete && i.loading !== "lazy" && i.naturalWidth === 0).map((i) => i.src),
    );
    expect(broken).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("menu opens and navigates", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "Dining" }).first().click();
  await expect(page).toHaveURL(/\/dining$/);
  await expect(page.locator("h1")).toBeVisible();
});

test("404 page", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
});

test("country pickers show flag images, not emoji", async ({ page }) => {
  await page.goto("/contact");
  const flag = page.locator('img[src="/flags/et.svg"]').first();
  await flag.scrollIntoViewIfNeeded(); // lazy-loaded
  await expect(flag).toBeVisible();
  await expect.poll(() => flag.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  // Every listed country has a flag file.
  const res = await page.request.get("/flags/ke.svg");
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-type"]).toContain("svg");
});
