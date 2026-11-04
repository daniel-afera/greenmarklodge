import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { AUTH_FILE, admin } from "./support";

/** Creates a throwaway owner account for the run (deleted in teardown). */
export default async function globalSetup() {
  const db = admin();
  const email = `e2e-${Date.now()}@example.com`;
  const password = randomBytes(18).toString("base64url");
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(`Couldn't create test user: ${error?.message}`);
  const { error: pErr } = await db.from("profiles").insert({ id: data.user.id, name: "E2E Test", role: "owner", must_change_password: false });
  if (pErr) throw new Error(`Couldn't create test profile: ${pErr.message}`);
  mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  writeFileSync(AUTH_FILE, JSON.stringify({ id: data.user.id, email, password }));
}
