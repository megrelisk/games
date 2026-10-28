"use client";

/** Client-side mutations for the event's program and to-do list. Same dual backend as repository.ts. */
import { backend } from "./repository";
import { getSupabaseBrowser } from "./supabase/client";
import { uid } from "./format";
import type { EventRecord, Game, ProgramEntry, TodoItem } from "./types";

function renumber<T extends { position: number }>(items: T[]): T[] {
  return items.map((item, i) => ({ ...item, position: i }));
}

/* ------------------------------------------------------------------ */
/*  Program                                                             */
/* ------------------------------------------------------------------ */

export async function addProgramItem(event: EventRecord, game: Game): Promise<ProgramEntry> {
  const now = new Date().toISOString();
  const entry: ProgramEntry = {
    id: uid("pi"),
    event_id: event.id,
    game_id: game.id,
    position: event.program.length,
    note: null,
    created_at: now,
    game,
  };

  if (backend === "supabase") {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("event_program_items")
      .insert({ event_id: event.id, game_id: game.id, position: entry.position })
      .select("*")
      .single();
    if (error) throw error;
    return { ...data, game };
  }
  return entry;
}

export async function removeProgramItem(itemId: string, program: ProgramEntry[]): Promise<ProgramEntry[]> {
  if (backend === "supabase") {
    const { error } = await getSupabaseBrowser().from("event_program_items").delete().eq("id", itemId);
    if (error) throw error;
  }
  return renumber(program.filter((p) => p.id !== itemId));
}

/** Swaps the item at `index` with its neighbour in `direction`. */
export async function moveProgramItem(
  program: ProgramEntry[],
  index: number,
  direction: -1 | 1,
): Promise<ProgramEntry[]> {
  const target = index + direction;
  if (target < 0 || target >= program.length) return program;

  const next = program.slice();
  [next[index], next[target]] = [next[target], next[index]];
  const renumbered = renumber(next);

  if (backend === "supabase") {
    const supabase = getSupabaseBrowser();
    const [a, b] = [renumbered[index], renumbered[target]];
    const { error } = await supabase.from("event_program_items").upsert([
      { id: a.id, event_id: a.event_id, game_id: a.game_id, position: a.position, note: a.note ?? null },
      { id: b.id, event_id: b.event_id, game_id: b.game_id, position: b.position, note: b.note ?? null },
    ]);
    if (error) throw error;
  }
  return renumbered;
}

/* ------------------------------------------------------------------ */
/*  Todos                                                               */
/* ------------------------------------------------------------------ */

export async function addTodoItem(
  event: EventRecord,
  category: string,
  label: string,
): Promise<TodoItem> {
  const now = new Date().toISOString();
  const item: TodoItem = {
    id: uid("td"),
    event_id: event.id,
    category: category.trim(),
    label: label.trim(),
    done: false,
    position: event.todos.length,
    created_at: now,
  };

  if (backend === "supabase") {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("todo_items")
      .insert({ event_id: event.id, category: item.category, label: item.label, position: item.position })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }
  return item;
}

export async function toggleTodoItem(itemId: string, done: boolean): Promise<void> {
  if (backend === "supabase") {
    const { error } = await getSupabaseBrowser().from("todo_items").update({ done }).eq("id", itemId);
    if (error) throw error;
  }
}

export async function removeTodoItem(itemId: string, todos: TodoItem[]): Promise<TodoItem[]> {
  if (backend === "supabase") {
    const { error } = await getSupabaseBrowser().from("todo_items").delete().eq("id", itemId);
    if (error) throw error;
  }
  return renumber(todos.filter((t) => t.id !== itemId));
}
