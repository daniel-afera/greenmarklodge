"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, type Role } from "./auth";
import { db } from "./store";
import { serverClient } from "./supabase/server";

export type FormState = { error?: string; ok?: string; tempPassword?: string; email?: string } | undefined;

const MIN_PASSWORD = 10;

/** Readable temporary password (no 0/O/1/l), shown once to the owner. */
function tempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const pick = () => chars[randomInt(chars.length)];
  return Array.from({ length: 3 }, () => Array.from({ length: 4 }, pick).join("")).join("-");
}

// ─── Sign in / out ────────────────────────────────────────────────────

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };
  const sb = await serverClient();
  if (!sb) return { error: "Sign-in isn't configured on this site yet.", email };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: error.status === 429 ? "Too many attempts — wait a minute and try again." : "That email and password don't match.", email };
  redirect("/admin");
}

export async function signOut() {
  const sb = await serverClient();
  await sb?.auth.signOut();
  redirect("/admin/login");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const staff = await requireUser(undefined, { allowTempPassword: true });
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `Use at least ${MIN_PASSWORD} characters.` };
  if (password !== confirm) return { error: "The two passwords don't match." };
  const sb = await serverClient();
  const { error } = (await sb?.auth.updateUser({ password })) ?? { error: new Error("not configured") };
  if (error) return { error: "Couldn't change the password. Try a different one." };
  await db().from("profiles").update({ must_change_password: false }).eq("id", staff.id);
  redirect("/admin");
}

// ─── Staff (owner only) ───────────────────────────────────────────────

const newStaff = z.object({
  email: z.email("Enter a valid email address."),
  name: z.string().trim().min(1, "Enter a name.").max(80),
  role: z.enum(["owner", "editor"]),
});

export async function addStaff(_: FormState, form: FormData): Promise<FormState> {
  await requireUser("owner");
  const parsed = newStaff.safeParse({ email: String(form.get("email") ?? "").trim().toLowerCase(), name: form.get("name"), role: form.get("role") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { email, name, role } = parsed.data;
  const password = tempPassword();
  const { data, error } = await db().auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return { error: error?.message.includes("already") ? "Someone with that email already has an account." : "Couldn't create the account." };
  const { error: pErr } = await db().from("profiles").insert({ id: data.user.id, name, role, must_change_password: true });
  if (pErr) {
    await db().auth.admin.deleteUser(data.user.id);
    return { error: "Couldn't create the account." };
  }
  revalidatePath("/admin/staff");
  return { ok: `${name} can now sign in.`, tempPassword: password, email };
}

export async function resetStaffPassword(id: string): Promise<FormState> {
  await requireUser("owner");
  const password = tempPassword();
  const { data, error } = await db().auth.admin.updateUserById(id, { password });
  if (error) return { error: "Couldn't reset the password." };
  await db().from("profiles").update({ must_change_password: true }).eq("id", id);
  revalidatePath("/admin/staff");
  return { ok: "Password reset.", tempPassword: password, email: data.user.email };
}

async function ownerCount() {
  const { count } = await db().from("profiles").select("id", { count: "exact", head: true }).eq("role", "owner");
  return count ?? 0;
}

export async function setRole(id: string, role: Role): Promise<FormState> {
  await requireUser("owner");
  if (role !== "owner" && role !== "editor") return { error: "Unknown role." };
  if (role === "editor") {
    const { data } = await db().from("profiles").select("role").eq("id", id).single<{ role: Role }>();
    if (data?.role === "owner" && (await ownerCount()) <= 1) return { error: "There must always be at least one owner." };
  }
  const { error } = await db().from("profiles").update({ role }).eq("id", id);
  if (error) return { error: "Couldn't change the role." };
  revalidatePath("/admin/staff");
  return { ok: "Role updated." };
}

export async function removeStaff(id: string): Promise<FormState> {
  const me = await requireUser("owner");
  if (id === me.id) return { error: "You can't remove your own account." };
  const { error } = await db().auth.admin.deleteUser(id); // profile is deleted by cascade
  if (error) return { error: "Couldn't remove the account." };
  revalidatePath("/admin/staff");
  return { ok: "Account removed." };
}
