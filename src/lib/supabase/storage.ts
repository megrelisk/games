import type { UploadKind } from "@/lib/types";
import { slugify, uid } from "@/lib/format";

import { getSupabaseBrowser } from "./client";

/** Storage bucket per upload kind — created by supabase/schema.sql */
export const BUCKETS: Record<UploadKind, string> = {
  image: "game-images",
  video: "game-videos",
  audio: "game-audio",
  document: "game-docs",
};

export interface UploadedObject {
  url: string;
  path: string;
  bucket: string;
  size_bytes: number;
  mime_type: string;
}

/**
 * Uploads a File to the bucket matching its kind and returns its public URL.
 * Path layout: `<gameId>/<timestamp>-<uid>-<slugified-name>.<ext>`
 */
export async function uploadToStorage(
  file: File,
  kind: UploadKind,
  gameId: string,
  onProgress?: (pct: number) => void,
): Promise<UploadedObject> {
  const supabase = getSupabaseBrowser();
  const bucket = BUCKETS[kind];
  const dot = file.name.lastIndexOf(".");
  const base = dot >= 0 ? file.name.slice(0, dot) : file.name;
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
  const path = `${gameId}/${Date.now()}-${uid()}-${slugify(base)}${ext}`;

  onProgress?.(5);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  onProgress?.(100);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return {
    url: data.publicUrl,
    path,
    bucket,
    size_bytes: file.size,
    mime_type: file.type,
  };
}
