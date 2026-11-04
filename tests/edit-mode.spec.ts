import { expect, test } from "@playwright/test";
import { admin, signIn } from "./support";

test("edit mode: click a heading, change it, see the draft; visitors don't", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop", "Writes a draft; run once.");
  const db = admin();
  const { data: before } = await db.from("content").select("draft").eq("id", "homePage").single();

  try {
    await signIn(page);
    await page.goto("/api/edit?to=/");
    await expect(page.getByText(/Edit mode · \d+ unpublished/)).toBeVisible();

    // No preloader in edit mode; the hero title is clickable.
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await page.waitForTimeout(1500); // let the title animation settle
    await h1.click();
    const dialog = page.getByRole("dialog", { name: /Edit Title/ });
    await expect(dialog).toBeVisible();

    const marker = `Draft ${Date.now()}`;
    await dialog.getByLabel("Title", { exact: true }).fill(marker);
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(dialog).toBeHidden();
    await expect(h1).toContainText(marker);

    // A visitor still sees the published title.
    const visitor = await browser.newContext();
    const vp = await visitor.newPage();
    await vp.goto("/");
    await expect(vp.locator("h1")).not.toContainText(marker);
    await visitor.close();

    // Exit edit mode → back to published content.
    await page.getByRole("link", { name: "Exit" }).click();
    await expect(page.getByText(/Edit mode · \d+ unpublished/)).toHaveCount(0);
    await expect(page.locator("h1")).not.toContainText(marker);
  } finally {
    await db.from("content").update({ draft: before?.draft ?? null }).eq("id", "homePage");
  }
});

test("a leftover draft cookie without a session shows no drafts", async ({ page, context }, info) => {
  test.skip(info.project.name !== "desktop", "Run once.");
  await signIn(page);
  await page.goto("/api/edit?to=/");
  await expect(page.getByText(/Edit mode · \d+ unpublished/)).toBeVisible();
  // Drop the login session but keep the draft-mode cookie.
  const cookies = await context.cookies();
  await context.clearCookies();
  await context.addCookies(cookies.filter((c) => c.name === "__prerender_bypass"));
  await page.goto("/");
  await expect(page.getByText(/Edit mode · \d+ unpublished/)).toHaveCount(0);
});
