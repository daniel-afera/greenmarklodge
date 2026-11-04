import "server-only";
import { adminClient } from "./supabase/admin";

/** Admin-side reads of the content table. Callers must have checked auth. */

export type ContentRow = {
  id: string;
  type: string;
  published: Record<string, unknown> | null;
  draft: Record<string, unknown> | null;
  sort: number;
  updated_at: string;
};

export function db() {
  const client = adminClient();
  if (!client) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY).");
  return client;
}

const COLUMNS = "id, type, published, draft, sort, updated_at";

export async function getRow(id: string) {
  const { data, error } = await db().from("content").select(COLUMNS).eq("id", id).maybeSingle<ContentRow>();
  if (error) throw error;
  return data;
}

export async function listRows(type: string) {
  const { data, error } = await db().from("content").select(COLUMNS).eq("type", type).order("sort").order("id").returns<ContentRow[]>();
  if (error) throw error;
  return data;
}

/** Rows with unpublished changes (drafts, or new items never published). */
export async function unpublishedRows() {
  const { data, error } = await db()
    .from("content")
    .select("id, type, published, draft")
    .or("draft.not.is.null,published.is.null")
    .returns<Pick<ContentRow, "id" | "type" | "published" | "draft">[]>();
  if (error) throw error;
  return data;
}

/** The value an editor works on: draft if any, else published. */
export const working = (row: Pick<ContentRow, "draft" | "published">) => row.draft ?? row.published ?? {};
