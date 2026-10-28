import type { CategorySlug, Game } from "./types";

export const PLAYER_FILTERS = [
  { value: "any", label: "ნებისმიერი რაოდენობა" },
  { value: "1", label: "სოლო" },
  { value: "2", label: "2 მოთამაშე" },
  { value: "3-4", label: "3–4 მოთამაშე" },
  { value: "5-6", label: "5–6 მოთამაშე" },
  { value: "7+", label: "7+ მოთამაშე" },
] as const;

export const DURATION_FILTERS = [
  { value: "any", label: "ნებისმიერი ხანგრძლივობა" },
  { value: "15", label: "15 წთ-მდე" },
  { value: "30", label: "30 წთ-მდე" },
  { value: "60", label: "1 საათამდე" },
  { value: "60+", label: "1 საათზე მეტი" },
] as const;

export const SORT_OPTIONS = [
  { value: "recent", label: "ბოლოს განახლებული" },
  { value: "az", label: "სახელის მიხედვით" },
  { value: "shortest", label: "ყველაზე მოკლე" },
  { value: "players", label: "ყველაზე მეტი მოთამაშე" },
] as const;

export type PlayerFilter = (typeof PLAYER_FILTERS)[number]["value"];
export type DurationFilter = (typeof DURATION_FILTERS)[number]["value"];
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export interface GameFilters {
  query: string;
  category: CategorySlug | "all";
  players: PlayerFilter;
  duration: DurationFilter;
  sort: SortOption;
}

export const DEFAULT_FILTERS: GameFilters = {
  query: "",
  category: "all",
  players: "any",
  duration: "any",
  sort: "recent",
};

export function isDefaultFilters(f: GameFilters): boolean {
  return (
    !f.query.trim() &&
    f.category === "all" &&
    f.players === "any" &&
    f.duration === "any"
  );
}

/** Does a game support the requested player band? */
export function matchesPlayers(game: Game, band: PlayerFilter): boolean {
  switch (band) {
    case "any":
      return true;
    case "1":
      return game.min_players <= 1;
    case "2":
      return game.min_players <= 2 && game.max_players >= 2;
    case "3-4":
      return game.min_players <= 4 && game.max_players >= 3;
    case "5-6":
      return game.min_players <= 6 && game.max_players >= 5;
    case "7+":
      return game.max_players >= 7;
  }
}

export function matchesDuration(game: Game, band: DurationFilter): boolean {
  switch (band) {
    case "any":
      return true;
    case "15":
      return game.duration_minutes <= 15;
    case "30":
      return game.duration_minutes <= 30;
    case "60":
      return game.duration_minutes <= 60;
    case "60+":
      return game.duration_minutes > 60;
  }
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/**
 * Relevance score for a free-text query. 0 = no match.
 * Title prefix > title word prefix > title substring > tag/category > tagline/rules.
 */
export function searchScore(game: Game, rawQuery: string): number {
  const q = normalize(rawQuery);
  if (!q) return 1;
  const terms = q.split(/\s+/).filter(Boolean);
  const title = normalize(game.title);
  const tags = game.tags.map(normalize);
  const tagline = normalize(game.tagline ?? "");
  const rules = normalize(game.rules_md);
  const category = normalize(game.category);

  let total = 0;
  for (const term of terms) {
    let best = 0;
    if (title.startsWith(term)) best = 100;
    else if (title.split(/\s+/).some((w) => w.startsWith(term))) best = 80;
    else if (title.includes(term)) best = 60;
    else if (tags.some((t) => t.startsWith(term)) || category.startsWith(term)) best = 45;
    else if (tags.some((t) => t.includes(term))) best = 35;
    else if (tagline.includes(term)) best = 25;
    else if (rules.includes(term)) best = 10;
    if (best === 0) return 0; // every term must match somewhere
    total += best;
  }
  return total;
}

export function filterGames(games: Game[], f: GameFilters): Game[] {
  const scored = games
    .map((g) => ({ g, score: searchScore(g, f.query) }))
    .filter(({ g, score }) => {
      if (score === 0) return false;
      if (f.category !== "all" && g.category !== f.category) return false;
      if (!matchesPlayers(g, f.players)) return false;
      if (!matchesDuration(g, f.duration)) return false;
      return true;
    });

  const hasQuery = f.query.trim().length > 0;
  scored.sort((a, b) => {
    if (hasQuery && a.score !== b.score) return b.score - a.score;
    switch (f.sort) {
      case "az":
        return a.g.title.localeCompare(b.g.title);
      case "shortest":
        return a.g.duration_minutes - b.g.duration_minutes || a.g.title.localeCompare(b.g.title);
      case "players":
        return b.g.max_players - a.g.max_players || a.g.title.localeCompare(b.g.title);
      case "recent":
      default:
        return b.g.updated_at.localeCompare(a.g.updated_at);
    }
  });

  return scored.map((s) => s.g);
}
