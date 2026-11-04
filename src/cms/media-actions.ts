"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "./auth";
import { BUCKET, getLibrary, usageByPath, type MediaFile } from "./media";
import { db } from "./store";
import type { ActionResult } from "./actions";

/** The photo library for the "Choose from library" picker (any staff member). */
export async function listLibrary(): Promise<ActionResult<{ files: MediaFile[] }>> {
  await requireUser();
  try {
    return { ok: true, files: await getLibrary() };
  } catch {
    return { ok: false, error: "Couldn't load the photo library." };
  }
}

const SAFE_PATH = /^(uploads|seed)\/[\w./-]+$/;

/**
 * Delete photos (owners only). Usage is re-checked here, so a photo that
 * someone started using since the page loaded is never deleted.
 */
export async function deleteMedia(paths: string[]): Promise<ActionResult<{ deleted: number; skipped: number }>> {
  await requireUser("owner");
  const wanted = [...new Set(paths)].filter((p) => SAFE_PATH.test(p) && !p.includes(".."));
  if (!wanted.length || wanted.length > 500) return { ok: false, error: "Nothing to delete." };

  const { usage } = await usageByPath();
  const free = wanted.filter((p) => !usage.has(p));
  if (!free.length) return { ok: false, error: "These photos are in use on the site, so they can't be deleted." };

  const { data, error } = await db().storage.from(BUCKET).remove(free);
  if (error) return { ok: false, error: "Couldn't delete the photos. Please try again." };
  revalidatePath("/admin/media");
  return { ok: true, deleted: data.length, skipped: wanted.length - free.length };
}
