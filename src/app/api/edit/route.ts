import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { staffOrNull } from "@/cms/auth";
import { safePath } from "@/cms/paths";

/** Turn on edit mode (draft mode) for a signed-in staff member, then go to `?to=`. */
export async function GET(req: Request) {
  const to = safePath(new URL(req.url).searchParams.get("to"));
  if (!(await staffOrNull())) {
    if (req.headers.get("accept")?.includes("text/html")) redirect(`/admin/login`);
    return Response.json({ ok: false, error: "Sign in first." }, { status: 401 });
  }
  (await draftMode()).enable();
  redirect(to);
}
