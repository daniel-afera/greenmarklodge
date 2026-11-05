import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

export const AUTH_FILE = path.join(__dirname, ".auth", "staff.json");
export type TestStaff = { id: string; email: string; password: string };

export const staff = (): TestStaff => JSON.parse(readFileSync(AUTH_FILE, "utf8"));

export function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase env missing — run with --env-file=.env");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function signIn(page: Page) {
  const s = staff();
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(s.email);
  await page.getByLabel("Password", { exact: true }).fill(s.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}
