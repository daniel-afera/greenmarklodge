import { expect, test } from "@playwright/test";

// Booking validation uses the rooms from the database (same getters as the pages).
// The honeypot field makes the API answer "ok" without sending any email.

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const booking = (room: string) => ({
  type: "booking",
  checkin: day(30),
  checkout: day(33),
  adults: 2,
  children: 0,
  room,
  name: "Test Guest",
  email: "guest@example.com",
  phone: "+251911234567",
  country: "ET",
  eta: "Not sure yet",
  notes: "",
  company: "bot", // honeypot → no email
});

test.describe("booking API", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "API only; run once."));

  test("accepts a room that exists in the CMS", async ({ request }) => {
    const res = await request.post("/api/booking", { data: booking("vip-villa"), headers: { "x-forwarded-for": "10.0.0.1" } });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("rejects an unknown room", async ({ request }) => {
    const res = await request.post("/api/booking", { data: booking("no-such-room"), headers: { "x-forwarded-for": "10.0.0.2" } });
    expect(res.status()).toBe(422);
    expect((await res.json()).errors).toHaveProperty("room");
  });
});

// Uses local dates, like the booking bar (lib/dates.ts).
const localDay = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test.describe("hero booking bar", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "Residence picker is desktop-only."));

  test("defaults to tomorrow, three nights, Standard Villa — and the request goes through", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^reserve/i }).last().click();
    await page.waitForURL(/\/book\?/);
    const q = new URL(page.url()).searchParams;
    expect(q.get("checkin")).toBe(localDay(1));
    expect(q.get("checkout")).toBe(localDay(4));
    expect(q.get("room")).toBe("standard-villa");

    // Walk the wizard; the honeypot is added in flight so no email is sent.
    await page.route("**/api/booking", (route) => route.continue({ postData: JSON.stringify({ ...JSON.parse(route.request().postData() ?? "{}"), company: "bot" }) }));
    for (let i = 0; i < 2; i++) await page.getByRole("button", { name: /continue/i }).click();
    await page.locator("#bk-name").fill("Test Guest");
    await page.locator("#bk-email").fill("guest@example.com");
    await page.locator("#bk-phone").fill("911234567");
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /send request/i }).click();
    await expect(page.getByText(/AB-[A-Z0-9]{6}/)).toBeVisible();
  });
});
