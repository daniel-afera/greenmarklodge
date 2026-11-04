import { requireUser, type Role } from "@/cms/auth";
import { db } from "@/cms/store";
import StaffManager, { type StaffRow } from "@/components/admin/StaffManager";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const me = await requireUser("owner");
  const [{ data: profiles }, { data: users }] = await Promise.all([
    db().from("profiles").select("id, name, role, must_change_password, created_at").order("created_at").returns<{ id: string; name: string; role: Role; must_change_password: boolean }[]>(),
    db().auth.admin.listUsers({ perPage: 200 }),
  ]);
  const byId = new Map((users?.users ?? []).map((u) => [u.id, u]));
  const rows: StaffRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    email: byId.get(p.id)?.email ?? "",
    lastSignIn: byId.get(p.id)?.last_sign_in_at ?? null,
    pending: p.must_change_password,
    isMe: p.id === me.id,
  }));
  return (
    <div className="max-w-3xl">
      <h1 className="display mb-4 text-5xl">Staff</h1>
      <p className="mb-10 text-sm leading-relaxed text-muted">
        <strong>Owners</strong> can do everything, including managing staff. <strong>Editors</strong> can edit and publish content.
      </p>
      <StaffManager rows={rows} />
    </div>
  );
}
