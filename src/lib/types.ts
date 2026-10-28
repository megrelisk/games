export const CATEGORIES = [
  { slug: "board", label: "სამაგიდო თამაშები", short: "სამაგიდო" },
  { slug: "card", label: "კარტის თამაშები", short: "კარტი" },
  { slug: "sheet", label: "ფურცლის თამაშები", short: "ფურცელი" },
  { slug: "party", label: "წვეულების თამაშები", short: "წვეულება" },
  { slug: "dice", label: "კამათლის თამაშები", short: "კამათელი" },
  { slug: "word", label: "სიტყვისა და ერუდიციის თამაშები", short: "სიტყვა" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export type MediaKind = "image" | "video" | "audio";

export interface MediaFile {
  id: string;
  game_id: string;
  kind: MediaKind;
  url: string;
  /** Optional poster/thumbnail (videos) */
  poster_url?: string | null;
  title?: string | null;
  caption?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  duration_seconds?: number | null;
  width?: number | null;
  height?: number | null;
  created_at: string;
}

export type DocumentKind = "pdf" | "docx" | "xlsx" | "pptx" | "other";

export interface AttachedDocument {
  id: string;
  game_id: string;
  kind: DocumentKind;
  name: string;
  url: string;
  size_bytes?: number | null;
  mime_type?: string | null;
  description?: string | null;
  created_at: string;
}

export interface ComponentItem {
  id: string;
  label: string;
  qty?: string | null;
  optional?: boolean;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  category: CategorySlug;
  tags: string[];
  min_players: number;
  max_players: number;
  /** Typical play time in minutes */
  duration_minutes: number;
  min_age?: number | null;
  /** 1 (light) – 5 (heavy) */
  complexity?: number | null;
  cover_url?: string | null;
  /** Markdown */
  rules_md: string;
  /** Markdown */
  setup_md?: string | null;
  /** Markdown */
  notes_md?: string | null;
  components: ComponentItem[];
  media: MediaFile[];
  documents: AttachedDocument[];
  created_at: string;
  updated_at: string;
}

/** Payload for creating/editing a game from the form. */
export interface GameInput {
  title: string;
  tagline?: string;
  category: CategorySlug;
  tags: string[];
  min_players: number;
  max_players: number;
  duration_minutes: number;
  min_age?: number | null;
  complexity?: number | null;
  cover_url?: string | null;
  rules_md: string;
  setup_md?: string;
  notes_md?: string;
  components: ComponentItem[];
}

export type UploadKind = MediaKind | "document";

/** One activity in an event's running order — points at a game in the collection. */
export interface ProgramItem {
  id: string;
  event_id: string;
  game_id: string;
  position: number;
  note?: string | null;
  created_at: string;
}

/** A program item hydrated with the game it points to, for display. */
export interface ProgramEntry extends ProgramItem {
  game: Game;
}

/** One checklist item in an event's prep to-do list, grouped by category. */
export interface TodoItem {
  id: string;
  event_id: string;
  category: string;
  label: string;
  done: boolean;
  position: number;
  created_at: string;
}

export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  /** ISO date, e.g. "2026-09-13" */
  event_date: string;
  notes_md?: string | null;
  program: ProgramEntry[];
  todos: TodoItem[];
  created_at: string;
  updated_at: string;
}
