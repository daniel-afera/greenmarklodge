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

test("lists: delete has Undo, Recently deleted can restore or delete for good", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Run once.");
  const db = admin();
  let id = "";
  try {
    await signIn(page);
    await page.goto("/admin/list/testimonial");
    const active = page.locator("main ul").first().locator(":scope > li");
    const count = await active.count();
    await page.getByRole("button", { name: "Add review" }).click();
    await page.waitForURL(/\/admin\/edit\/testimonial-/);
    id = page.url().split("/").pop()!;
    await page.getByLabel("Guest name").fill("E2E Guest");
    await expect(page.getByRole("status").filter({ hasText: /^Saved/ })).toBeVisible();

    await page.goto("/admin/list/testimonial");
    await expect(active).toHaveCount(count + 1);
    await expect(active.last()).toContainText("Not published yet");

    // Delete: no confirmation, an Undo banner instead.
    await active.filter({ hasText: "E2E Guest" }).getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByRole("status").filter({ hasText: "Deleted “E2E Guest”" })).toBeVisible();
    await expect(active).toHaveCount(count);
    const recent = page.getByRole("region", { name: "Recently deleted" });
    await expect(recent).toContainText("E2E Guest");

    // Undo brings it back.
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(active).toHaveCount(count + 1);
    await expect(active.filter({ hasText: "E2E Guest" })).toHaveCount(1);
    expect((await db.from("content").select("deleted_at").eq("id", id).single()).data?.deleted_at).toBeNull();

    // Delete again, then restore from Recently deleted.
    await active.filter({ hasText: "E2E Guest" }).getByRole("button", { name: "Delete" }).click();
    await recent.getByRole("listitem").filter({ hasText: "E2E Guest" }).getByRole("button", { name: "Restore" }).click();
    await expect(active.filter({ hasText: "E2E Guest" })).toHaveCount(1);

    // Delete for good (owners only) asks first, then the row is gone.
    await active.filter({ hasText: "E2E Guest" }).getByRole("button", { name: "Delete" }).click();
    await recent.getByRole("listitem").filter({ hasText: "E2E Guest" }).getByRole("button", { name: "Delete for good" }).click();
    await page.getByRole("alertdialog", { name: /for good/ }).getByRole("button", { name: "Delete for good" }).click();
    await expect(page.getByText("E2E Guest")).toHaveCount(0);
    expect((await db.from("content").select("id").eq("id", id)).data).toHaveLength(0);
  } finally {
    if (id) await db.from("content").delete().eq("id", id);
  }
});

test("a deleted published item leaves the site and comes back when restored", async ({ page, request }, info) => {
  test.skip(info.project.name !== "desktop", "Run once.");
  const db = admin();
  const id = "testimonial-1";
  const { data: row } = await db.from("content").select("published").eq("id", id).single();
  const quote = String((row?.published as { text: string }).text).slice(0, 40);
  const homeHas = async () => (await (await request.get("/")).text()).includes(quote);
  try {
    expect(await homeHas()).toBe(true);
    await signIn(page);
    await page.goto("/admin/list/testimonial");
    const active = page.locator("main ul").first().locator(":scope > li");
    await active.first().getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect.poll(homeHas).toBe(false);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect.poll(homeHas).toBe(true);
  } finally {
    await db.from("content").update({ deleted_at: null }).eq("id", id);
    await request.post("/api/revalidate", { headers: { authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}` } });
  }
});

test("rooms can't share a web address", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Writes a draft; run once.");
  const db = admin();
  const id = "room-highland-room";
  const { data: before } = await db.from("content").select("draft").eq("id", id).single();
  try {
    await signIn(page);
    await page.goto(`/admin/edit/${id}`);
    await page.getByLabel("Web address").fill("garden-villa");
    await expect(page.getByRole("status").filter({ hasText: /^Saved.*fix the highlighted field/ })).toBeVisible();
    await expect(page.getByText("“Garden Villa” already uses this web address")).toBeVisible();

    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "already uses the web address" })).toBeVisible();
    const { data } = await db.from("content").select("published").eq("id", id).single();
    expect((data?.published as { slug: string }).slug).toBe("highland-room");

    // A unique address clears the warning.
    await page.getByLabel("Web address").fill("highland-room-2");
    await expect(page.getByRole("status").filter({ hasText: /^Saved \d/ })).toBeVisible();
    await expect(page.getByText("already uses this web address")).toHaveCount(0);
  } finally {
    await db.from("content").update({ draft: before?.draft ?? null }).eq("id", id);
  }
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

test("keep-alive: the cron route writes the heartbeat and the overview shows it", async ({ page, request }, info) => {
  test.skip(info.project.name !== "desktop", "Run once.");
  const db = admin();
  const { data: before } = await db.from("keepalive").select("pinged_at, source").eq("id", 1).single();
  try {
    const res = await request.get("/api/keepalive", process.env.CRON_SECRET ? { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } } : {});
    expect(res.status()).toBe(200);
    const { at } = await res.json();
    const { data } = await db.from("keepalive").select("pinged_at").eq("id", 1).single();
    expect(new Date(data!.pinged_at!).toISOString()).toBe(at);

    await signIn(page);
    await expect(page.getByTestId("keepalive")).toContainText("last ping less than an hour ago");

    // A stale heartbeat shows the warning.
    await db.from("keepalive").update({ pinged_at: new Date(Date.now() - 5 * 86_400_000).toISOString() }).eq("id", 1);
    await page.reload();
    await expect(page.getByTestId("keepalive")).toContainText("5 days ago");
    await expect(page.getByTestId("keepalive")).toContainText("may pause");
  } finally {
    await db.from("keepalive").update({ pinged_at: before?.pinged_at ?? null, source: before?.source ?? null }).eq("id", 1);
  }
});
