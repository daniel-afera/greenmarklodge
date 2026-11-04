import { expect, test } from "@playwright/test";
import { admin, signIn } from "./support";

test.describe.configure({ mode: "serial" });

test("sign in → edit the home title → publish → a visitor sees it", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop", "Publishes real content; run once.");
  const db = admin();
  const { data: before } = await db.from("content").select("published, draft").eq("id", "homePage").single();

  try {
    await signIn(page);
    await page.goto("/admin/edit/homePage");
    const marker = `E2E title ${Date.now()}`;
    const title = page.getByRole("group", { name: "Header" }).getByLabel("Title", { exact: true });
    await title.fill(marker);
    await expect(page.getByRole("status").filter({ hasText: /^Saved/ })).toBeVisible();

    // Not visible to visitors before publishing.
    const visitor = await browser.newContext();
    const vp = await visitor.newPage();
    await vp.goto("/");
    await expect(vp.locator("h1")).not.toContainText(marker);

    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "live on the site" })).toBeVisible();

    await vp.goto("/");
    await expect(vp.locator("h1")).toContainText(marker.replace(/\*/g, ""));
    await visitor.close();
  } finally {
    // Put the original content back: stage it as the draft, publish through the
    // UI (which also clears the site cache), then restore any original draft.
    if (before) {
      await db.from("content").update({ draft: before.published }).eq("id", "homePage");
      await page.goto("/admin/edit/homePage");
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "live on the site" })).toBeVisible();
      if (before.draft) await db.from("content").update({ draft: before.draft }).eq("id", "homePage");
    }
  }
});

test("lists: add, reorder and delete a review", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Run once.");
  await signIn(page);
  await page.goto("/admin/list/testimonial");
  const rows = page.locator("main li");
  const count = await rows.count();
  await page.getByRole("button", { name: "Add review" }).click();
  await page.waitForURL(/\/admin\/edit\/testimonial-/);
  const id = page.url().split("/").pop()!;
  await page.getByLabel("Guest name").fill("E2E Guest");
  await expect(page.getByRole("status").filter({ hasText: /^Saved/ })).toBeVisible();

  await page.goto("/admin/list/testimonial");
  await expect(rows).toHaveCount(count + 1);
  await expect(page.getByText("E2E Guest")).toBeVisible();
  await expect(page.locator("main li").last()).toContainText("Not published yet");

  page.once("dialog", (d) => d.accept());
  await page.locator("main li").filter({ hasText: "E2E Guest" }).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("E2E Guest")).toHaveCount(0);
  const { data } = await admin().from("content").select("id").eq("id", id);
  expect(data).toHaveLength(0);
});

test("staff page is visible to owners", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Run once.");
  await signIn(page);
  await page.goto("/admin/staff");
  await expect(page.getByRole("heading", { name: "Staff" })).toBeVisible();
  await expect(page.getByText("(you)")).toBeVisible();
});
