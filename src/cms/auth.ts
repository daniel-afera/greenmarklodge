import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminClient } from "./supabase/admin";
import { serverClient } from "./supabase/server";

export type Role = "owner" | "editor";
export type Staff = { id: string; email: string; name: string; role: Role; mustChangePassword: boolean };

/** The signed-in staff member, or null. Verifies the session JWT, then loads the profile. */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const [sb, admin] = [await serverClient(), adminClient()];
  if (!sb || !admin) return null;
  const { data, error } = await sb.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("name, role, must_change_password")
    .eq("id", claims.sub)
    .maybeSingle<{ name: string; role: Role; must_change_password: boolean }>();
  if (!profile) return null; // signed in but not staff

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    name: profile.name,
    role: profile.role,
    mustChangePassword: profile.must_change_password,
  };
});

/**
 * Use at the top of every admin layout, page and server action.
 * Not signed in → /admin/login. Temporary password → /admin/password.
 * Wrong role → /admin.
 */
export async function requireUser(role?: Role, { allowTempPassword = false } = {}): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (staff.mustChangePassword && !allowTempPassword) redirect("/admin/password");
  if (role === "owner" && staff.role !== "owner") redirect("/admin");
  return staff;
}

/** For route handlers: the staff member or null (caller returns 401). */
export async function staffOrNull() {
  const staff = await getStaff();
  return staff && !staff.mustChangePassword ? staff : null;
}
