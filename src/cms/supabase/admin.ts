import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the secret key. It bypasses RLS, so
 * every caller must do its own auth check first (see src/cms/auth.ts).
 * Returns null when Supabase isn't configured, so the site falls back to
 * the built-in content.
 */
let client: SupabaseClient | null | undefined;

export function adminClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}
