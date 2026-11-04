import { adminClient } from "@/cms/supabase/admin";

/**
 * Daily ping (Vercel cron, see vercel.json) so the free Supabase project
 * doesn't pause after 7 days without activity. Vercel sends
 * `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const db = adminClient();
  if (!db) return Response.json({ ok: false, error: "Supabase not configured" }, { status: 503 });

  const { error } = await db.from("content").select("id", { head: true, count: "exact" }).limit(1);
  if (error) {
    console.error("[keepalive]", error.message);
    return Response.json({ ok: false }, { status: 502 });
  }
  return Response.json({ ok: true, at: new Date().toISOString() });
}
