"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Img } from "@/content/types";
import { getUploadUrl } from "./actions";
import { prepareImage } from "./image-prep";

let storage: SupabaseClient | null = null;
function client() {
  // The signed upload token authorises the upload; no session needed.
  storage ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return storage;
}

/** Shrink a photo in the browser and upload it. Keeps alt text and focal point from `keep`. */
export async function uploadPhoto(file: File, keep?: Partial<Img>): Promise<Img> {
  const prepared = await prepareImage(file);
  const signed = await getUploadUrl(prepared.type);
  if (!signed.ok) throw new Error(signed.error);
  const { error } = await client().storage.from("media").uploadToSignedUrl(signed.path, signed.token, prepared.file, {
    contentType: prepared.type,
    cacheControl: "31536000",
  });
  if (error) throw new Error("The upload failed. Check your connection and try again.");
  return {
    src: signed.publicUrl,
    alt: keep?.alt ?? "",
    width: prepared.width,
    height: prepared.height,
    ...(keep?.position ? { position: keep.position } : {}),
    ...(prepared.blur ? { blur: prepared.blur } : {}),
  };
}
