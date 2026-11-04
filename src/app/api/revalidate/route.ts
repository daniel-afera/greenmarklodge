import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/cms/db";

/**
 * Drops the cached published content so the site re-reads Supabase.
 * Publishing from the editor does this itself; scripts that write to the
 * database directly (npm run seed) call this afterwards.
 *
 * Auth: `Authorization: Bearer $SUPABASE_SECRET_KEY` — anyone holding that
 * key can already change the content, so it adds no new secret to manage.
 */
export async function POST(req: Request) {
  const key = process.env.SUPABASE_SECRET_KEY;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${key}`;
  if (!key || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
