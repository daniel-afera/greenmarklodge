import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.describe("logged out", () => {
  test("admin pages redirect to sign-in", async ({ page }) => {
    for (const p of ["/admin", "/admin/pages", "/admin/edit/homePage", "/admin/list/room", "/admin/staff"]) {
      await page.goto(p);
      await expect(page).toHaveURL(/\/admin\/login$/);
    }
  });

  test("/api/edit returns 401 and does not enable draft mode", async ({ request }) => {
    const res = await request.get("/api/edit?to=/", { headers: { accept: "application/json" }, maxRedirects: 0 });
    expect(res.status()).toBe(401);
    expect(res.headers()["set-cookie"] ?? "").not.toContain("__prerender_bypass");
  });

  test("every server action checks the session first", async () => {
    // Server actions are public endpoints. Each exported action must call
    // requireUser(…) before anything else (sign-in/out are the exceptions).
    const PUBLIC = new Set(["signIn", "signOut"]);
    for (const file of ["src/cms/actions.ts", "src/cms/staff-actions.ts"]) {
      const src = readFileSync(path.join(process.cwd(), file), "utf8");
      const actions = [...src.matchAll(/export async function (\w+)\([^)]*\)[^{]*\{\s*\n\s*([^\n]+)/g)];
      expect(actions.length).toBeGreaterThan(0);
      for (const [, name, firstLine] of actions) {
        if (PUBLIC.has(name)) continue;
        expect(firstLine, `${file}: ${name}() must start with requireUser`).toMatch(/await requireUser\(/);
      }
    }
  });

  test("publishable key cannot read or write content", async ({ request }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const read = await request.get(`${url}/rest/v1/content?select=id`, { headers: { apikey: key } });
    expect(read.ok()).toBe(false);
    const write = await request.post(`${url}/rest/v1/content`, { headers: { apikey: key, "content-type": "application/json" }, data: { id: "x", type: "room" } });
    expect(write.ok()).toBe(false);
    const upload = await request.post(`${url}/storage/v1/object/media/e2e.webp`, {
      headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "image/webp" },
      data: Buffer.from("x"),
    });
    expect(upload.ok()).toBe(false);
  });

  test("open redirects are blocked", async ({ request }) => {
    const res = await request.get("/api/edit/exit?to=//evil.example", { maxRedirects: 0 });
    expect(res.headers()["location"]).toMatch(/^\/$|^http:\/\/localhost:\d+\/$/);
  });
});
