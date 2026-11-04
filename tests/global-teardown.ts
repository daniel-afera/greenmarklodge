import { existsSync, rmSync } from "node:fs";
import { AUTH_FILE, admin, staff } from "./support";

export default async function globalTeardown() {
  if (!existsSync(AUTH_FILE)) return;
  const { id } = staff();
  await admin().auth.admin.deleteUser(id); // profile is removed by cascade
  rmSync(AUTH_FILE);
}
