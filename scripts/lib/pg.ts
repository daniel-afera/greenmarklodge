/**
 * Direct Postgres connection for scripts (migrations), via Supabase's
 * session pooler — the direct db.<ref>.supabase.co host is IPv6-only.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_DB_PASSWORD,
 * optional SUPABASE_DB_HOST (pooler host, see Dashboard → Connect).
 */
import pg from "pg";

export function projectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return new URL(url).hostname.split(".")[0];
}

export async function connect() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) throw new Error("SUPABASE_DB_PASSWORD is not set");
  const client = new pg.Client({
    host: process.env.SUPABASE_DB_HOST ?? "aws-0-eu-west-1.pooler.supabase.com",
    port: 5432,
    user: `postgres.${projectRef()}`,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
  } catch (err) {
    // Never echo the password back.
    throw new Error(String((err as Error).message).replaceAll(password, "***"));
  }
  return client;
}
