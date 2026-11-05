import "server-only";
import { fieldsFor, type Field } from "./fields";
import { rowLabel } from "./labels";
import { db, type ContentRow } from "./store";

/**
 * The photo library: every file in the "media" bucket, and where each one
 * is used. A file counts as used if any published version OR any draft
 * points to it — a replaced-but-unpublished photo is still live on the site.
 */

export const BUCKET = "media";
/** Supabase free plan: 1 GB of file storage. Override if the plan changes. */
export const STORAGE_LIMIT = Number(process.env.MEDIA_STORAGE_LIMIT_BYTES) || 1024 ** 3;
const FOLDERS = ["uploads", "seed"];

export type Usage = { rowId: string; page: string; href: string; field: string; state: "live" | "draft" | "live + draft" };

export type MediaFile = {
  path: string;
  url: string;
  size: number;
  createdAt: string;
  /** Known from content that uses it (else measured in the browser when picked). */
  width?: number;
  height?: number;
  blur?: string;
  alt?: string;
  usage: Usage[];
};

const PUBLIC_MARK = `/storage/v1/object/public/${BUCKET}/`;
export const pathFromUrl = (src: string) => (src.includes(PUBLIC_MARK) ? decodeURIComponent(src.split(PUBLIC_MARK)[1].split("?")[0]) : null);

type StorageItem = { name: string; id: string | null; created_at?: string; metadata?: { size?: number } | null };

/** Every file under the library folders (one level of month subfolders in uploads/). */
async function listFiles(): Promise<{ path: string; size: number; createdAt: string }[]> {
  const bucket = db().storage.from(BUCKET);
  const out: { path: string; size: number; createdAt: string }[] = [];
  const walk = async (prefix: string, depth: number) => {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await bucket.list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      for (const item of data as StorageItem[]) {
        const path = `${prefix}/${item.name}`;
        if (item.id === null) {
          if (depth < 2) await walk(path, depth + 1); // a folder
        } else if (item.name !== ".emptyFolderPlaceholder") {
          out.push({ path, size: item.metadata?.size ?? 0, createdAt: item.created_at ?? "" });
        }
      }
      if (data.length < 1000) break;
    }
  };
  for (const f of FOLDERS) await walk(f, 0);
  return out;
}

/** "hero.image" → "Header → Photo"; "images.3" → "Photos (4)"; "stats.0.label" → "Numbers → Number 1 → Label". */
function fieldLabel(fields: Field[], path: string[]): string {
  const parts: string[] = [];
  let list: Field[] | null = fields;
  for (let i = 0; i < path.length && list; i++) {
    const f: Field | undefined = list.find((x) => x.key === path[i]);
    if (!f) break;
    if (f.kind === "group") {
      parts.push(f.label);
      list = f.fields;
    } else if (f.kind === "list") {
      parts.push(f.label);
      const n = Number(path[i + 1]);
      if (Number.isInteger(n)) parts.push(`${f.itemLabel} ${n + 1}`);
      i++;
      list = f.fields;
    } else if (f.kind === "images") {
      const n = Number(path[i + 1]);
      parts.push(Number.isInteger(n) ? `${f.label} (${n + 1})` : f.label);
      break;
    } else {
      parts.push(f.label);
      break;
    }
  }
  return parts.join(" → ") || path.join(".");
}

type Found = { path: string; field: string; img: { width?: number; height?: number; blur?: string; alt?: string } };

/** Every image (by storage path) inside one content value. */
function imagesIn(value: unknown, fields: Field[]): Found[] {
  const found: Found[] = [];
  const walk = (v: unknown, at: string[]) => {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, [...at, String(i)]));
    if (!v || typeof v !== "object") return;
    const o = v as Record<string, unknown>;
    if (typeof o.src === "string") {
      const p = pathFromUrl(o.src);
      if (p) found.push({ path: p, field: fieldLabel(fields, at), img: o as Found["img"] });
      return;
    }
    for (const [k, x] of Object.entries(o)) walk(x, [...at, k]);
  };
  walk(value, []);
  return found;
}

/** Storage path → where it's used, plus image details seen in content. */
export async function usageByPath() {
  // Deleted items count too: their photos stay protected while they can be restored.
  const { data, error } = await db()
    .from("content")
    .select("id, type, published, draft, deleted_at")
    .returns<Pick<ContentRow, "id" | "type" | "published" | "draft" | "deleted_at">[]>();
  if (error) throw error;
  const usage = new Map<string, Usage[]>();
  const details = new Map<string, Found["img"]>();
  for (const row of data) {
    const fields = fieldsFor(row) ?? [];
    const page = row.deleted_at ? `${rowLabel(row)} (deleted)` : rowLabel(row);
    const href = row.deleted_at ? `/admin/list/${row.type}` : `/admin/edit/${row.id}`;
    const live = imagesIn(row.published, fields);
    const draft = imagesIn(row.draft, fields);
    // One entry per (row, field); mark whether it's live, draft or both.
    const byKey = new Map<string, Usage & { path: string }>();
    for (const [list, state] of [[live, "live"], [draft, "draft"]] as const) {
      for (const f of list) {
        const key = `${f.path}|${f.field}`;
        const prev = byKey.get(key);
        byKey.set(key, { path: f.path, rowId: row.id, page, href, field: f.field, state: prev && prev.state !== state ? "live + draft" : state });
        if (!details.has(f.path) || f.img.blur) details.set(f.path, f.img);
      }
    }
    for (const { path, ...u } of byKey.values()) usage.set(path, [...(usage.get(path) ?? []), u]);
  }
  return { usage, details };
}

/** The whole library, newest first. */
export async function getLibrary(): Promise<MediaFile[]> {
  const [files, { usage, details }] = await Promise.all([listFiles(), usageByPath()]);
  const bucket = db().storage.from(BUCKET);
  return files
    .map((f) => {
      const d = details.get(f.path);
      return {
        ...f,
        url: bucket.getPublicUrl(f.path).data.publicUrl,
        ...(d?.width && d.height ? { width: d.width, height: d.height } : {}),
        ...(d?.blur ? { blur: d.blur } : {}),
        ...(d?.alt ? { alt: d.alt } : {}),
        usage: usage.get(f.path) ?? [],
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
