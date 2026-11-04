"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireUser } from "./auth";
import { CONTENT_TAG } from "./db";
import { withFallback } from "@/content";
import { collections, emptyValue, fieldAt, fieldsFor, isCollection, isSingleton, type CollectionType, type Field } from "./fields";
import { rowLabel } from "./labels";
import { getIn, setIn } from "./paths";
import { docSchema, issuesByPath } from "./schema";
import { db, getRow, unpublishedRows, working, type ContentRow } from "./store";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string; issues?: Record<string, string> };

const fail = (error: string, issues?: Record<string, string>): ActionResult<never> => ({ ok: false, error, issues });

/** Publishing changes what visitors see: drop cached content immediately. */
function refreshSite() {
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/admin", "layout");
}

const itemMeta = (row: Pick<ContentRow, "type">) => (isCollection(row.type) ? { titleKey: collections[row.type].titleKey } : undefined);

// ─── Drafts ───────────────────────────────────────────────────────────

/** Save the whole working value of a document as its draft. */
export async function saveDraft(id: string, value: unknown): Promise<ActionResult<{ savedAt: string }>> {
  const staff = await requireUser();
  const row = await getRow(id);
  if (!row) return fail("This item no longer exists.");
  const fields = fieldsFor(row);
  if (!fields) return fail("Unknown content type.");

  const parsed = docSchema(fields, "draft").safeParse(value);
  if (!parsed.success) return fail("Some fields need attention.", issuesByPath(parsed.error));

  const { data, error } = await db()
    .from("content")
    .update({ draft: parsed.data, updated_by: staff.id })
    .eq("id", id)
    .select("updated_at")
    .single<{ updated_at: string }>();
  if (error) return fail("Couldn't save — please try again.");
  revalidatePath("/admin", "layout");
  return { ok: true, savedAt: data.updated_at };
}

