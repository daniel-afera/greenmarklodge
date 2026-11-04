import { requireUser } from "@/cms/auth";
import { PasswordForm } from "@/components/admin/AuthForms";

export const metadata = { title: "New password" };

export default async function PasswordPage() {
  const staff = await requireUser(undefined, { allowTempPassword: true });
  return <PasswordForm forced={staff.mustChangePassword} />;
}
