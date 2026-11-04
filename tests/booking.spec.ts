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
  transfer: false,
  notes: "",
  company: "bot", // honeypot → no email
});

test.describe("booking API", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "API only; run once."));

  test("accepts a room that exists in the CMS", async ({ request }) => {
    const res = await request.post("/api/booking", { data: booking("garden-villa"), headers: { "x-forwarded-for": "10.0.0.1" } });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("rejects an unknown room", async ({ request }) => {
    const res = await request.post("/api/booking", { data: booking("no-such-room"), headers: { "x-forwarded-for": "10.0.0.2" } });
    expect(res.status()).toBe(422);
    expect((await res.json()).errors).toHaveProperty("room");
  });
});
