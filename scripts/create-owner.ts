/**
 * Creates the first owner account (or makes an existing account an owner).
 *
 *   npm run create-owner -- <email> [name]
 *
 * Prints a temporary password once; it must be changed at first sign-in.
 * Run it in your own terminal so the password isn't shared anywhere.
 */
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [email, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ") || "Owner";
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: npm run create-owner -- <email> [name]");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set (.env).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const password = Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join("")).join("-");

async function findUser(address: string) {
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === address.toLowerCase());
    if (user || data.users.length < 200) return user ?? null;
  }
}

async function main() {
  let user = await findUser(email);
  if (user) {
    const { error } = await db.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (error) throw error;
    console.log(`Existing account ${email}: password reset.`);
  } else {
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
    console.log(`Created account ${email}.`);
  }
  const { error } = await db.from("profiles").upsert({ id: user.id, name, role: "owner", must_change_password: true });
  if (error) throw error;

  console.log(`\nOwner: ${email}\nTemporary password: ${password}\n\nSign in at /admin/login — you'll be asked to choose a new password.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
