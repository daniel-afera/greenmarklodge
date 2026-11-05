import { adminClient } from "@/cms/supabase/admin";

/**
 * Daily ping (Vercel cron, see vercel.json) so the free Supabase project
 * doesn't pause after 7 days without activity. It writes a heartbeat row
 * (a write is the surest form of activity); the admin overview shows it.
 * Vercel sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const db = adminClient();
  if (!db) return Response.json({ ok: false, error: "Supabase not configured" }, { status: 503 });

  const at = new Date().toISOString();
  const source = req.headers.get("user-agent")?.includes("vercel-cron") ? "vercel-cron" : "manual";
  const { error } = await db.from("keepalive").upsert({ id: 1, pinged_at: at, source });
  if (error) {
    console.error("[keepalive]", error.message);
    return Response.json({ ok: false }, { status: 502 });
  }
  return Response.json({ ok: true, at });
}