/** Drop unpublished changes (an unpublished new item is deleted). */
export async function discard(id: string): Promise<ActionResult> {
  await requireUser();
  const row = await getRow(id);
  if (!row) return { ok: true };
  const q = row.published ? db().from("content").update({ draft: null }).eq("id", id) : db().from("content").delete().eq("id", id);
  const { error } = await q;
  if (error) return fail("Couldn't discard changes.");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ─── Publishing ───────────────────────────────────────────────────────

async function publishRow(row: Pick<ContentRow, "id" | "type" | "published" | "draft">, staffId: string): Promise<string | null> {
  if (row.draft === null && row.published !== null) return null; // nothing to publish
  const fields = fieldsFor(row);
  if (!fields) return `${row.id}: unknown content type`;
  const parsed = docSchema(fields, "publish", itemMeta(row)).safeParse(working(row));
  if (!parsed.success) {
    const [path, msg] = Object.entries(issuesByPath(parsed.error))[0] ?? ["", "invalid"];
    return `${label(row)}: ${msg}${path ? ` (${path})` : ""}`;
  }
  const { error } = await db().from("content").update({ published: parsed.data, draft: null, updated_by: staffId }).eq("id", row.id);
  return error ? `${label(row)}: couldn't publish` : null;
}

function label(row: Pick<ContentRow, "id" | "type" | "published" | "draft">) {
  if (!isCollection(row.type)) return row.id;
  const value = working(row) as Record<string, unknown>;
  const c = collections[row.type];
  return String(value[c.titleKey] || `New ${c.singular}`);
}

/** Publish one document. */
export async function publish(id: string): Promise<ActionResult> {
  const staff = await requireUser();
  const row = await getRow(id);
  if (!row) return fail("This item no longer exists.");
  const problem = await publishRow(row, staff.id);
  refreshSite();
  return problem ? fail(problem) : { ok: true };
}

/** Publish every unpublished change. Items that fail validation are skipped and reported. */
export async function publishAll(): Promise<ActionResult<{ published: number }>> {
  const staff = await requireUser();
  const rows = await unpublishedRows();
  const problems: string[] = [];
  let published = 0;
  for (const row of rows) {
    const problem = await publishRow(row, staff.id);
    if (problem) problems.push(problem);
    else published++;
  }
  refreshSite();
  return problems.length ? fail(`Published ${published}. Not published: ${problems.join("; ")}`) : { ok: true, published };
}

// ─── Collections ──────────────────────────────────────────────────────

/** New, unpublished item at the end of the list. Returns its id. */
export async function createItem(type: string): Promise<ActionResult<{ id: string }>> {
  const staff = await requireUser();
  if (!isCollection(type)) return fail("Unknown list.");
  const { data: last } = await db().from("content").select("sort").eq("type", type).order("sort", { ascending: false }).limit(1).maybeSingle<{ sort: number }>();
  const id = `${type}-${randomUUID().slice(0, 8)}`;
  const { error } = await db()
    .from("content")
    .insert({ id, type, sort: (last?.sort ?? 0) + 10, published: null, draft: emptyValue(collections[type as CollectionType].fields), updated_by: staff.id });
  if (error) return fail("Couldn't create the item.");
  revalidatePath("/admin", "layout");
  return { ok: true, id };
}

/** Delete an item. This takes effect on the site immediately. */
export async function deleteItem(id: string): Promise<ActionResult> {
  await requireUser();
  const row = await getRow(id);
  if (!row || !isCollection(row.type)) return fail("Only list items can be deleted.");
  const { error } = await db().from("content").delete().eq("id", id);
  if (error) return fail("Couldn't delete the item.");
  refreshSite();
  return { ok: true };
}

/** Save a new order for a list. This takes effect on the site immediately. */
export async function reorder(type: string, ids: string[]): Promise<ActionResult> {
  await requireUser();
  if (!isCollection(type) || ids.length > 200) return fail("Invalid order.");
  const results = await Promise.all(ids.map((id, i) => db().from("content").update({ sort: (i + 1) * 10 }).eq("id", id).eq("type", type)));
  if (results.some((r) => r.error)) return fail("Couldn't save the new order.");
  refreshSite();
  return { ok: true };
}

// ─── On-site edit mode ────────────────────────────────────────────────

/** The value an editor sees for a document, with built-in content filled in for pages. */
async function editable(id: string) {
  let row = await getRow(id);
  if (!row && isSingleton(id)) {
    await db().from("content").insert({ id, type: "singleton", published: null, draft: withFallback(id, {}) });
    row = await getRow(id);
  }
  if (!row) return null;
  const fields = fieldsFor(row);
  if (!fields) return null;
  const value = (row.type === "singleton" ? withFallback(id, working(row)) : working(row)) as Record<string, unknown>;
  return { row, fields, value };
}

export type FieldInfo = { field: Field; value: unknown; docLabel: string; adminHref: string };

/** Field config + current (draft) value for one marked element. */
export async function getField(id: string, path: string): Promise<ActionResult<FieldInfo>> {
  await requireUser();
  const doc = await editable(id);
  if (!doc) return fail("This content can't be edited here.");
  const field = fieldAt(doc.fields, path);
  if (!field) return fail("This content can't be edited here.");
  return { ok: true, field, value: getIn(doc.value, path) ?? null, docLabel: rowLabel(doc.row), adminHref: `/admin/edit/${id}` };
}

/** Save one field into the document's draft. */
export async function saveField(id: string, path: string, value: unknown): Promise<ActionResult> {
  const staff = await requireUser();
  const doc = await editable(id);
  if (!doc || !fieldAt(doc.fields, path)) return fail("This content can't be edited here.");
  const parsed = docSchema(doc.fields, "draft").safeParse(setIn(doc.value, path, value));
  if (!parsed.success) {
    const issues = issuesByPath(parsed.error);
    return fail(issues[path] ?? Object.values(issues)[0] ?? "Check this field.", issues);
  }
  const { error } = await db().from("content").update({ draft: parsed.data, updated_by: staff.id }).eq("id", id);
  if (error) return fail("Couldn't save — please try again.");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Drop every unpublished edit to published content (new, never-published items are kept). */
export async function discardAll(): Promise<ActionResult> {
  await requireUser();
  const { error } = await db().from("content").update({ draft: null }).not("draft", "is", null).not("published", "is", null);
  if (error) return fail("Couldn't discard changes.");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ─── Uploads ──────────────────────────────────────────────────────────

const UPLOAD_TYPES = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" } as const;

/** A one-time signed URL for uploading one processed photo to the media bucket. */
export async function getUploadUrl(contentType: string): Promise<ActionResult<{ path: string; token: string; publicUrl: string }>> {
  await requireUser();
  const ext = UPLOAD_TYPES[contentType as keyof typeof UPLOAD_TYPES];
  if (!ext) return fail("Only WebP, JPEG, PNG or AVIF photos can be uploaded.");
  const month = new Date().toISOString().slice(0, 7);
  const path = `uploads/${month}/${randomUUID()}.${ext}`;
  const bucket = db().storage.from("media");
  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error) return fail("Couldn't prepare the upload.");
  return { ok: true, path: data.path, token: data.token, publicUrl: bucket.getPublicUrl(data.path).data.publicUrl };
}
