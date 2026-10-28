import "server-only";

import { MOCK_EVENT } from "./event-mock-data";
import { MOCK_GAMES } from "./mock-data";
import { hasSupabase } from "./supabase/client";
import { getSupabaseServer } from "./supabase/server";
import type { AttachedDocument, EventRecord, Game, MediaFile, ProgramEntry, ProgramItem, TodoItem } from "./types";

/* Row → domain mappers (Supabase returns snake_case already matching our types) */
type GameRow = Omit<Game, "media" | "documents"> & {
  media_files?: MediaFile[] | null;
  attached_documents?: AttachedDocument[] | null;
};

function mapGame(row: GameRow): Game {
  const { media_files, attached_documents, ...rest } = row;
  return {
    ...rest,
    tags: rest.tags ?? [],
    components: rest.components ?? [],
    media: (media_files ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    documents: (attached_documents ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

const SELECT = "*, media_files(*), attached_documents(*)";

/** All games, newest-updated first. Falls back to mock data without Supabase. */
export async function getGames(): Promise<Game[]> {
  if (!hasSupabase) return MOCK_GAMES;
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("games")
      .select(SELECT)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data as GameRow[]).map(mapGame);
  } catch (err) {
    console.error("[data] getGames failed, falling back to mock:", err);
    return MOCK_GAMES;
  }
}

/** One game by id or slug. */
export async function getGame(idOrSlug: string): Promise<Game | null> {
  if (!hasSupabase) {
    return MOCK_GAMES.find((g) => g.id === idOrSlug || g.slug === idOrSlug) ?? null;
  }
  try {
    const supabase = getSupabaseServer();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const { data, error } = await supabase
      .from("games")
      .select(SELECT)
      .eq(isUuid ? "id" : "slug", idOrSlug)
      .maybeSingle();
    if (error) throw error;
    return data ? mapGame(data as GameRow) : null;
  } catch (err) {
    console.error("[data] getGame failed:", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Events                                                              */
/* ------------------------------------------------------------------ */

type EventRow = Omit<EventRecord, "program" | "todos"> & {
  event_program_items?: (ProgramItem & { games: Game | null })[] | null;
  todo_items?: TodoItem[] | null;
};

function mapEvent(row: EventRow): EventRecord {
  const { event_program_items, todo_items, ...rest } = row;
  const program: ProgramEntry[] = (event_program_items ?? [])
    .filter((p): p is ProgramItem & { games: Game } => Boolean(p.games))
    .map(({ games, ...item }) => ({ ...item, game: games }))
    .sort((a, b) => a.position - b.position);
  return {
    ...rest,
    program,
    todos: (todo_items ?? []).sort((a, b) => a.position - b.position),
  };
}

const EVENT_SELECT = "*, event_program_items(*, games(*)), todo_items(*)";

/** The (single, for now) event by slug. Falls back to mock data without Supabase. */
export async function getEvent(slug: string): Promise<EventRecord | null> {
  if (!hasSupabase) {
    return MOCK_EVENT.slug === slug ? MOCK_EVENT : null;
  }
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? mapEvent(data as EventRow) : null;
  } catch (err) {
    console.error("[data] getEvent failed, falling back to mock:", err);
    return MOCK_EVENT.slug === slug ? MOCK_EVENT : null;
  }
}
