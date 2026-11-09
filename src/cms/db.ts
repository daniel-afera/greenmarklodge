import "server-only";
import { unstable_cache } from "next/cache";
import { adminClient } from "./supabase/admin";

/** Cache tag for all published content; publishing calls revalidateTag(CONTENT_TAG, …). */
export const CONTENT_TAG = "content";

type Row = { id?: string; published: unknown; draft: unknown };

/** In draft mode editors see their unpublished edits; visitors only see published. */
const pick = (row: Row, draft: boolean) => (draft ? (row.draft ?? row.published) : row.published) ?? null;

async function queryDoc(id: string, draft: boolean): Promise<unknown> {
  const db = adminClient();
  if (!db) return null;
  const { data, error } = await db.from("content").select("published, draft").eq("id", id).is("deleted_at", null).maybeSingle<Row>();
  if (error) throw error;
  return data ? pick(data, draft) : null;
}

async function queryList(type: string, draft: boolean): Promise<unknown[] | null> {
  const db = adminClient();
  if (!db) return null;
  const { data, error } = await db
    .from("content")
    .select("id, published, draft")
    .eq("type", type)
    .is("deleted_at", null)
    .order("sort")
    .order("id")
    .returns<Row[]>();
  if (error) throw error;
  // Each item carries its row id as `_id` so the on-site editor can target it.
  const items = data.flatMap((r) => {
    const v = pick(r, draft);
    return v && typeof v === "object" ? [{ ...v, _id: r.id }] : [];
  });
  // No rows at all → use the built-in content.
  return items.length ? items : null;
}

const cachedDoc = unstable_cache((id: string) => queryDoc(id, false), ["cms-doc"], { tags: [CONTENT_TAG] });
const cachedList = unstable_cache((type: string) => queryList(type, false), ["cms-list"], { tags: [CONTENT_TAG] });

/** Any failure (no config, network, bad data) returns null so the fallback content is used. */
async function safe<T>(label: string, run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (err) {
    console.error(`[cms] ${label} failed — using built-in content`, err);
    return null;
  }
}

export function readDoc(id: string, draft: boolean) {
  return safe(`doc ${id}`, () => (draft ? queryDoc(id, true) : cachedDoc(id)));
}

/** `fresh` skips the data cache (the booking API re-checks a room it can't find). */
export function readList(type: string, draft: boolean, fresh = false) {
  return safe(`list ${type}`, () => (draft || fresh ? queryList(type, draft) : cachedList(type)));
}
