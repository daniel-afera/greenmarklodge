import "server-only";
import { createHash } from "node:crypto";
import { adminClient } from "@/cms/supabase/admin";

/**
 * Rate limit for the public form endpoint, stored in Supabase
 * (public.rate_limits, see supabase/migrations/*_rate_limit.sql) so it holds
 * across serverless instances. Falls back to an in-memory limit when Supabase
 * isn't configured or the call fails — weaker, but never blocks real guests
 * because of a database hiccup.
 */

type Rule = { key: string; windowSeconds: number; limit: number };

/** 6 sends per 10 minutes per visitor; 300 a day across the site (Gmail allows ~500). */
export const PER_IP = { windowSeconds: 10 * 60, limit: 6 };
export const SITE_DAILY = { windowSeconds: 24 * 60 * 60, limit: 300 };

const memory = new Map<string, { start: number; hits: number }>();

function memoryHit({ key, windowSeconds, limit }: Rule) {
  const now = Date.now();
  const row = memory.get(key);
  const fresh = !row || now - row.start >= windowSeconds * 1000;
  const next = fresh ? { start: now, hits: 1 } : { start: row.start, hits: row.hits + 1 };
  memory.set(key, next);
  return next.hits > limit;
}

async function hit(rule: Rule): Promise<boolean> {
  const db = adminClient();
  if (db) {
    const { data, error } = await db.rpc("rate_limit_hit", { p_key: rule.key, p_window_seconds: rule.windowSeconds, p_limit: rule.limit });
    if (!error) return data === true;
    console.error("[rate-limit]", error.message);
  }
  return memoryHit(rule);
}

/** The visitor's IP as seen by the host (Vercel sets x-forwarded-for / x-real-ip). */
export function clientIp(req: Request) {
  return req.headers.get("x-real-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

const hashIp = (ip: string) => createHash("sha256").update(`gml-rate:${ip}`).digest("hex").slice(0, 32);

/** True when this visitor has sent too many requests recently. Counts every request. */
export const visitorLimited = (req: Request) => hit({ key: `ip:${hashIp(clientIp(req))}`, ...PER_IP });

/**
 * True when the site has sent its daily share of emails. Call it only for
 * valid requests that will send mail, so junk submissions can't use it up.
 */
export const siteLimited = () => hit({ key: "all:day", ...SITE_DAILY });
