import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { safePath } from "@/cms/paths";

/** Leave edit mode and return to the same page as a visitor. */
export async function GET(req: Request) {
  (await draftMode()).disable();
  redirect(safePath(new URL(req.url).searchParams.get("to")));
}
