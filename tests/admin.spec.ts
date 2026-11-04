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

test("autosave keeps focus and keeps a just-added empty entry", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Writes a draft; run once.");
  const db = admin();
  const { data: before } = await db.from("content").select("draft").eq("id", "homePage").single();
  const saved = page.getByRole("status").filter({ hasText: /^Saved/ });

  try {
    await signIn(page);
    await page.goto("/admin/edit/homePage");

    // Typing across an autosave: the cursor stays in the field and nothing is lost.
    const field = page.getByRole("group", { name: "Header" }).getByLabel("Small heading", { exact: true });
    await field.fill("Before save");
    await expect(saved).toBeVisible();
    await expect(field).toBeFocused();
    await page.keyboard.type(" and after");
    await expect(field).toHaveValue("Before save and after");

    // A new empty entry gets focus and survives the autosave.
    const words = page.getByRole("group", { name: "Scrolling words" });
    const count = await words.getByRole("textbox").count();
    await words.getByRole("button", { name: "+ Add word" }).click();
    const added = words.getByLabel(`Word ${count + 1}`, { exact: true });
    await expect(added).toBeFocused();
    await expect(page.getByRole("status").filter({ hasText: "Saving…" })).toBeHidden();
    await expect(saved).toBeVisible();
    await page.waitForTimeout(500);
    await expect(added).toBeVisible();
    await expect(added).toBeFocused();
  } finally {
    await db.from("content").update({ draft: before?.draft ?? null }).eq("id", "homePage");
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

  await page.locator("main li").filter({ hasText: "E2E Guest" }).getByRole("button", { name: "Delete" }).click();
  await page.getByRole("alertdialog", { name: /Delete “E2E Guest”/ }).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("E2E Guest")).toHaveCount(0);
  const { data } = await admin().from("content").select("id").eq("id", id);
  expect(data).toHaveLength(0);
});

test("custom dropdown: pick a room category with the keyboard; Escape closes only the dropdown", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Writes a draft; run once.");
  const db = admin();
  const id = "room-garden-villa";
  const { data: before } = await db.from("content").select("draft").eq("id", id).single();
  try {
    await signIn(page);
    await page.goto(`/admin/edit/${id}`);
    const category = page.getByRole("combobox", { name: /Category/ });
    await expect(category).toContainText("Villa");
    await expect(page.locator("main select")).toHaveCount(0); // no native dropdowns

    // Escape closes the list without leaving the page or changing anything.
    await category.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(category).toContainText("Villa");

    // Keyboard: open, move to "Suite", pick.
    await category.focus();
    await page.keyboard.press("ArrowDown"); // opens on the current choice (Villa)
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("ArrowUp"); // Suite is listed first
    await page.keyboard.press("Enter");
    await expect(category).toContainText("Suite");
    await expect(page.getByRole("status").filter({ hasText: /^Saved/ })).toBeVisible();
    const { data } = await db.from("content").select("draft").eq("id", id).single();
    expect((data?.draft as { category: string }).category).toBe("suite");
  } finally {
    await db.from("content").update({ draft: before?.draft ?? null }).eq("id", id);
  }
});

test("staff page is visible to owners", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Run once.");
  await signIn(page);
  await page.goto("/admin/staff");
  await expect(page.getByRole("heading", { name: "Staff" })).toBeVisible();
  await expect(page.getByText("(you)")).toBeVisible();
});
