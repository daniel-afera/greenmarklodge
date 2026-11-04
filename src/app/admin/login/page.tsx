import { redirect } from "next/navigation";
import { getStaff } from "@/cms/auth";
import { LoginForm } from "@/components/admin/AuthForms";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getStaff()) redirect("/admin");
  return <LoginForm />;
}
