"use client";

/**
 * Client-side mutations. Two backends:
 *  - "local":    in-memory + localStorage (mock phase / no Supabase env)
 *  - "supabase": rows in Postgres + files in Storage buckets
 */
import { classifyFile, documentKind, slugify, uid } from "./format";
import { getSupabaseBrowser, hasSupabase } from "./supabase/client";
import { uploadToStorage } from "./supabase/storage";
import type { AttachedDocument, Game, GameInput, MediaFile, UploadKind } from "./types";

export const backend: "local" | "supabase" = hasSupabase ? "supabase" : "local";

export interface PersistedFiles {
  media: MediaFile[];
  documents: AttachedDocument[];
}

export interface FileMeta {
  caption?: string;
  title?: string;
}

/* ------------------------------------------------------------------ */
/*  helpers                                                            */
/* ------------------------------------------------------------------ */

const DATA_URL_LIMIT = 2.5 * 1024 * 1024; // images below this persist across reloads in local mode

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function mediaDuration(file: File, kind: "video" | "audio"): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const el = document.createElement(kind);
      const url = URL.createObjectURL(file);
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        resolve(Number.isFinite(el.duration) ? el.duration : null);
        URL.revokeObjectURL(url);
      };
      el.onerror = () => resolve(null);
      el.src = url;
    } catch {
      resolve(null);
    }
  });
}

async function localUrlFor(file: File, kind: UploadKind): Promise<string> {
  if (kind === "image" && file.size <= DATA_URL_LIMIT) return readAsDataURL(file);
  return URL.createObjectURL(file);
}

/* ------------------------------------------------------------------ */
/*  files                                                              */
/* ------------------------------------------------------------------ */

export async function persistFiles(
  gameId: string,
  files: File[],
  metaByName: Record<string, FileMeta> = {},
  onProgress?: (done: number, total: number) => void,
): Promise<PersistedFiles> {
  const media: MediaFile[] = [];
  const documents: AttachedDocument[] = [];
  const now = new Date().toISOString();
  let done = 0;

  for (const file of files) {
    const kind = classifyFile(file);
    if (!kind) {
      done++;
      onProgress?.(done, files.length);
      continue;
    }
    const meta = metaByName[file.name] ?? {};

    let url: string;
    if (backend === "supabase") {
      url = (await uploadToStorage(file, kind, gameId)).url;
    } else {
      url = await localUrlFor(file, kind);
    }

    if (kind === "document") {
      documents.push({
        id: uid("d"),
        game_id: gameId,
        kind: documentKind(file.name, file.type),
        name: file.name,
        url,
        size_bytes: file.size,
        mime_type: file.type,
        description: meta.caption ?? null,
        created_at: now,
      });
    } else {
      const duration = kind === "image" ? null : await mediaDuration(file, kind);
      media.push({
        id: uid("m"),
        game_id: gameId,
        kind,
        url,
        title: meta.title ?? (kind === "image" ? null : file.name.replace(/\.[^.]+$/, "")),
        caption: meta.caption ?? null,
        mime_type: file.type,
        size_bytes: file.size,
        duration_seconds: duration,
        created_at: now,
      });
    }
    done++;
    onProgress?.(done, files.length);
  }

  if (backend === "supabase" && (media.length || documents.length)) {
    const supabase = getSupabaseBrowser();
    if (media.length) {
      const rows = media.map(({ id: _id, ...m }) => m);
      const { data, error } = await supabase.from("media_files").insert(rows).select("*");
      if (error) throw error;
      media.splice(0, media.length, ...(data as MediaFile[]));
    }
    if (documents.length) {
      const rows = documents.map(({ id: _id, ...d }) => d);
      const { data, error } = await supabase.from("attached_documents").insert(rows).select("*");
      if (error) throw error;
      documents.splice(0, documents.length, ...(data as AttachedDocument[]));
    }
  }

  return { media, documents };
}

/* ------------------------------------------------------------------ */
/*  games                                                              */
/* ------------------------------------------------------------------ */

function uniqueSlug(title: string, taken: Set<string>): string {
  const base = slugify(title) || "game";
  let s = base;
  let i = 2;
  while (taken.has(s)) s = `${base}-${i++}`;
  return s;
}

export async function createGameRecord(input: GameInput, existing: Game[]): Promise<Game> {
  const now = new Date().toISOString();
  const slug = uniqueSlug(input.title, new Set(existing.map((g) => g.slug)));
  const draft: Game = {
    id: uid("g"),
    slug,
    title: input.title.trim(),
    tagline: input.tagline?.trim() || null,
    category: input.category,
    tags: input.tags,
    min_players: input.min_players,
    max_players: input.max_players,
    duration_minutes: input.duration_minutes,
    min_age: input.min_age ?? null,
    complexity: input.complexity ?? null,
    cover_url: input.cover_url ?? null,
    rules_md: input.rules_md,
    setup_md: input.setup_md?.trim() || null,
    notes_md: input.notes_md?.trim() || null,
    components: input.components,
    media: [],
    documents: [],
    created_at: now,
    updated_at: now,
  };

  if (backend === "local") return draft;

  const supabase = getSupabaseBrowser();
  const { id: _id, media: _m, documents: _d, created_at: _c, updated_at: _u, ...row } = draft;
  const { data, error } = await supabase.from("games").insert(row).select("*").single();
  if (error) throw error;
  return { ...(data as Omit<Game, "media" | "documents">), media: [], documents: [] };
}

export async function updateGameRecord(game: Game, input: GameInput): Promise<Game> {
  const next: Game = {
    ...game,
    title: input.title.trim(),
    tagline: input.tagline?.trim() || null,
    category: input.category,
    tags: input.tags,
    min_players: input.min_players,
    max_players: input.max_players,
    duration_minutes: input.duration_minutes,
    min_age: input.min_age ?? null,
    complexity: input.complexity ?? null,
    cover_url: input.cover_url ?? game.cover_url ?? null,
    rules_md: input.rules_md,
    setup_md: input.setup_md?.trim() || null,
    notes_md: input.notes_md?.trim() || null,
    components: input.components,
    updated_at: new Date().toISOString(),
  };

  if (backend === "local") return next;

  const supabase = getSupabaseBrowser();
  const { id, media: _m, documents: _d, created_at: _c, updated_at: _u, slug: _s, ...row } = next;
  const { error } = await supabase.from("games").update(row).eq("id", id);
  if (error) throw error;
  return next;
}

export async function setCoverUrl(gameId: string, coverUrl: string): Promise<void> {
  if (backend === "local") return;
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("games").update({ cover_url: coverUrl }).eq("id", gameId);
  if (error) throw error;
}

export async function deleteMediaRecord(mediaId: string): Promise<void> {
  if (backend === "local") return;
  const { error } = await getSupabaseBrowser().from("media_files").delete().eq("id", mediaId);
  if (error) throw error;
}

export async function deleteDocumentRecord(docId: string): Promise<void> {
  if (backend === "local") return;
  const { error } = await getSupabaseBrowser().from("attached_documents").delete().eq("id", docId);
  if (error) throw error;
}
