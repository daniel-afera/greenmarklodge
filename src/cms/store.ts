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
  deleted_at?: string | null;
};

export function db() {
  const client = adminClient();
  if (!client) throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY).");
  return client;
}

const COLUMNS = "id, type, published, draft, sort, updated_at";

/** A live (not deleted) row. */
export async function getRow(id: string) {
  const { data, error } = await db().from("content").select(COLUMNS).eq("id", id).is("deleted_at", null).maybeSingle<ContentRow>();
  if (error) throw error;
  return data;
}

export async function listRows(type: string) {
  const { data, error } = await db().from("content").select(COLUMNS).eq("type", type).is("deleted_at", null).order("sort").order("id").returns<ContentRow[]>();
  if (error) throw error;
  return data;
}

/** Deleted items are kept this long so they can be restored. */
export const KEEP_DELETED_DAYS = 30;

/** Recently deleted items of a list, newest first (older ones are purged first). */
export async function listDeleted(type: string) {
  await purgeDeleted();
  const { data, error } = await db()
    .from("content")
    .select(`${COLUMNS}, deleted_at`)
    .eq("type", type)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .returns<ContentRow[]>();
  if (error) throw error;
  return data;
}

/** Permanently remove items deleted more than KEEP_DELETED_DAYS ago. */
export async function purgeDeleted() {
  const cutoff = new Date(Date.now() - KEEP_DELETED_DAYS * 86_400_000).toISOString();
  const { error } = await db().from("content").delete().lt("deleted_at", cutoff);
  if (error) console.error("[purgeDeleted]", error.message);
}

/** Rows with unpublished changes (drafts, or new items never published). */
export async function unpublishedRows() {
  const { data, error } = await db()
    .from("content")
    .select("id, type, published, draft")
    .is("deleted_at", null)
    .or("draft.not.is.null,published.is.null")
    .returns<Pick<ContentRow, "id" | "type" | "published" | "draft">[]>();
  if (error) throw error;
  return data;
}

/** The value an editor works on: draft if any, else published. */
export const working = (row: Pick<ContentRow, "draft" | "published">) => row.draft ?? row.published ?? {};
